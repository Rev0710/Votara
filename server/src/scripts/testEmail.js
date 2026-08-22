require("dotenv").config();

const nodemailer = require("nodemailer");

console.log("");
console.log("==============================");
console.log("📧 EMAIL CONFIGURATION TEST");
console.log("==============================");

console.log(
    "EMAIL_HOST:",
    process.env.EMAIL_HOST
);

console.log(
    "EMAIL_PORT:",
    process.env.EMAIL_PORT
);

console.log(
    "EMAIL_USER:",
    process.env.EMAIL_USER
);

console.log(
    "EMAIL_PASS:",
    process.env.EMAIL_PASS
        ? "CONFIGURED"
        : "NOT CONFIGURED"
);

console.log("==============================");
console.log("🔄 Testing SMTP connection...");
console.log("");


// =====================================================
// GMAIL SMTP
// =====================================================

const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 465,

    secure: true,

    family: 4,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 30000,

    greetingTimeout: 30000,

    socketTimeout: 30000,
});


// =====================================================
// TEST CONNECTION
// =====================================================

transporter.verify(
    (error, success) => {

        if (error) {

            console.log("");
            console.log(
                "================================="
            );

            console.error(
                "❌ SMTP CONNECTION FAILED"
            );

            console.log(
                "================================="
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Command:",
                error.command
            );

            console.log("");

        } else {

            console.log("");
            console.log(
                "================================="
            );

            console.log(
                "✅ SMTP CONNECTION SUCCESSFUL"
            );

            console.log(
                "================================="
            );

            console.log(
                "Gmail SMTP is ready."
            );

            console.log(
                "Server: smtp.gmail.com"
            );

            console.log(
                "Port: 465"
            );

            console.log(
                "Secure: true"
            );

            console.log("");
        }

    }
);