const express = require("express");

const DEFAULT_JSON_LIMIT = "12mb";
// Four documents plus a selfie, each up to 5 MiB, grow to about 33.4 MiB
// when base64 encoded. Leave room for JSON keys and file names.
const REGISTRATION_JSON_LIMIT = "36mb";

const defaultJsonParser = express.json({ limit: DEFAULT_JSON_LIMIT });
const registrationJsonParser = express.json({ limit: REGISTRATION_JSON_LIMIT });

const isRegistrationUpload = (req) => req.method === "POST"
    && /^\/api\/registration-documents\/upload\/?$/.test(req.path);

const parseJsonBody = (req, res, next) => {
    const parser = isRegistrationUpload(req) ? registrationJsonParser : defaultJsonParser;
    return parser(req, res, next);
};

const handleBodyParserError = (error, req, res, next) => {
    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            code: "REQUEST_TOO_LARGE",
            message: isRegistrationUpload(req)
                ? "Your combined upload is too large. Each document and selfie must be 5 MB or smaller. Choose smaller files and try again."
                : "This request is too large. Reduce the file sizes and try again.",
        });
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            code: "INVALID_JSON",
            message: "The submission could not be read. Please refresh the page and try again.",
        });
    }

    return next(error);
};

module.exports = {
    DEFAULT_JSON_LIMIT,
    REGISTRATION_JSON_LIMIT,
    parseJsonBody,
    handleBodyParserError,
};
