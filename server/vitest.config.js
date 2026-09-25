const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
    test: {
        environment: "node",

        globals: true,

        include: [
            "test/**/*.test.js"
        ],

        coverage: {
            provider: "v8",

            include: [
                "src/**/*.js"
            ],

            exclude: [
                "src/**/*.test.js",
                "src/**/index.js",
                "src/server.js"
            ],

            reporter: [
                "text",
                "html",
                "json"
            ]
        }
    }
});