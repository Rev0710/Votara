import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminConnectionError, isAdminSessionRejection } from "./adminSession.js";

test("invalid, expired, and inactive admin sessions still require sign-in", () => {
    for (const [status, message] of [
        [401, "Invalid or expired administrator session."],
        [403, "Administrator account is inactive."],
    ]) {
        assert.equal(isAdminSessionRejection({ response: { status, data: { success: false, message } } }), true);
    }
});

test("an unrelated service returning 401 or 403 does not invalidate the admin session", () => {
    for (const status of [401, 403]) {
        for (const data of [undefined, null, "", "<html>Forbidden</html>", { message: "Forbidden" }]) {
            assert.equal(isAdminSessionRejection({ response: { status, data } }), false);
        }
    }
});

test("network failures and backend outages do not invalidate the admin session", () => {
    assert.equal(isAdminSessionRejection({ code: "ERR_NETWORK" }), false);
    assert.equal(isAdminSessionRejection({ response: { status: 503, data: { success: false, message: "Unable to verify administrator account." } } }), false);
});

test("connection errors offer a retry and preserve server error details", () => {
    const message = getAdminConnectionError({ response: { status: 403, data: "" } });
    assert.match(message, /session has been kept/);
    assert.match(message, /Refresh/);
    assert.equal(getAdminConnectionError({ response: { status: 503, data: { message: "Unable to verify administrator account." } } }), "Unable to verify administrator account.");
});
