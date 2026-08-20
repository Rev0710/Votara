const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "64.233.188.109",
    port: 465,
    secure: true,

    tls: {
        servername: "smtp.gmail.com",
        rejectUnauthorized: false,
    },

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
});

const verifyEmailConnection = async () => {
    try {
        await transporter.verify();

        console.log("✅ Gmail SMTP connection successful.");
        console.log(`📧 Email sender: ${process.env.EMAIL_USER}`);
    } catch (error) {
        console.error("❌ Gmail SMTP connection failed.");
        console.error(error);
    }
};

const sendOTPEmail = async (recipientEmail, otp) => {
    try {
        const mailOptions = {
            from: `"VOTARA Election System" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: "VOTARA Student Registration OTP",

            text: `
Your VOTARA verification code is:

${otp}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.
            `,

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

                    <h2 style="color:#0647ff;">
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
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        color:#0647ff;
                        padding:20px;
                        text-align:center;
                        background:#f1f5ff;
                        border-radius:10px;
                    ">
                        ${otp}
                    </div>

                    <p style="margin-top:20px;">
                        This OTP will expire in
                        <strong>5 minutes</strong>.
                    </p>

                    <p style="
                        color:#6b7280;
                        font-size:13px;
                    ">
                        If you did not request this verification code,
                        please ignore this email.
                    </p>

                    <hr>

                    <p style="
                        color:#6b7280;
                        font-size:12px;
                    ">
                        VOTARA — Department Student Election System
                    </p>

                </div>
            `,
        };

        const result = await transporter.sendMail(mailOptions);

        console.log("✅ OTP email sent successfully.");
        console.log("📨 Message ID:", result.messageId);

        return result;

    } catch (error) {
        console.error("❌ OTP sending error:");
        console.error(error);

        throw error;
    }
};

module.exports = {
    transporter,
    verifyEmailConnection,
    sendOTPEmail,
};