const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { parseJsonBody, handleBodyParserError } = require("../../src/middleware/requestBody");

const createApp = () => {
    const app = express();
    app.use(parseJsonBody);
    app.post(["/api/registration-documents/upload", "/api/other"], (req, res) => {
        res.json({ receivedLength: req.body.data.length });
    });
    app.use(handleBodyParserError);
    app.use((error, req, res, next) => res.status(500).json({ message: "Unexpected failure" }));
    return app;
};

const mobileDocumentPayload = { data: "A".repeat(13 * 1024 * 1024) };

test("registration submissions larger than 12 MiB reach the upload handler", async () => {
    const result = await request(createApp())
        .post("/api/registration-documents/upload")
        .send(mobileDocumentPayload);
    assert.equal(result.status, 200);
    assert.equal(result.body.receivedLength, mobileDocumentPayload.data.length);
});

test("other API routes retain their 12 MiB limit and return 413", async () => {
    const result = await request(createApp())
        .post("/api/other")
        .send(mobileDocumentPayload);
    assert.equal(result.status, 413);
    assert.equal(result.body.code, "REQUEST_TOO_LARGE");
    assert.doesNotMatch(result.body.message, /unexpected/i);
});

test("registration submissions still reject bodies over 36 MiB", async () => {
    const result = await request(createApp())
        .post("/api/registration-documents/upload")
        .send({ data: "A".repeat(37 * 1024 * 1024) });
    assert.equal(result.status, 413);
    assert.equal(result.body.code, "REQUEST_TOO_LARGE");
    assert.match(result.body.message, /5 MB/);
});

test("malformed registration JSON returns a readable 400 response", async () => {
    const result = await request(createApp())
        .post("/api/registration-documents/upload")
        .set("Content-Type", "application/json")
        .send('{"data":');
    assert.equal(result.status, 400);
    assert.equal(result.body.code, "INVALID_JSON");
});
