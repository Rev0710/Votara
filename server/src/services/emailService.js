const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    tls: {
        rejectUnauthorized: false,
        servername: "smtp.gmail.com",
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,

    family: 4,
});


/*
=====================================================
TEST SMTP CONNECTION
=====================================================
*/

const verifyEmailConnection = async () => {
    try {
        await transporter.verify();

        console.log("=================================");
        console.log("✅ GMAIL SMTP CONNECTION SUCCESS");
        console.log("=================================");
        console.log("Host: smtp.gmail.com");
        console.log("Port: 465");
        console.log("User:", process.env.EMAIL_USER);
        console.log("=================================");

        return true;

    } catch (error) {

        console.error("=================================");
        console.error("❌ GMAIL SMTP CONNECTION FAILED");
        console.error("=================================");
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("Command:", error.command);
        console.error("=================================");

        return false;
    }
};


/*
=====================================================
SEND REGISTRATION OTP
=====================================================
*/

const sendOTPEmail = async (email, studentId, otp) => {

    try {

        console.log("=================================");
        console.log("📧 SENDING VOTARA OTP");
        console.log("=================================");
        console.log("To:", email);
        console.log("Student ID:", studentId);
        console.log("OTP:", otp);
        console.log("=================================");

        const mailOptions = {
            from: `"VOTARA Electoral Board" <${process.env.EMAIL_USER}>`,

            to: email,

            subject: "VOTARA Registration OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                ">

                    <h2 style="
                        color: #0648ff;
                        margin-bottom: 20px;
                    ">
                        VOTARA Registration
                    </h2>

                    <p>Hello,</p>

                    <p>
                        Your OTP for VOTARA voter registration is:
                    </p>

                    <div style="
                        margin: 25px 0;
                        padding: 20px;
                        text-align: center;
                        background: #f3f6ff;
                        border-radius: 10px;
                    ">

                        <span style="
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #0648ff;
                        ">
                            ${otp}
                        </span>

                    </div>

                    <p>
                        <strong>Student ID:</strong> ${studentId}
                    </p>

                    <p>
                        Enter this OTP on the VOTARA
                        registration verification page.
                    </p>

                    <p style="color: #666;">
                        If you did not request this registration,
                        please ignore this email.
                    </p>

                    <hr style="
                        border: none;
                        border-top: 1px solid #eeeeee;
                        margin: 25px 0;
                    ">

                    <p style="
                        font-size: 12px;
                        color: #888;
                    ">
                        VOTARA Electoral Board<br>
                        Western Institute of Technology
                    </p>

                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("=================================");
        console.log("✅ OTP EMAIL SENT SUCCESSFULLY");
        console.log("=================================");
        console.log("To:", email);
        console.log("Message ID:", info.messageId);
        console.log("=================================");

        return {
            success: true,
            messageId: info.messageId,
        };

    } catch (error) {

        console.error("=================================");
        console.error("❌ OTP EMAIL FAILED");
        console.error("=================================");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Command:", error.command);
        console.error("=================================");

        throw error;
    }
};


/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    sendOTPEmail,
    verifyEmailConnection,
};