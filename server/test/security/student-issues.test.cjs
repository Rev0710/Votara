const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const root = path.resolve(__dirname, "../..");
const secret = "isolated-report-tests-only";
const adminToken = jwt.sign({ userId: "admin-1", role: "admin" }, secret);
function load(file, dependencies) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), {
        module, exports: module.exports, Buffer, Date,
        process: { env: { JWT_SECRET: secret } }, console: { error() {} },
        require: name => name === '../services/reportQuota' ? load('src/services/reportQuota.js', dependencies) : Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    }, { filename: file });
    return module.exports;
}
function fixture() {
    const tables = {
        students: [{ id: "student-1", student_id: "12345", full_name: "Test Student" },
            { id: "student-2", student_id: "99999", full_name: "Other Student" }],
        student_accounts: [{ student_id: "12345", email: "student@example.test" }],
        staff_users: [{ id: "admin-1", role: "admin", is_active: true }],
        student_issue_reports: [], student_issue_report_history: [],
    };
    const uploads = [];
    const db = { storage: { from: () => ({
        upload: async value => { uploads.push(value); return { data: { path: value }, error: null }; },
        remove: async () => ({ error: null }),
        createSignedUrl: async value => ({ data: { signedUrl: `https://files.example.test/${value}` } }),
    }) }, from(table) {
        const filters = []; let operation = "select", values, single = false;
        const chain = {
            select: () => chain, order: () => chain, limit: () => chain,
            eq: (key, value) => { filters.push([key, value]); return chain; },
            insert: value => { operation = "insert"; values = value; return chain; },
            update: value => { operation = "update"; values = value; return chain; },
            single: () => { single = true; return chain; },
            maybeSingle: () => { single = true; return chain; },
            then(resolve, reject) {
                let rows = tables[table].filter(row => filters.every(([key, value]) => row[key] === value));
                if (operation === "insert") {
                    const row = { id: `${table}-${tables[table].length + 1}`, created_at: new Date().toISOString(), ...values };
                    tables[table].push(row); rows = [row];
                } else if (operation === "update") rows.forEach(row => Object.assign(row, values));
                const data = single ? rows[0] || null : rows;
                return Promise.resolve({ data, error: null }).then(resolve, reject);
            },
        };
        return chain;
    } };
    const controller = load("src/controllers/studentIssueReportsController.js", { "../config/supabase": db });
    const issues = load("src/routes/studentIssueReportsRoutes.js", {
        express, "../controllers/studentIssueReportsController": controller,
    });
    const protectStudent = (req, res, next) => {
        const id = { "Bearer student-one": "student-1", "Bearer student-two": "student-2" }[req.headers.authorization];
        if (!id) return res.status(401).json({ success: false });
        req.student = { id }; next();
    };
    const unused = new Proxy({}, { get: () => (req, res) => res.sendStatus(204) });
    const students = load("src/routes/studentRoutes.js", {
        express, "../controllers/studentController": unused,
        "../middleware/authMiddleware": { protectStudent }, "./studentIssueReportsRoutes": issues,
    });
    const adminIssues = load("src/routes/adminStudentIssueReportsRoutes.js", {
        express, "../controllers/studentIssueReportsController": controller,
    });
    const app = express(); app.use(express.json({ limit: "12mb" }));
    app.use("/api/students", students);
    app.use("/api/admin/student-issue-reports", adminIssues);
    return { app, tables, uploads };
}
const report = { category: "Voting issue", subject: "Ballot help", description: "I need assistance opening my ballot.", contactEmail: "student@example.test" };
const submit = (app, body = report) => request(app).post("/api/students/issues").set("Authorization", "Bearer student-one").send(body);

test("student report endpoint is mounted and requires an existing student session", async () => {
    const { app } = fixture();
    assert.equal((await request(app).post("/api/students/issues").send(report)).status, 401);
    assert.equal((await request(app).get("/api/students/issues")).status, 401);
});
test("student submission reaches the admin queue and the admin reply reaches the student's history", async () => {
    const { app, tables } = fixture();
    const created = await submit(app); assert.equal(created.status, 201);
    const id = created.body.report.id;
    assert.equal(tables.student_issue_report_history.length, 1);
    const queue = await request(app).get("/api/admin/student-issue-reports").set("Authorization", `Bearer ${adminToken}`);
    assert.equal(queue.status, 200); assert.equal(queue.body.reports[0].id, id);
    const reply = await request(app).patch(`/api/admin/student-issue-reports/${id}`)
        .set("Authorization", `Bearer ${adminToken}`).send({ status: "resolved", adminResponse: "Please refresh your ballot and try again." });
    assert.equal(reply.status, 200);
    const mine = await request(app).get("/api/students/issues").set("Authorization", "Bearer student-one");
    assert.equal(mine.body.reports[0].admin_response, "Please refresh your ballot and try again.");
    assert.equal(mine.body.reports[0].status, "resolved");
    const history = await request(app).get(`/api/students/issues/${id}/history`).set("Authorization", "Bearer student-one");
    assert.equal(history.status, 200);
    assert.ok(history.body.history.some(event => event.actor_role === "admin" && event.note.includes("refresh your ballot")));
});
test("another student cannot read someone else's report or history", async () => {
    const { app } = fixture(); const created = await submit(app);
    const mine = await request(app).get("/api/students/issues").set("Authorization", "Bearer student-two");
    assert.equal(mine.body.reports.length, 0);
    assert.equal((await request(app).get(`/api/students/issues/${created.body.report.id}/history`)
        .set("Authorization", "Bearer student-two")).status, 404);
});
test("students and anonymous callers cannot read or reply through admin endpoints", async () => {
    const { app } = fixture(); const created = await submit(app);
    assert.equal((await request(app).get("/api/admin/student-issue-reports")).status, 401);
    const token = jwt.sign({ userId: "student-1", role: "student" }, secret);
    assert.equal((await request(app).get("/api/admin/student-issue-reports").set("Authorization", `Bearer ${token}`)).status, 403);
    assert.equal((await request(app).patch(`/api/admin/student-issue-reports/${created.body.report.id}`)
        .set("Authorization", `Bearer ${token}`).send({ status: "closed", adminResponse: "Unauthorized" })).status, 403);
});
test("inactive administrators cannot access student concerns", async () => {
    const { app, tables } = fixture(); tables.staff_users[0].is_active = false;
    assert.equal((await request(app).get("/api/admin/student-issue-reports").set("Authorization", `Bearer ${adminToken}`)).status, 403);
});
test("invalid issue details are rejected without creating a report", async () => {
    const { app, tables } = fixture();
    assert.equal((await submit(app, { ...report, subject: "x" })).status, 400);
    assert.equal((await submit(app, { ...report, category: "not a category" })).status, 400);
    assert.equal(tables.student_issue_reports.length, 0);
});
test("attachments reach private storage and return a signed link", async () => {
    const { app, uploads } = fixture();
    const result = await submit(app, { ...report, attachment: { name: "screenshot.png", type: "image/png", data: "data:image/png;base64,cHJldmlldy1vbmx5" } });
    assert.equal(result.status, 201); assert.equal(uploads.length, 1);
    assert.ok(result.body.report.attachment_url.startsWith("https://files.example.test/student-1/"));
});
test("unsupported attachments cannot be uploaded", async () => {
    const { app, uploads } = fixture();
    const result = await submit(app, { ...report, attachment: { name: "file.exe", type: "application/octet-stream", data: "YWJj" } });
    assert.equal(result.status, 400); assert.equal(uploads.length, 0);
});
test("the application server mounts the admin concern router", () => {
    const source = fs.readFileSync(path.join(root, "server.js"), "utf8");
    assert.ok(source.includes('app.use("/api/admin/student-issue-reports", adminStudentIssueReportsRoutes)'));
});
test('student account can submit exactly five reports and a sixth is rejected without blocking history',async()=>{const {app,tables}=fixture();for(let i=0;i<5;i++)assert.equal((await submit(app)).status,201);assert.equal((await submit(app)).status,429);assert.equal(tables.student_issue_reports.length,5);assert.equal((await request(app).get('/api/students/issues').set('Authorization','Bearer student-one')).status,200);});
