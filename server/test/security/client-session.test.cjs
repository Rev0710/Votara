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
    const context = browserContext({ votaraToken: "student-token" }, "/vote");
    assert.equal(context.request({ url: "/voting/submit", headers: {}, data: {} }).headers.Authorization, "Bearer student-token");
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
