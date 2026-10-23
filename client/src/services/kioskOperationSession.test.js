import { test } from "node:test";
import assert from "node:assert/strict";
import { createKioskOperationSession } from "./kioskOperationSession.js";

test("cancelling or leaving releases only the operation opened by this page", async () => {
    const calls = [];
    const session = createKioskOperationSession({ abort: async id => calls.push(id), finish: async () => assert.fail("No vote was submitted") });
    await session.release();
    assert.deepEqual(calls, []);
    session.track("this-page-operation");
    await session.release();
    await session.release();
    assert.deepEqual(calls, ["this-page-operation"]);
    assert.equal(session.id, null);
});

test("a recorded vote completes the operation instead of cancelling it", async () => {
    const calls = [];
    const session = createKioskOperationSession({ abort: async () => assert.fail("A recorded vote must not be cancelled"), finish: async id => calls.push(id) });
    session.track("voting-operation");
    session.markCompleted();
    await session.release();
    await session.release();
    assert.deepEqual(calls, ["voting-operation"]);
});

test("failed cleanup retains the operation so Cancel or Back can retry", async () => {
    let attempts = 0;
    const session = createKioskOperationSession({ abort: async () => { if (++attempts === 1) throw new Error("offline"); }, finish: async () => {} });
    session.track("unfinished-operation");
    await assert.rejects(session.release(), /offline/);
    assert.equal(session.id, "unfinished-operation");
    await session.release();
    assert.equal(attempts, 2);
    assert.equal(session.id, null);
});

test("failed completion remains a completion when Next Student retries", async () => {
    let attempts = 0;
    const session = createKioskOperationSession({ abort: async () => assert.fail("Must not cancel after a recorded vote"), finish: async () => { if (++attempts === 1) throw new Error("offline"); } });
    session.track("recorded-vote");
    session.markCompleted();
    await assert.rejects(session.release(), /offline/);
    await session.release();
    assert.equal(attempts, 2);
});

test("simultaneous cleanup requests send only one operation request", async () => {
    let calls = 0;
    let resolve;
    const response = new Promise(done => { resolve = done; });
    const session = createKioskOperationSession({ abort: async () => { calls++; await response; }, finish: async () => {} });
    session.track("active-operation");
    const first = session.release();
    const second = session.release();
    assert.equal(first, second);
    resolve();
    await Promise.all([first, second]);
    assert.equal(calls, 1);
});
