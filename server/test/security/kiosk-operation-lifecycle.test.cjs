const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../src/controllers/kioskController.js"), "utf8");
const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });

function cancellationFixture(status) {
    let operation = status ? { id: "own-operation", kiosk_session_id: "session", operation_status: status } : null;
    let cancellations = 0;
    const start = source.indexOf("const abortKioskOperation = async (");
    const end = source.indexOf("// VERIFY STUDENT", start);
    const context = vm.createContext({ console,
        getKioskOperation: async () => operation,
        cancelKioskOperation: async id => { assert.equal(id, "own-operation"); cancellations++; operation = { ...operation, operation_status: "cancelled" }; return operation; },
    });
    vm.runInContext(`${source.slice(start, end)}\nglobalThis.abort = abortKioskOperation;`, context);
    return { abort: context.abort, cancellations: () => cancellations };
}

test("cancelling active assistance is idempotent", async () => {
    const fixture = cancellationFixture("active");
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = response();
        await fixture.abort({ params: { id: "own-operation" } }, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.operation.operation_status, "cancelled");
    }
    assert.equal(fixture.cancellations(), 1);
});

test("cleanup accepts already expired and completed operations without changing them", async () => {
    for (const status of ["expired", "completed", "cancelled"]) {
        const fixture = cancellationFixture(status);
        const res = response();
        await fixture.abort({ params: { id: "own-operation" } }, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.operation.operation_status, status);
        assert.equal(fixture.cancellations(), 0);
    }
});

test("cleanup still rejects nonexistent operation IDs", async () => {
    const fixture = cancellationFixture(null);
    const res = response();
    await fixture.abort({ params: { id: "missing" } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(fixture.cancellations(), 0);
});

function authorizationFixture({ hasVoted = false, accountExists = true, eligible = true, votingAvailable = true } = {}) {
    const operations = [];
    const start = source.indexOf("const authorizeKioskStudent =");
    const end = source.indexOf("const submitKioskRegistration =", start);
    const context = vm.createContext({ console,
        require: moduleName => {
            assert.equal(moduleName, "../utils/electionTime");
            return { votingAvailability: () => ({ available: votingAvailable, message: "Voting is paused." }) };
        },
        supabase: { from: () => {
            let studentId;
            const query = { select() { return this; }, eq(key, value) { if (key === "student_id") studentId = value; return this; },
                async maybeSingle() { return { data: { id: `uuid-${studentId}`, student_id: studentId, year_level: "3rd Year" } }; } };
            return query;
        } },
        validateSessionElection: async () => ({ id: "session", election_id: "election", active_operations: 3 }),
        ensureYearEligibility: async () => { if (!eligible) throw new Error("Student is not eligible"); return "3rd Year"; },
        getStudentAccount: async () => accountExists ? { id: "account" } : null,
        getParticipation: async () => ({ has_voted: hasVoted }),
        getActiveOperationCount: async () => 3,
        createKioskOperation: async options => { const operation = { id: `operation-${operations.length + 1}`, ...options }; operations.push(operation); return operation; },
        createKioskStudentToken: ({ student, session }) => `test-${student.student_id}-${session.kioskOperationId}`,
    });
    vm.runInContext(`${source.slice(start, end)}\nglobalThis.authorize = authorizeKioskStudent;`, context);
    return { authorize: context.authorize, operations };
}

test("three devices using one EB account can authorize different students in the same occupied session", async () => {
    const fixture = authorizationFixture();
    const responses = await Promise.all(["00001", "00002", "00003"].map(async (studentId, index) => {
        const res = response();
        await fixture.authorize({ user: { userId: "same-board-member" }, body: { sessionId: "session", studentId } }, res);
        return res;
    }));
    assert.ok(responses.every(res => res.statusCode === 200 && res.body.success));
    assert.equal(new Set(responses.map(res => res.body.operationId)).size, 3);
    assert.equal(new Set(responses.map(res => res.body.token)).size, 3);
    assert.deepEqual(responses.map(res => res.body.student.studentId), ["00001", "00002", "00003"]);
    assert.ok(fixture.operations.every(operation => operation.sessionId === "session"));
});

test("parallel assistance respects the election voting-availability check", async () => {
    const fixture = authorizationFixture({ votingAvailable: false });
    const res = response();
    await fixture.authorize({ user: { userId: "board" }, body: { sessionId: "session", studentId: "00001" } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, "VOTING_UNAVAILABLE");
    assert.equal(fixture.operations.length, 0);
});

test("parallel assistance still rejects students who have already voted or need registration", async () => {
    for (const options of [{ hasVoted: true }, { accountExists: false }]) {
        const fixture = authorizationFixture(options);
        const res = response();
        await fixture.authorize({ user: { userId: "board" }, body: { sessionId: "session", studentId: "00001" } }, res);
        assert.equal(res.statusCode, 409);
        assert.equal(fixture.operations.length, 0);
    }
});

test("registration and voting operations can start together while the shared session is occupied", async () => {
    const operations = [];
    const start = source.indexOf("const startKioskOperation = async (");
    const end = source.indexOf("const heartbeatKioskOperation =", start);
    const context = vm.createContext({ console,
        validateSessionElection: async () => ({ id: "session", active_operations: 2 }),
        getActiveOperationCount: async () => 2,
        createKioskOperation: async options => { const operation = { id: `operation-${operations.length + 1}`, ...options }; operations.push(operation); return operation; },
    });
    vm.runInContext(`${source.slice(start, end)}\nglobalThis.start = startKioskOperation;`, context);
    const results = await Promise.all(["registration", "voting"].map(async operationType => {
        const res = response();
        await context.start({ user: { userId: "board" }, body: { sessionId: "session", operationType } }, res);
        return res;
    }));
    assert.ok(results.every(res => res.statusCode === 201));
    assert.notEqual(results[0].body.operation.id, results[1].body.operation.id);
});

test("closing or cancelling the shared session remains blocked while any devices are active", async () => {
    for (const [name, next] of [["closeKioskSession", "cancelKioskSession"], ["cancelKioskSession", null]]) {
        const start = source.indexOf(`const ${name} = async (`);
        const end = next ? source.indexOf(`const ${next} =`, start) : source.indexOf("module.exports", start);
        const context = vm.createContext({ console,
            getSharedSessionForManagement: async () => ({ id: "session", session_status: "active" }),
            getActiveOperationCount: async () => 2,
        });
        vm.runInContext(`${source.slice(start, end)}\nglobalThis.manage = ${name};`, context);
        const res = response();
        await context.manage({ params: { id: "session" }, user: { userId: "board" } }, res);
        assert.equal(res.statusCode, 409);
        assert.equal(res.body.code, "SESSION_IN_USE");
    }
});

test("two devices can submit assisted registrations without blocking each other's operation", async () => {
    const operations = [];
    const database = {
        from(table) {
            let studentId;
            let values;
            const query = {
                select() { return this; }, order() { return this; }, limit() { return this; },
                eq(key, value) { if (key === "student_id") studentId = value; return this; },
                insert(value) { values = value; return this; }, delete() { return this; },
                async maybeSingle() { return { data: table === "students" ? { id: `uuid-${studentId}` } : null }; },
                async single() { return { data: { id: `application-${values.student_id}` } }; },
                then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject); },
            };
            return query;
        },
        storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "https://example.test/preview" } }) }) },
    };
    const start = source.indexOf("const submitKioskRegistration =");
    const end = source.indexOf("const approveKioskRegistration =", start);
    const context = vm.createContext({ console, supabase: database,
        IMAGE_TYPES: ["image/png"], STORAGE_BUCKET: "test-only", nowIso: () => "2026-01-01T00:00:00Z",
        validateSessionElection: async () => ({ id: "session", election_id: "election", active_operations: 2 }),
        ensureYearEligibility: async () => "3rd Year",
        validateFile: () => ({ valid: true, buffer: Buffer.from("test"), mimeType: "image/png" }),
        getExtension: () => "png", uploadToStorage: async () => {},
        getActiveOperationCount: async () => 2,
        createKioskOperation: async options => { const operation = { id: `operation-${operations.length + 1}`, ...options }; operations.push(operation); return operation; },
    });
    vm.runInContext(`${source.slice(start, end)}\nglobalThis.submit = submitKioskRegistration;`, context);
    const results = await Promise.all(["00001", "00002"].map(async studentId => {
        const res = response();
        const file = { name: "preview.png" };
        await context.submit({ user: { userId: "board" }, body: { sessionId: "session", studentId,
            fullName: "Preview Student", yearLevel: "3rd Year", studentIdFront: file,
            studentIdBack: file, enrollmentProof: file, selfie: file } }, res);
        return res;
    }));
    assert.ok(results.every(res => res.statusCode === 201 && res.body.success));
    assert.notEqual(results[0].body.operationId, results[1].body.operationId);
    assert.deepEqual(results.map(res => res.body.registration.studentId), ["00001", "00002"]);
    assert.equal(operations.length, 2);
});
