const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
});

module.exports = transporter;

// =====================================================
// VERIFY EMAIL CONNECTION
// =====================================================

const verifyEmailConnection = async () => {

    try {

        console.log("");
        console.log(
            "📧 Testing Gmail SMTP connection..."
        );

        await transporter.verify();

        console.log(
            "✅ Gmail SMTP server is ready."
        );

        console.log(
            `📨 Email sender: ${process.env.EMAIL_USER}`
        );

    } catch (error) {

        console.error("");
        console.error(
            "❌ Gmail SMTP connection failed."
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
    }
};


// =====================================================
// SEND OTP EMAIL
// =====================================================

const sendOTPEmail = async (
    recipientEmail,
    otp
) => {

    try {

        const mailOptions = {

            from:
                `"VOTARA Election System" <${process.env.EMAIL_USER}>`,

            to:
                recipientEmail,

            subject:
                "VOTARA Student Registration OTP",

            // -----------------------------------------
            // PLAIN TEXT EMAIL
            // -----------------------------------------

            text: `
Your VOTARA verification code is:

${otp}

This code will expire in 5 minutes.

If you did not request this verification code,
please ignore this email.

VOTARA — Department Student Election System
            `,

            // -----------------------------------------
            // HTML EMAIL
            // -----------------------------------------

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 30px auto;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    background: #ffffff;
                ">

                    <h2 style="
                        color: #0647ff;
                        margin-bottom: 5px;
                    ">
                        VOTARA
                    </h2>

                    <h3>
                        Student Registration Verification
                    </h3>

                    <p>
                        Thank you for registering for the
                        VOTARA Student Election System.
                    </p>

                    <p>
                        Your One-Time Password (OTP) is:
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        color: #0647ff;
                        padding: 20px;
                        text-align: center;
                        background: #f1f5ff;
                        border-radius: 10px;
                        margin: 20px 0;
                    ">
                        ${otp}
                    </div>

                    <p>
                        This verification code will expire
                        in <strong>5 minutes</strong>.
                    </p>

                    <p style="
                        color: #6b7280;
                        font-size: 13px;
                    ">
                        If you did not request this
                        verification code, please ignore
                        this email.
                    </p>

                    <hr style="
                        border: none;
                        border-top: 1px solid #e5e7eb;
                        margin: 25px 0;
                    ">

                    <p style="
                        color: #6b7280;
                        font-size: 12px;
                    ">
                        VOTARA — Department Student
                        Election System
                    </p>

                </div>
            `,
        };


        // =================================================
        // SEND EMAIL
        // =================================================

        const result =
            await transporter.sendMail(
                mailOptions
            );


        console.log("");
        console.log(
            "================================="
        );

        console.log(
            "✅ OTP EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            `📧 To: ${recipientEmail}`
        );

        console.log(
            `📨 Message ID: ${result.messageId}`
        );

        console.log(
            "================================="
        );


        return result;

    } catch (error) {

        console.error("");
        console.error(
            "================================="
        );

        console.error(
            "❌ OTP EMAIL FAILED"
        );

        console.error(
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

        throw error;
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    transporter,

    verifyEmailConnection,

    sendOTPEmail,

};