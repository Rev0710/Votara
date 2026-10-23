const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const jwt = require("jsonwebtoken");

// Exercise the actual browser helpers/interceptor without a browser or live API.
function browserContext(values = {}, pathname = "/registration-requirements") {
    const storage = new Map(Object.entries(values));
    const context = vm.createContext({
        localStorage: { getItem: key => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        window: { location: { pathname } },
        console: { log() {}, error() {}, warn() {} },
        atob: value => Buffer.from(value, "base64").toString("binary"),
    });
    const services = path.resolve(__dirname, "../../../client/src/services");
    let source = fs.readFileSync(path.join(services, "registrationSession.js"), "utf8");
    source = source.replace(/export const /g, "const ");
    vm.runInContext(`${source}\nglobalThis.sessions = { getRegistrationToken, saveRegistrationToken, registrationHeaders };`, context);
    context.axios = { create: () => ({ interceptors: {
        request: { use: callback => { context.request = callback; } },
        response: { use() {} },
    } }) };
    source = fs.readFileSync(path.join(services, "api.js"), "utf8")
        .replace(/^import .*;\r?\n/gm, "")
        .replace(/import\.meta\.env\.VITE_API_BASE_URL/g, '"http://test.invalid/api"')
        .replace(/import\.meta\.env\.PROD/g, "false")
        .replace(/^export const /gm, "const ")
        .replace("export default api;", "");
    vm.runInContext(source, context);
    return context;
}

test("registration credentials are isolated by student and normalized email", () => {
    const context = browserContext();
    context.sessions.saveRegistrationToken("12345", "Student@gmail.com", "private-token");
    assert.equal(context.sessions.getRegistrationToken("12345", "student@gmail.com"), "private-token");
    assert.equal(context.sessions.getRegistrationToken("99999", "student@gmail.com"), "");
    assert.equal(context.sessions.getRegistrationToken("12345", "other@gmail.com"), "");
});
test("document uploads automatically include matching registration credentials", () => {
    const context = browserContext();
    context.sessions.saveRegistrationToken("12345", "student@gmail.com", "private-token");
    const config = context.request({ url: "/registration-documents/upload", headers: {},
        data: { studentId: "12345", email: "student@gmail.com" } });
    assert.equal(config.headers["X-Registration-Token"], "private-token");
});
test("registration credentials never attach to unrelated requests or applicants", () => {
    const context = browserContext();
    context.sessions.saveRegistrationToken("12345", "student@gmail.com", "private-token");
    for (const config of [
        { url: "/elections", headers: {}, data: { studentId: "12345", email: "student@gmail.com" } },
        { url: "/registration-documents/upload", headers: {}, data: { studentId: "99999", email: "student@gmail.com" } },
    ]) assert.equal(context.request(config).headers["X-Registration-Token"], undefined);
});
test("explicit staff authorization survives registration-header attachment", () => {
    const context = browserContext();
    context.sessions.saveRegistrationToken("12345", "student@gmail.com", "private-token");
    const config = context.request({ url: "/registration-documents/upload", headers: { Authorization: "Bearer explicit-staff" },
        data: { studentId: "12345", email: "student@gmail.com" } });
    assert.equal(config.headers.Authorization, "Bearer explicit-staff");
    assert.equal(config.headers["X-Registration-Token"], "private-token");
});
test("student voting retains its existing student credential", () => {
    const token = jwt.sign({role: "student", studentId: "57476"}, "test-only-secret");
    const context = browserContext({ votaraToken: token }, "/vote");
    assert.equal(context.request({ url: "/voting/submit", headers: {}, data: {} }).headers.Authorization, "Bearer " + token);
});
test("kiosk voting retains its temporary kiosk credential", () => {
    const context = browserContext({ votaraToken: "student-token", votaraKioskMode: "true", votaraKioskToken: "kiosk-token" }, "/kiosk-voting");
    assert.equal(context.request({ url: "/voting/submit", headers: {}, data: {} }).headers.Authorization, "Bearer kiosk-token");
});
test("admin election changes retain the admin credential", () => {
    const context = browserContext({ votaraAdminToken: "admin-token" }, "/admin/election");
    assert.equal(context.request({ url: "/elections/e1/publish", headers: {} }).headers.Authorization, "Bearer admin-token");
});
test("Electoral Board election changes retain the board credential", () => {
    const token = jwt.sign({ role: "electoral_board" }, "test-only-secret");
    const context = browserContext({ votaraStaffToken: token }, "/electoral-board/election-management");
    assert.equal(context.request({ url: "/elections/e1/publish", headers: {} }).headers.Authorization, `Bearer ${token}`);
});

// Execute the real registration loader to cover the previously conflicting
// dashboard and review-page token choices, without a live API or database.
function registrationPageContext(values) {
    const context = browserContext(values, "/electoral-board/dashboard");
    context.recordedRequests = [];
    context.redirects = [];
    context.navigate = pathname => context.redirects.push(pathname);
    context.setError = () => {};
    context.setApplications = applications => { context.loadedApplications = applications; };
    context.setLoading = () => {};
    context.setRefreshing = () => {};
    context.testGet = async (url, config = {}) => {
        context.recordedRequests.push(context.request({ url, ...config }));
        return { data: { applications: [{ id: "sample-application" }] } };
    };
    vm.runInContext("api.get = testGet;", context);
    const source = fs.readFileSync(path.resolve(__dirname,
        "../../../client/src/pages/electoralBoard/Registrations.jsx"), "utf8");
    const start = source.indexOf("const loadApplications = async () => {");
    assert.ok(start >= 0, "registration loader is present");
    const end = source.indexOf("// =====================================================", start);
    vm.runInContext(source.slice(start, end) + "\nglobalThis.loadApplications = loadApplications;", context);
    return context;
}

const roleToken = (role, expiresIn = "1h") => jwt.sign(
    { userId: `sample-${role}`, role }, "test-only-secret", { expiresIn }
);

test("registration list uses the EB login even when an Admin staff token remains", async () => {
    const ebToken = roleToken("electoral_board");
    const context = registrationPageContext({
        votaraEBToken: ebToken,
        votaraStaffToken: roleToken("admin"),
        votaraAdminToken: roleToken("admin"),
    });
    await context.loadApplications();
    assert.equal(context.recordedRequests.length, 1);
    assert.equal(context.recordedRequests[0].url, "/eb/registrations");
    assert.equal(context.recordedRequests[0].headers.Authorization, `Bearer ${ebToken}`);
    assert.equal(context.loadedApplications[0].id, "sample-application");
    assert.equal(context.redirects.length, 0);
});

test("registration list skips an expired legacy staff token", async () => {
    const ebToken = roleToken("electoral_board");
    const context = registrationPageContext({
        votaraEBToken: ebToken,
        votaraStaffToken: roleToken("electoral_board", -1),
    });
    await context.loadApplications();
    assert.equal(context.recordedRequests[0].headers.Authorization, `Bearer ${ebToken}`);
});

test("registration list supports an EB login in the legacy staff slot", async () => {
    const ebToken = roleToken("electoral_board");
    const context = registrationPageContext({
        votaraEBToken: "malformed-old-token",
        votaraStaffToken: ebToken,
    });
    await context.loadApplications();
    assert.equal(context.recordedRequests[0].headers.Authorization, `Bearer ${ebToken}`);
});

test("an Admin token alone cannot open the EB registration list", async () => {
    const context = registrationPageContext({
        votaraEBToken: roleToken("admin"),
        votaraStaffToken: roleToken("admin"),
    });
    await context.loadApplications();
    assert.equal(context.recordedRequests.length, 0);
    assert.equal(context.redirects[0], "/electoral-board/login");
});

test("an expired EB session returns to EB sign-in instead of sending an Admin token", async () => {
    const context = registrationPageContext({
        votaraEBToken: roleToken("electoral_board", -1),
        votaraStaffToken: roleToken("admin"),
    });
    await context.loadApplications();
    assert.equal(context.recordedRequests.length, 0);
    assert.equal(context.redirects[0], "/electoral-board/login");
});

test("successful EB sign-in updates the legacy staff slot as well as the EB slot", async () => {
    const context = browserContext({ votaraStaffToken: roleToken("admin") }, "/admin-login");
    const ebToken = roleToken("electoral_board");
    context.ebFormData = { email: "sample@example.com", password: "sample-password" };
    context.setEbError = () => {};
    context.setEbSuccess = () => {};
    context.setEbLoading = () => {};
    context.navigate = () => {};
    context.testPost = async () => ({ data: {
        token: ebToken, user: { id: "sample-electoral_board", role: "electoral_board" },
    } });
    vm.runInContext("api.post = testPost;", context);
    const source = fs.readFileSync(path.resolve(__dirname,
        "../../../client/src/pages/auth/AccountSelection.jsx"), "utf8");
    const start = source.indexOf("const handleEbLogin = async");
    const end = source.indexOf("const handleAdminRegister = async", start);
    assert.ok(start >= 0 && end > start, "EB sign-in handler is present");
    vm.runInContext(source.slice(start, end) + "\nglobalThis.handleEbLogin = handleEbLogin;", context);
    await context.handleEbLogin({ preventDefault() {} });
    assert.equal(context.localStorage.getItem("votaraEBToken"), ebToken);
    assert.equal(context.localStorage.getItem("votaraStaffToken"), ebToken);
    assert.equal(JSON.parse(context.localStorage.getItem("votaraStaffUser")).role, "electoral_board");
});

test("student profile uses its student token when EB and admin sessions remain saved", () => {
    const student = jwt.sign({ role: "student", studentId: "57476" }, "test-only-secret");
    const eb = jwt.sign({ role: "electoral_board" }, "test-only-secret");
    const context = browserContext({ votaraToken: student, votaraEBToken: eb, votaraStaffToken: eb,
        votaraAdminToken: "admin-token" }, "/student-dashboard");
    for (const url of ["/students/profile", "/students/results", "/students/password", "/elections/active"]) {
        assert.equal(context.request({url, headers: {}}).headers.Authorization, "Bearer " + student);
    }
});
test("student-owned endpoints select student credentials even outside the student page", () => {
    const student = jwt.sign({ role: "student", studentId: "57476" }, "test-only-secret");
    const eb = jwt.sign({ role: "electoral_board" }, "test-only-secret");
    const context = browserContext({votaraToken: student, votaraEBToken: eb}, "/");
    assert.equal(context.request({url: "/students/profile", headers: {}}).headers.Authorization, "Bearer " + student);
});
test("student token selection skips expired or wrong-role primary entries", () => {
    const student = jwt.sign({role: "student", studentId: "57476"}, "test-only-secret");
    for (const stale of [
        jwt.sign({role: "electoral_board"}, "test-only-secret"),
        jwt.sign({role: "student", studentId: "57476"}, "test-only-secret", {expiresIn: -1}),
        "malformed-token",
    ]) {
        const context = browserContext({votaraToken: stale, votaraStudentToken: student}, "/student-dashboard");
        assert.equal(context.request({url: "/students/profile", headers: {}}).headers.Authorization, "Bearer " + student);
    }
});
test("student endpoints never fall back to saved staff credentials when no student session exists", () => {
    const eb = jwt.sign({role: "electoral_board"}, "test-only-secret");
    const context = browserContext({votaraEBToken: eb, votaraStaffToken: eb}, "/student-dashboard");
    for (const url of ["/students/profile", "/students/results", "/elections/active", "/voting/submit"]) {
        assert.equal(context.request({url, headers: {}}).headers.Authorization, undefined);
    }
});
test("legacy student credentials are supported only with a student identifier", () => {
    const student = jwt.sign({student_id: "57476"}, "test-only-secret");
    const context = browserContext({studentToken: student}, "/student-dashboard");
    assert.equal(context.request({url: "/students/profile", headers: {}}).headers.Authorization, "Bearer " + student);
});
test("explicit kiosk authorization still takes precedence on voting requests", () => {
    const context = browserContext({}, "/kiosk-voting");
    assert.equal(context.request({url: "/voting/submit", headers: {Authorization: "Bearer kiosk-token"}})
        .headers.Authorization, "Bearer kiosk-token");
});

test("a saved kiosk flag cannot replace the normal student's voting session", () => {
    const student = jwt.sign({role: "student", studentId: "57476"}, "test-only-secret");
    const context = browserContext({votaraToken: student, votaraKioskMode: "true", votaraKioskToken: "kiosk-token"}, "/student-dashboard");
    assert.equal(context.request({url: "/voting/submit", headers: {}}).headers.Authorization, "Bearer " + student);
});

test("registration list uses the board session when a different staff role is also stored", async () => {
    const boardToken = jwt.sign({ role: "electoral_board" }, "test-only-secret", { expiresIn: "1h" });
    const otherToken = jwt.sign({ role: "admin" }, "test-only-secret", { expiresIn: "1h" });
    const context = browserContext({ votaraEBToken: boardToken, votaraStaffToken: otherToken }, "/electoral-board/dashboard");
    let authorization;
    const api = vm.runInContext("api", context);
    api.get = async (url, config = {}) => {
        authorization = context.request({ url, headers: {}, ...config }).headers.Authorization;
        return { data: { applications: [] } };
    };
    for (const setter of ["setError", "setApplications", "setLoading", "setRefreshing"]) context[setter] = () => {};
    context.navigate = () => assert.fail("Registration review must not redirect to Admin login");
    const component = fs.readFileSync(path.resolve(__dirname, "../../../client/src/pages/electoralBoard/Registrations.jsx"), "utf8");
    const start = component.indexOf("    const loadApplications = async () => {");
    const end = component.indexOf("\n    };", start) + "\n    };".length;
    assert.ok(start >= 0 && end > start, "Registration loader must be present");
    vm.runInContext(`${component.slice(start, end)}\nglobalThis.loadRegistrationApplications = loadApplications;`, context);
    await context.loadRegistrationApplications();
    assert.equal(authorization, `Bearer ${boardToken}`);
});

test("registration requests skip expired board tokens and use the current board staff session", () => {
    const expired = jwt.sign({ role: "electoral_board", exp: 1 }, "test-only-secret");
    const current = jwt.sign({ role: "electoral_board" }, "test-only-secret", { expiresIn: "1h" });
    const context = browserContext({ votaraEBToken: expired, votaraStaffToken: current }, "/electoral-board/dashboard");
    for (const url of ["/eb/registrations", "/eb/registrations/r1", "/eb/registrations/r1/review"]) {
        assert.equal(context.request({ url, headers: {} }).headers.Authorization, `Bearer ${current}`);
    }
});

test("registration requests never substitute an administrator or student for a missing board session", () => {
    const admin = jwt.sign({ role: "admin" }, "test-only-secret");
    const context = browserContext({ votaraStaffToken: admin, votaraAdminToken: admin, votaraToken: "student-token" }, "/electoral-board/dashboard");
    assert.equal(context.request({ url: "/eb/registrations", headers: {} }).headers.Authorization, undefined);
});
