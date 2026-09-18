const { google } = require("googleapis");

// =====================================================
// VOTARA GMAIL API CONFIGURATION
// =====================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const EMAIL_USER =
    process.env.EMAIL_USER || "votara.election@gmail.com";

// =====================================================
// VALIDATE GOOGLE OAUTH CONFIGURATION
// =====================================================

if (!GOOGLE_CLIENT_ID) {
    throw new Error(
        "GOOGLE_CLIENT_ID is missing from server/.env"
    );
}

if (!GOOGLE_CLIENT_SECRET) {
    throw new Error(
        "GOOGLE_CLIENT_SECRET is missing from server/.env"
    );
}

if (!GOOGLE_REFRESH_TOKEN) {
    throw new Error(
        "GOOGLE_REFRESH_TOKEN is missing from server/.env"
    );
}

// =====================================================
// GOOGLE OAUTH2 CLIENT
// =====================================================

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
});

// =====================================================
// GMAIL API CLIENT
// =====================================================

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
});

// =====================================================
// HTML ESCAPE HELPER
// =====================================================

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// =====================================================
// CREATE MIME EMAIL
// =====================================================

const createRawEmail = ({
    to,
    subject,
    html,
}) => {
    const message = [
        `From: "VOTARA Electoral Board" <${EMAIL_USER}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        html,
    ].join("\r\n");

    return Buffer
        .from(message, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

// =====================================================
// SEND EMAIL THROUGH GMAIL API
// =====================================================

const sendEmail = async ({
    to,
    subject,
    html,
}) => {

    if (!to) {
        throw new Error(
            "Recipient email address is required."
        );
    }

    if (!subject) {
        throw new Error(
            "Email subject is required."
        );
    }

    if (!html) {
        throw new Error(
            "Email HTML content is required."
        );
    }

    const raw = createRawEmail({
        to,
        subject,
        html,
    });

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw,
        },
    });

    return response.data;
};

// =====================================================
// VERIFY GMAIL API CONNECTION
// =====================================================

const verifyEmailConnection = async () => {

    try {

        console.log(
            "================================="
        );

        console.log(
            "🔐 VERIFYING VOTARA GMAIL API"
        );

        console.log(
            "================================="
        );

        console.log(
            "Transport: Gmail API OAuth2"
        );

        console.log(
            "Gmail User:",
            EMAIL_USER
        );

        // This forces Google OAuth2 to obtain/refresh
        // an access token using the refresh token.

        const { token } =
            await oauth2Client.getAccessToken();

        if (!token) {
            throw new Error(
                "Google OAuth2 did not return an access token."
            );
        }

        // Verify the Gmail account connected
        // to the OAuth credentials.

        const profile =
            await gmail.users.getProfile({
                userId: "me",
            });

        console.log(
            "================================="
        );

        console.log(
            "✅ GMAIL API CONNECTION SUCCESS"
        );

        console.log(
            "================================="
        );

        console.log(
            "Authenticated Gmail:",
            profile.data.emailAddress
        );

        console.log(
            "Messages:",
            profile.data.messagesTotal
        );

        console.log(
            "Threads:",
            profile.data.threadsTotal
        );

        console.log(
            "Gmail API is ready."
        );

        console.log(
            "================================="
        );

        return true;

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "❌ GMAIL API CONNECTION FAILED"
        );

        console.error(
            "================================="
        );

        console.error(
            "Error:",
            error.message
        );

        if (error.code) {
            console.error(
                "Error Code:",
                error.code
            );
        }

        if (
            error.response &&
            error.response.data
        ) {
            console.error(
                "Google Response:",
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }

        console.error(
            "================================="
        );

        return false;
    }
};

// =====================================================
// SEND REGISTRATION OTP EMAIL
// =====================================================

const sendOTPEmail = async (
    email,
    studentId,
    otp
) => {

    try {

        console.log(
            "================================="
        );

        console.log(
            "📧 SENDING VOTARA OTP"
        );

        console.log(
            "================================="
        );

        console.log(
            "To:",
            email
        );

        console.log(
            "Student ID:",
            studentId
        );

        console.log(
            "Transport: Gmail API OAuth2"
        );

        console.log(
            "================================="
        );

        // =================================================
        // ESCAPE VALUES
        // =================================================

        const safeStudentId =
            escapeHtml(studentId);

        const safeOTP =
            escapeHtml(otp);

        // =================================================
        // OTP EMAIL HTML
        // =================================================

        const html = `
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

                <p>
                    Hello,
                </p>

                <p>
                    Your OTP for VOTARA voter
                    registration is:
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
                        ${safeOTP}
                    </span>

                </div>

                <p>
                    <strong>
                        Student ID:
                    </strong>
                    ${safeStudentId}
                </p>

                <p>
                    Enter this OTP on the VOTARA
                    registration verification page.
                </p>

                <p style="
                    color: #666;
                ">
                    This OTP will expire after
                    5 minutes.
                </p>

                <p style="
                    color: #666;
                ">
                    If you did not request this
                    registration, please ignore
                    this email.
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
        `;

        // =================================================
        // SEND THROUGH GMAIL API
        // =================================================

        const info = await sendEmail({
            to: email,
            subject: "VOTARA Registration OTP",
            html,
        });

        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "✅ OTP EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            "================================="
        );

        console.log(
            "To:",
            email
        );

        console.log(
            "Message ID:",
            info.id
        );

        console.log(
            "================================="
        );

        return {
            success: true,
            messageId: info.id,
        };

    } catch (error) {

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
            "Error:",
            error.message
        );

        if (error.code) {
            console.error(
                "Error Code:",
                error.code
            );
        }

        if (
            error.response &&
            error.response.data
        ) {
            console.error(
                "Google Response:",
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }

        console.error(
            "================================="
        );

        throw error;
    }
};

// =====================================================
// SEND REGISTRATION APPROVAL EMAIL
// =====================================================

const sendRegistrationApprovalEmail = async (
    email,
    studentId,
    fullName,
    yearLevel,
    temporaryPassword
) => {

    try {

        console.log(
            "================================="
        );

        console.log(
            "📧 SENDING VOTARA APPROVAL EMAIL"
        );

        console.log(
            "================================="
        );

        console.log(
            "To:",
            email
        );

        console.log(
            "Student ID:",
            studentId
        );

        console.log(
            "Transport: Gmail API OAuth2"
        );

        console.log(
            "================================="
        );

        // =================================================
        // ESCAPE VALUES
        // =================================================

        const safeEmail =
            escapeHtml(email);

        const safeStudentId =
            escapeHtml(studentId);

        const safeFullName =
            escapeHtml(fullName);

        const safeYearLevel =
            escapeHtml(yearLevel);

        const safeTemporaryPassword =
            escapeHtml(temporaryPassword);

        // =================================================
        // APPROVAL EMAIL HTML
        // =================================================

        const html = `
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
                    margin-bottom: 8px;
                ">
                    VOTARA Registration Approved
                </h2>

                <p style="
                    color: #555;
                    margin-top: 0;
                ">
                    Electoral Board Registration Confirmation
                </p>

                <p>
                    Hello
                    <strong>
                        ${safeFullName}
                    </strong>,
                </p>

                <p>
                    Your VOTARA voter registration has been
                    <strong style="
                        color: #16a34a;
                    ">
                        approved
                    </strong>
                    by the Electoral Board.
                </p>

                <!-- STUDENT INFORMATION -->

                <div style="
                    margin: 25px 0;
                    padding: 20px;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                ">

                    <h3 style="
                        margin-top: 0;
                        color: #111827;
                    ">
                        Student Information
                    </h3>

                    <p>
                        <strong>
                            Student ID:
                        </strong>
                        ${safeStudentId}
                    </p>

                    <p>
                        <strong>
                            Full Name:
                        </strong>
                        ${safeFullName}
                    </p>

                    <p>
                        <strong>
                            Year Level:
                        </strong>
                        ${safeYearLevel}
                    </p>

                    <p>
                        <strong>
                            Email:
                        </strong>
                        ${safeEmail}
                    </p>

                </div>

                <!-- LOGIN INFORMATION -->

                <div style="
                    margin: 25px 0;
                    padding: 20px;
                    background: #f3f6ff;
                    border-radius: 10px;
                ">

                    <h3 style="
                        margin-top: 0;
                        color: #0648ff;
                    ">
                        Your VOTARA Login Credentials
                    </h3>

                    <p>
                        <strong>
                            Student ID:
                        </strong>
                        ${safeStudentId}
                    </p>

                    <p>
                        <strong>
                            Temporary Password:
                        </strong>
                    </p>

                    <div style="
                        margin: 12px 0 20px 0;
                        padding: 16px;
                        text-align: center;
                        background: #ffffff;
                        border: 1px solid #dbe4ff;
                        border-radius: 8px;
                    ">

                        <span style="
                            font-size: 22px;
                            font-weight: bold;
                            letter-spacing: 1px;
                            color: #0648ff;
                        ">
                            ${safeTemporaryPassword}
                        </span>

                    </div>

                </div>

                <!-- IMPORTANT NOTICE -->

                <div style="
                    margin: 25px 0;
                    padding: 18px;
                    background: #fff7ed;
                    border-left: 4px solid #f59e0b;
                    border-radius: 6px;
                ">

                    <p style="
                        margin: 0;
                        color: #92400e;
                    ">

                        <strong>
                            Important:
                        </strong>

                        This is a temporary password.
                        You will be required to change your
                        password after your first successful
                        login.

                    </p>

                </div>

                <!-- LOGIN INSTRUCTIONS -->

                <h3 style="
                    color: #111827;
                ">
                    What to Do Next
                </h3>

                <ol style="
                    color: #374151;
                    line-height: 1.7;
                ">

                    <li>
                        Open the VOTARA login page.
                    </li>

                    <li>
                        Enter your Student ID.
                    </li>

                    <li>
                        Enter the temporary password
                        provided in this email.
                    </li>

                    <li>
                        After logging in, create your
                        personal password.
                    </li>

                    <li>
                        Keep your login credentials secure.
                    </li>

                </ol>

                <p style="
                    color: #555;
                ">
                    Please do not share your temporary password
                    with anyone.
                </p>

                <hr style="
                    border: none;
                    border-top: 1px solid #eeeeee;
                    margin: 30px 0;
                ">

                <p style="
                    font-size: 12px;
                    color: #888;
                    line-height: 1.6;
                ">

                    VOTARA Electoral Board<br>
                    Western Institute of Technology

                </p>

            </div>
        `;

        // =================================================
        // SEND THROUGH GMAIL API
        // =================================================

        const info = await sendEmail({
            to: email,
            subject:
                "VOTARA Registration Approved - Login Credentials",
            html,
        });

        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "✅ APPROVAL EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            "================================="
        );

        console.log(
            "To:",
            email
        );

        console.log(
            "Message ID:",
            info.id
        );

        console.log(
            "================================="
        );

        return {
            success: true,
            messageId: info.id,
        };

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "❌ APPROVAL EMAIL FAILED"
        );

        console.error(
            "================================="
        );

        console.error(
            "Error:",
            error.message
        );

        if (error.code) {
            console.error(
                "Error Code:",
                error.code
            );
        }

        if (
            error.response &&
            error.response.data
        ) {
            console.error(
                "Google Response:",
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }

        console.error(
            "================================="
        );

        throw error;
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    sendOTPEmail,
    sendRegistrationApprovalEmail,
    verifyEmailConnection,
};