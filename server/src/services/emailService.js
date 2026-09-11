const { google } = require("googleapis");


// =====================================================
// GOOGLE OAUTH2 CONFIGURATION
// =====================================================

const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET;

const GOOGLE_REFRESH_TOKEN =
    process.env.GOOGLE_REFRESH_TOKEN;

const EMAIL_USER =
    process.env.EMAIL_USER;


// =====================================================
// VALIDATE GOOGLE CONFIGURATION
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

if (!EMAIL_USER) {
    throw new Error(
        "EMAIL_USER is missing from server/.env"
    );
}


// =====================================================
// GOOGLE OAUTH2 CLIENT
// =====================================================

const oauth2Client =
    new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );


// =====================================================
// REFRESH TOKEN
// =====================================================

oauth2Client.setCredentials({
    refresh_token:
        GOOGLE_REFRESH_TOKEN,
});


// =====================================================
// GMAIL API CLIENT
// =====================================================

const gmail =
    google.gmail({
        version: "v1",
        auth: oauth2Client,
    });


// =====================================================
// VERIFY GMAIL API CONNECTION
// =====================================================

const verifyEmailConnection =
    async () => {

        try {

            /*
             * Request a fresh access token using the
             * long-lived refresh token.
             *
             * Google automatically refreshes the
             * short-lived access token when necessary.
             */

            const {
                token,
            } = await oauth2Client.getAccessToken();


            if (!token) {

                throw new Error(
                    "Unable to obtain a Gmail API access token."
                );

            }


            console.log(
                "================================="
            );

            console.log(
                "✅ GOOGLE OAUTH CONNECTION SUCCESS"
            );

            console.log(
                "================================="
            );

            console.log(
                "Gmail API access token obtained."
            );

            console.log(
                "Gmail send scope is ready."
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
                "❌ GOOGLE OAUTH CONNECTION FAILED"
            );

            console.error(
                "================================="
            );

            console.error(
                "Error:",
                error.message
            );


            if (
                error.response &&
                error.response.data
            ) {

                console.error(
                    "Google Response:",
                    error.response.data
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

const sendOTPEmail =
    async (
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

            /*
             * We intentionally do NOT log the OTP.
             *
             * The OTP is sensitive authentication
             * information and should not appear in
             * production server logs.
             */

            console.log(
                "Transport: Gmail API"
            );

            console.log(
                "================================="
            );


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
                            ${otp}
                        </span>

                    </div>

                    <p>
                        <strong>
                            Student ID:
                        </strong>
                        ${studentId}
                    </p>

                    <p>
                        Enter this OTP on the VOTARA
                        registration verification page.
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
            // CREATE MIME EMAIL
            // =================================================

            const rawMessage = [

                `From: "VOTARA Electoral Board" <${EMAIL_USER}>`,

                `To: ${email}`,

                `Subject: VOTARA Registration OTP`,

                "MIME-Version: 1.0",

                "Content-Type: text/html; charset=UTF-8",

                "",

                html,

            ].join("\r\n");


            // =================================================
            // BASE64URL ENCODE
            // =================================================

            /*
             * Gmail API requires the complete MIME
             * message to be Base64URL encoded.
             */

            const encodedMessage =
                Buffer
                    .from(
                        rawMessage,
                        "utf8"
                    )
                    .toString(
                        "base64url"
                    );


            // =================================================
            // SEND THROUGH GMAIL API
            // =================================================

            const response =
                await gmail.users.messages.send({

                    userId: "me",

                    requestBody: {

                        raw:
                            encodedMessage,

                    },

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
                "Gmail Message ID:",
                response.data.id
            );

            console.log(
                "================================="
            );


            return {

                success: true,

                messageId:
                    response.data.id,

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


            if (
                error.code
            ) {

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
                    error.response.data
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

    verifyEmailConnection,

};