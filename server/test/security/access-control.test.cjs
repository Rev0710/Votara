const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const jwt = require("jsonwebtoken");
const express = require("express");

const root = path.resolve(__dirname, "../..");
const secret = "security-test-only-secret-not-used-in-production";
const env = { JWT_SECRET: secret };
const quiet = { log() {}, error() {}, warn() {} };
function load(file, dependencies = {}) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), {
        module, exports: module.exports, process: { env }, console: quiet,
        Date, Buffer, setInterval, clearInterval,
        require(name) { return Object.hasOwn(dependencies, name) ? dependencies[name] : require(name); },
    }, { filename: file });
    return module.exports;
}
function response() {
    return { code: 200, body: null, status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; } };
}
function database(results) {
    const calls = [];
    return { calls, from(table) {
        const query = { table, filters: [], operation: "select", values: undefined };
        calls.push(query);
        const chain = {
            select() { return chain; }, order() { return chain; }, limit() { return chain; },
            eq(key, value) { query.filters.push([key, value]); return chain; },
            update(values) { query.operation = "update"; query.values = values; return chain; },
            insert(values) { query.operation = "insert"; query.values = values; return chain; },
            maybeSingle() { return chain; }, single() { return chain; },
            then(resolve, reject) {
                const result = typeof results === "function" ? results(query) : results;
                return Promise.resolve(result).then(resolve, reject);
            },
        };
        return chain;
    } };
}
const sessions = load("src/services/registrationSessionService.js");
const registration = { id: "application-1", student_id: "12345", email: "student@gmail.com",
    full_name: "Test Student", year_level: "2nd Year", registration_type: "normal", application_status: "otp_verified" };
const tokenFor = (overrides = {}, options = {}) => jwt.sign({ registrationId: registration.id,
    studentId: registration.student_id, email: registration.email, purpose: "registration", ...overrides },
    secret, { audience: "votara-registration", expiresIn: "1h", ...options });
const applicant = token => ({ method: "POST", headers: token ? { "x-registration-token": token } : {},
    body: { studentId: registration.student_id, email: registration.email } });

for (const [label, token] of [
    ["missing", null], ["forged", "forged-token"],
    ["expired", tokenFor({}, { expiresIn: -1 })],
    ["wrong audience", tokenFor({}, { audience: "another-service" })],
    ["wrong purpose", tokenFor({ purpose: "login" })],
    ["different student", tokenFor({ studentId: "99999" })],
    ["different email", tokenFor({ email: "other@gmail.com" })],
]) {
    test(`registration writes reject ${label} credentials`, () => {
        const res = response(); let continued = false;
        sessions.requireRegistrationSession(applicant(token), res, () => { continued = true; });
        assert.equal(res.code, 401); assert.equal(continued, false);
    });
}
test("registration capability is scoped, signed and bound to the exact application", () => {
    const token = sessions.issueRegistrationToken(registration);
    const req = applicant(token); let continued = false;
    sessions.requireRegistrationSession(req, response(), () => { continued = true; });
    assert.equal(continued, true);
    assert.equal(sessions.ownsRegistration(req, registration), true);
    assert.equal(sessions.ownsRegistration(req, { ...registration, id: "replacement" }), false);
    const claims = jwt.verify(token, secret, { audience: "votara-registration" });
    assert.equal(claims.role, "registration");
    assert.equal(claims.exp - claims.iat, 7 * 24 * 60 * 60);
});

const staffToken = (role = "electoral_board", overrides = {}) => jwt.sign({ userId: "staff-1", role, ...overrides }, secret);
const staffRequest = token => ({ headers: token ? { authorization: `Bearer ${token}` } : {} });
const staff = { id: "staff-1", role: "electoral_board", is_active: true, full_name: "Test Staff" };
for (const [label, token, result, status] of [
    ["missing login", null, { data: staff }, 401],
    ["invalid signature", "bad", { data: staff }, 401],
    ["student role", staffToken("student"), { data: staff }, 403],
    ["inactive account", staffToken(), { data: { ...staff, is_active: false } }, 403],
    ["deleted account", staffToken(), { data: null }, 403],
    ["changed role", staffToken(), { data: { ...staff, role: "student" } }, 403],
    ["database failure", staffToken(), { error: { message: "offline" } }, 503],
]) {
    test(`staff access rejects ${label}`, async () => {
        const db = database(result);
        const requireStaff = load("src/middleware/requireStaff.js", { "../config/supabase": db });
        const res = response(); let continued = false;
        await requireStaff("admin", "electoral_board")(staffRequest(token), res, () => { continued = true; });
        assert.equal(res.code, status); assert.equal(continued, false);
    });
}
for (const role of ["admin", "electoral_board"]) {
    test(`active ${role} retains election access and audit identity`, async () => {
        const requireStaff = load("src/middleware/requireStaff.js", {
            "../config/supabase": database({ data: { ...staff, role } }),
        });
        const req = staffRequest(staffToken(role)); let continued = false;
        await requireStaff("admin", "electoral_board")(req, response(), () => { continued = true; });
        assert.equal(continued, true); assert.equal(req.user.id, staff.id); assert.equal(req.user.role, role);
    });
}

async function requestRouter(router, method, url, token) {
    return new Promise((resolve, reject) => {
        const res = response(); const json = res.json;
        res.json = function (body) { json.call(this, body); resolve(this); return this; };
        router.handle({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, body: {} }, res,
            error => error ? reject(error) : resolve({ code: 404 }));
    });
}
test("every election mutation is protected while public reads remain available", async () => {
    const requireStaff = load("src/middleware/requireStaff.js", { "../config/supabase": database({ data: staff }) });
    let actions = 0;
    const controllers = new Proxy({}, { get: () => (req, res) => { actions++; return res.status(200).json({ success: true }); } });
    const router = load("src/routes/electionRoutes.js", { express, "../middleware/requireStaff": requireStaff,
        "../controllers/electionController": controllers });
    for (const [method, url] of [["POST", "/"], ["PUT", "/e1"], ["DELETE", "/e1"],
        ["PATCH", "/e1/status"], ["PATCH", "/e1/publish"], ["PATCH", "/e1/unpublish"],
        ["POST", "/e1/positions"], ["PUT", "/positions/p1"], ["PATCH", "/positions/p1/deactivate"]]) {
        assert.equal((await requestRouter(router, method, url)).code, 401);
    }
    assert.equal(actions, 0);
    assert.equal((await requestRouter(router, "GET", "/active")).code, 200);
    assert.equal((await requestRouter(router, "POST", "/", staffToken())).code, 200);
    assert.equal(actions, 2);
});

function prepare(db, send = async () => {}) {
    return load("src/middleware/registrationSession.js", {
        "../config/supabase": db, "../utils/otp": { generateOTP: () => "123456" },
        bcryptjs: { hash: async () => "test-otp-hash" },
        "../services/emailService": { sendOTPEmail: send },
        "../services/registrationSessionService": sessions,
    });
}
test("a new late-enrollee draft gets a capability without an added screen", async () => {
    const res = response(); const req = applicant();
    await prepare(database({ data: null }))(req, res, () => {
        res.json({ success: true, registrationId: "new-draft", isLateEnrollee: true });
    });
    const claims = jwt.verify(res.body.registrationToken, secret, { audience: "votara-registration" });
    assert.equal(claims.registrationId, "new-draft"); assert.equal(claims.studentId, "12345");
});
for (const status of ["draft", "otp_verified", "needs_correction"]) {
    test(`existing late ${status} cannot be claimed using identifiers alone`, async () => {
        let sent = 0; let continued = false;
        const db = database(q => ({ data: q.table === "registration_applications"
            ? { ...registration, registration_type: "late", application_status: status } : null }));
        const res = response();
        await prepare(db, async () => { sent++; })(applicant(), res, () => { continued = true; });
        assert.equal(sent, 1); assert.equal(continued, false);
        assert.equal(res.body.requiresOTP, true); assert.equal(res.body.registrationToken, undefined);
        assert.equal(db.calls.some(q => q.table === "registration_applications" && q.operation === "update"), false);
    });
}
test("the original applicant can resume without another OTP", async () => {
    let sent = false; let continued = false;
    const req = applicant(sessions.issueRegistrationToken(registration));
    await prepare(database({ data: registration }), async () => { sent = true; })(req, response(), () => { continued = true; });
    assert.equal(continued, true); assert.equal(sent, false);
});
test("changing the email cannot take over a verified registration", async () => {
    const req = applicant(); req.body.email = "other@gmail.com";
    const res = response(); let continued = false;
    await prepare(database({ data: registration }))(req, res, () => { continued = true; });
    assert.equal(res.code, 409); assert.equal(continued, false);
});
test("failed recovery email invalidates the generated OTP", async () => {
    const db = database(q => ({ data: q.table === "registration_applications" ? registration : null }));
    const res = response();
    await prepare(db, async () => { throw Error("email offline"); })(applicant(), res, () => assert.fail("must not continue"));
    assert.equal(res.code, 503);
    assert.ok(db.calls.some(q => q.table === "otp_codes" && q.filters.some(([key]) => key === "otp_hash")
        && q.values?.verification_status === "invalidated"));
});

test("diagnostics require admin authentication in the actual server source", () => {
    const source = fs.readFileSync(path.join(root, "server.js"), "utf8");
    for (const route of ["/api/test-supabase", "/api/test-supabase-student/:studentId"]) {
        const position = source.indexOf(`"${route}"`);
        assert.ok(position >= 0);
        assert.match(source.slice(position, position + 110), /requireStaff\("admin"\)/);
    }
});

test("document and personal-information routes enforce registration credentials", async () => {
    let actions = 0;
    const controller = new Proxy({}, { get: () => (req, res) => { actions++; return res.json({ success: true }); } });
    const documents = load("src/routes/registrationDocumentsRoutes.js", { express,
        "../services/registrationSessionService": sessions,
        "../controllers/registrationDocumentsController": controller });
    const routes = load("src/routes/registrationRoutes.js", { express,
        "../services/registrationSessionService": sessions,
        "../middleware/registrationSession": (req, res, next) => next(),
        "../controllers/registrationController": controller });
    assert.equal((await requestRouter(documents, "POST", "/upload")).code, 401);
    assert.equal((await requestRouter(routes, "POST", "/submit")).code, 401);
    assert.equal(actions, 0);
});

function registrationController(db) {
    return load("src/controllers/registrationController.js", {
        "../services/registrationSessionService": sessions, "../config/supabase": db,
        bcryptjs: { compare: async () => true, hash: async () => "test-otp-hash" }, "../utils/otp": { generateOTP: () => "123456" },
        "../services/emailService": { sendOTPEmail: async () => {} },
    });
}
function verificationDatabase(current, consumed = true) {
    return database(q => {
        if (q.table === "otp_codes" && q.operation === "select") return { data: {
            id: "otp-1", registration_id: registration.id, student_id: registration.student_id,
            email: registration.email, otp_hash: "hash", attempt_count: 0, max_attempts: 5,
            expires_at: new Date(Date.now() + 60000).toISOString(),
        } };
        if (q.table === "otp_codes") return { data: consumed ? { id: "otp-1" } : null };
        if (q.operation === "update") return { data: { ...current, ...q.values } };
        return { data: current };
    });
}
for (const status of ["draft", "otp_verified", "needs_correction"]) {
    test(`OTP verification issues credentials and preserves ${status} workflow`, async () => {
        const current = { ...registration, application_status: status, correction_message: "Replace front ID" };
        const db = verificationDatabase(current); const res = response();
        await registrationController(db).verifyRegistrationOTP({ body: {
            studentId: registration.student_id, email: registration.email, otp: "123456",
        } }, res);
        assert.equal(res.code, 200);
        const expected = status === "needs_correction" ? status : "otp_verified";
        assert.equal(res.body.registrationStatus, expected);
        assert.equal(res.body.correctionMessage, current.correction_message);
        assert.equal(sessions.ownsRegistration(applicant(res.body.registrationToken), current), true);
        const consume = db.calls.find(q => q.table === "otp_codes" && q.operation === "update");
        assert.ok(consume.filters.some(([key, value]) => key === "verification_status" && value === "active"));
        const update = db.calls.find(q => q.table === "registration_applications" && q.operation === "update");
        assert.equal(update.values.application_status, expected);
        assert.ok(update.filters.some(([key, value]) => key === "application_status" && value === status));
    });
}
for (const status of ["pending_review", "approved", "rejected", "cancelled"]) {
    test(`an old OTP cannot reopen a ${status} application`, async () => {
        const db = verificationDatabase({ ...registration, application_status: status }); const res = response();
        await registrationController(db).verifyRegistrationOTP({ body: {
            studentId: registration.student_id, email: registration.email, otp: "123456",
        } }, res);
        assert.equal(res.code, 400); assert.equal(res.body.registrationToken, undefined);
        assert.equal(db.calls.some(q => q.operation === "update"), false);
    });
}
test("an old OTP cannot authorize a changed registration email", async () => {
    const db = verificationDatabase({ ...registration, email: "changed@gmail.com" }); const res = response();
    await registrationController(db).verifyRegistrationOTP({ body: {
        studentId: registration.student_id, email: registration.email, otp: "123456",
    } }, res);
    assert.equal(res.code, 400); assert.equal(res.body.registrationToken, undefined);
});
test("replayed OTP consumption cannot issue a registration credential", async () => {
    const db = verificationDatabase(registration, false); const res = response();
    await registrationController(db).verifyRegistrationOTP({ body: {
        studentId: registration.student_id, email: registration.email, otp: "123456",
    } }, res);
    assert.ok(res.code >= 400); assert.equal(res.body.registrationToken, undefined);
    assert.equal(db.calls.some(q => q.table === "registration_applications" && q.operation === "update"), false);
});
test("document controller rejects a token for a replaced application before storing files", async () => {
    const db = database({ data: { ...registration, id: "newer-application" } });
    const controller = load("src/controllers/registrationDocumentsController.js", {
        "../config/supabase": db, "../services/registrationSessionService": sessions,
    });
    const res = response();
    await controller.uploadRegistrationRequirements(applicant(sessions.issueRegistrationToken(registration)), res);
    assert.equal(res.code, 401);
    assert.equal(db.calls.some(q => q.operation !== "select"), false);
});
test("personal-information controller rejects a token for a replaced application", async () => {
    const db = database({ data: { ...registration, id: "newer-application" } });
    const req = applicant(sessions.issueRegistrationToken(registration));
    Object.assign(req.body, { birthday: "2000-01-01", contactNumber: "09123456789" });
    const res = response(); await registrationController(db).submitRegistration(req, res);
    assert.equal(res.code, 401); assert.equal(db.calls.some(q => q.operation !== "select"), false);
});

test("party-list changes require staff but public listing stays available", async () => {
    const requireStaff = load("src/middleware/requireStaff.js", { "../config/supabase": database({ data: staff }) });
    let actions = 0;
    const controllers = new Proxy({}, { get: () => (req, res) => { actions++; return res.json({ success: true }); } });
    const router = load("src/routes/partyListRoutes.js", { express, "../middleware/requireStaff": requireStaff,
        "../controllers/partyListController": controllers });
    for (const [method, url] of [["POST", "/"], ["PUT", "/p1"], ["DELETE", "/p1"],
        ["PATCH", "/p1/approve"], ["PATCH", "/p1/reject"], ["PATCH", "/p1/activate"], ["PATCH", "/p1/deactivate"]]) {
        assert.equal((await requestRouter(router, method, url)).code, 401);
    }
    assert.equal(actions, 0);
    assert.equal((await requestRouter(router, "GET", "/")).code, 200);
    assert.equal((await requestRouter(router, "POST", "/", staffToken())).code, 200);
});

for (const action of ["sendRegistrationOTP", "resendRegistrationOTP"]) {
    test(`${action} sends a fresh code for the existing OTP screen`, async () => {
        const db = database(q => {
            if (q.table === "students") return { data: { ...registration, enrollment_status: "ACTIVE" } };
            if (q.table === "student_accounts") return { data: null };
            if (q.table === "registration_applications") {
                if (q.operation === "select" && q.filters.some(([key]) => key === "email")
                    && !q.filters.some(([key]) => key === "student_id")) return { data: [registration] };
                return { data: { ...registration, ...q.values } };
            }
            return { data: null };
        });
        const res = response();
        await registrationController(db)[action](applicant(sessions.issueRegistrationToken(registration)), res);
        assert.equal(res.code, 200);
        assert.equal(res.body.success, true);
        assert.notEqual(res.body.alreadyVerified, true);
        assert.ok(db.calls.some(q => q.table === "otp_codes" && q.operation === "insert"
            && q.values.registration_id === registration.id));
    });
}
