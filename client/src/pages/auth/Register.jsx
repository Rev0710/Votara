import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // LATE ENROLLEE MODAL
    // =====================================================

    const [showLateEnrolleeModal, setShowLateEnrolleeModal] =
        useState(false);

    // =====================================================
    // LATE ENROLLEE INFORMATION
    //
    // Stored temporarily so the information can be used
    // by RegistrationRequirements.jsx.
    // =====================================================

    const [lateEnrolleeData, setLateEnrolleeData] =
        useState(null);

    // =====================================================
    // CLEAR ERROR WHEN USER CHANGES INPUT
    // =====================================================

    const clearError = () => {
        if (error) {
            setError("");
        }
    };

    // =====================================================
    // SAVE REGISTRATION SESSION
    // =====================================================

    const saveRegistrationSession = ({
        studentId: cleanStudentId,
        email: cleanEmail,
        fullName = "",
        yearLevel = "",
        registrationType = "normal",
    }) => {
        sessionStorage.setItem(
            "votara_student_id",
            cleanStudentId
        );

        sessionStorage.setItem(
            "votara_full_name",
            fullName
        );

        sessionStorage.setItem(
            "votara_year_level",
            yearLevel
        );

        sessionStorage.setItem(
            "votara_email",
            cleanEmail
        );

        sessionStorage.setItem(
            "votara_registration_type",
            registrationType
        );
    };

    // =====================================================
    // HANDLE SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // =================================================
        // CLOSE ANY OLD MODAL
        // =================================================

        setShowLateEnrolleeModal(false);

        // =================================================
        // CLEAN INPUT
        // =================================================

        const cleanStudentId =
            studentId.trim();

        const cleanEmail =
            email.trim().toLowerCase();

        // =================================================
        // STUDENT ID VALIDATION
        // =================================================

        if (!cleanStudentId) {
            setError(
                "Please enter your Student ID."
            );
            return;
        }

        if (
            !/^\d{5}$/.test(
                cleanStudentId
            )
        ) {
            setError(
                "Student ID must contain exactly 5 digits."
            );
            return;
        }

        // =================================================
        // EMAIL VALIDATION
        // =================================================

        if (!cleanEmail) {
            setError(
                "Please enter your Gmail address."
            );
            return;
        }

        if (
            !/^[^\s@]+@gmail\.com$/i.test(
                cleanEmail
            )
        ) {
            setError(
                "Please enter a valid Gmail address."
            );
            return;
        }

        try {
            setLoading(true);

            // =================================================
            // CHECK STUDENT / SEND OTP
            //
            // The backend checks whether the Student ID
            // exists in the current roster.
            //
            // FOUND:
            //     Normal registration + OTP
            //
            // NOT FOUND:
            //     Potential late enrollee
            //     Show confirmation modal
            // =================================================

            let response;

            try {
                response = await fetch(
                    "http://localhost:5000/api/registration/send-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            studentId:
                                cleanStudentId,

                            email:
                                cleanEmail,
                        }),
                    }
                );

            } catch (networkError) {

                console.error(
                    "❌ Registration network error:",
                    networkError
                );

                throw new Error(
                    "Unable to connect to the VOTARA server. Please make sure the server is running on port 5000."
                );
            }

            // =================================================
            // READ RESPONSE
            // =================================================

            let data = {};

            try {
                data =
                    await response.json();

            } catch (jsonError) {

                console.error(
                    "❌ Invalid server response:",
                    jsonError
                );

                throw new Error(
                    "The VOTARA server returned an invalid response. Please check the server console."
                );
            }

            console.log(
                "📋 Registration server response:",
                data
            );

            // =================================================
            // LATE ENROLLEE DETECTION
            //
            // IMPORTANT:
            //
            // A missing roster record does NOT immediately
            // reject the student.
            //
            // It opens the Late Enrollee confirmation modal.
            // =================================================

            const studentNotFound =
                data?.studentFound === false ||
                data?.code === "STUDENT_NOT_FOUND" ||
                data?.code === "STUDENT_NOT_IN_ROSTER";

            if (studentNotFound) {

                console.log(
                    "⚠️ Student not found in current roster."
                );

                // =================================================
                // SAVE LATE ENROLLEE INFORMATION
                // =================================================

                const lateData = {
                    studentId:
                        cleanStudentId,

                    email:
                        cleanEmail,

                    fullName:
                        data?.student?.fullName ||
                        data?.fullName ||
                        "",

                    yearLevel:
                        data?.student?.yearLevel ||
                        data?.yearLevel ||
                        "",

                    registrationType:
                        "late_enrollee",
                };

                setLateEnrolleeData(
                    lateData
                );

                // =================================================
                // SHOW CENTER MODAL
                // =================================================

                setShowLateEnrolleeModal(
                    true
                );

                setLoading(false);

                return;
            }

            // =================================================
            // SERVER ERROR
            // =================================================

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to continue registration. Please try again."
                );
            }

            // =================================================
            // NORMAL STUDENT INFORMATION
            // =================================================

            const serverFullName =
                data?.student?.fullName ||
                data?.fullName ||
                "";

            const serverYearLevel =
                data?.student?.yearLevel ||
                data?.yearLevel ||
                "";

            // =================================================
            // SAVE NORMAL REGISTRATION SESSION
            // =================================================

            saveRegistrationSession({
                studentId:
                    cleanStudentId,

                email:
                    cleanEmail,

                fullName:
                    serverFullName,

                yearLevel:
                    serverYearLevel,

                registrationType:
                    "normal",
            });

            // =================================================
            // NORMAL STUDENT
            //
            // OTP was successfully sent.
            // =================================================

            console.log(
                "✅ Normal student registration."
            );

            console.log(
                "📧 OTP sent successfully."
            );

            // =================================================
            // GO TO OTP VERIFICATION
            // =================================================

            navigate(
                "/verify-otp"
            );

        } catch (error) {

            console.error(
                "❌ Registration error:",
                error
            );

            setError(
                error?.message ||
                "Unable to register. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // HANDLE LATE ENROLLEE YES
    // =====================================================

    const handleLateEnrolleeYes = () => {

        if (!lateEnrolleeData) {
            setError(
                "Late enrollee information is unavailable. Please try again."
            );

            setShowLateEnrolleeModal(false);

            return;
        }

        // =================================================
        // SAVE LATE REGISTRATION SESSION
        // =================================================

        saveRegistrationSession({
            studentId:
                lateEnrolleeData.studentId,

            email:
                lateEnrolleeData.email,

            fullName:
                lateEnrolleeData.fullName,

            yearLevel:
                lateEnrolleeData.yearLevel,

            registrationType:
                "late_enrollee",
        });

        // =================================================
        // CLOSE MODAL
        // =================================================

        setShowLateEnrolleeModal(
            false
        );

        // =================================================
        // GO DIRECTLY TO REGISTRATION REQUIREMENTS
        //
        // NO OTP HERE.
        //
        // Late enrollee will be verified by EB through
        // the required documents/selfie.
        // =================================================

        navigate(
            "/registration-requirements"
        );
    };

    // =====================================================
    // HANDLE LATE ENROLLEE NO
    // =====================================================

    const handleLateEnrolleeNo = () => {

        // =================================================
        // CLOSE MODAL
        // =================================================

        setShowLateEnrolleeModal(
            false
        );

        setLateEnrolleeData(
            null
        );

        // =================================================
        // CLEAR TEMP REGISTRATION DATA
        // =================================================

        sessionStorage.removeItem(
            "votara_student_id"
        );

        sessionStorage.removeItem(
            "votara_full_name"
        );

        sessionStorage.removeItem(
            "votara_year_level"
        );

        sessionStorage.removeItem(
            "votara_email"
        );

        sessionStorage.removeItem(
            "votara_registration_type"
        );

        // =================================================
        // RETURN TO LANDING PAGE
        // =================================================

        navigate(
            "/"
        );
    };

    return (
        <div className="register-page">

            {/* =================================================
                MAIN CARD
            ================================================= */}

            <div className="register-card">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="register-left">

                    {/* =================================================
                        VOTARA LOGO
                    ================================================= */}

                    <Link
                        to="/"
                        className="register-logo"
                    >

                        <span className="register-logo-mark">

                            <span className="triangle triangle-top">
                            </span>

                            <span className="circle">
                            </span>

                            <span className="triangle triangle-bottom">
                            </span>

                        </span>

                        <span>
                            Votara
                        </span>

                    </Link>


                    {/* =================================================
                        REGISTRATION ILLUSTRATION
                    ================================================= */}

                    <div className="register-visual">

                        <img
                            src="/src/images/Register.png"
                            alt="Votara registration illustration"
                            className="register-illustration"
                        />

                    </div>

                </section>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <section className="register-right">

                    <div className="register-content">

                        {/* =================================================
                            HEADING
                        ================================================= */}

                        <div className="register-heading">

                            <h1>
                                Welcome!
                            </h1>

                            <p>
                                Register as a voter on the Western Institute
                                of Technology voting platform to vote for your
                                preferred candidate.
                            </p>

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (
                            <div
                                className="register-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            REGISTRATION FORM
                        ================================================= */}

                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >

                            {/* =================================================
                                STUDENT ID
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="studentId">
                                    Student ID No.
                                </label>

                                <input
                                    id="studentId"
                                    name="studentId"
                                    type="text"
                                    placeholder="Enter your Student ID"
                                    value={studentId}
                                    maxLength={5}
                                    inputMode="numeric"
                                    autoComplete="username"
                                    onChange={(e) => {

                                        setStudentId(
                                            e.target.value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    5
                                                )
                                        );

                                        clearError();
                                    }}
                                    required
                                    disabled={loading}
                                />

                            </div>


                            {/* =================================================
                                EMAIL
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Gmail Address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your Gmail address"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(e) => {

                                        setEmail(
                                            e.target.value
                                        );

                                        clearError();
                                    }}
                                    required
                                    disabled={loading}
                                />

                            </div>


                            {/* =================================================
                                SUBMIT BUTTON
                            ================================================= */}

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Checking..."
                                    : "Sign up"
                                }

                            </button>

                        </form>


                        {/* =================================================
                            BOTTOM LINKS
                        ================================================= */}

                        <div className="register-links">

                            <Link
                                to="/account-selection"
                                className="admin-link"
                            >
                                Sign up as Admin/Electoral Board
                            </Link>

                            <Link
                                to="/"
                                className="back-link"
                            >
                                ← Back to Votara
                            </Link>

                        </div>

                    </div>

                </section>

            </div>


            {/* =========================================================
                LATE ENROLLEE MODAL
            ========================================================= */}

            {showLateEnrolleeModal && (

                <div
                    className="late-enrollee-overlay"
                    role="presentation"
                >

                    <div
                        className="late-enrollee-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="late-enrollee-title"
                    >

                        {/* =================================================
                            ICON
                        ================================================= */}

                        <div className="late-enrollee-icon">

                            <span>
                                !
                            </span>

                        </div>


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <h2 id="late-enrollee-title">
                            Hello, Student!
                        </h2>


                        {/* =================================================
                            MESSAGE
                        ================================================= */}

                        <p className="late-enrollee-main-message">
                            Your Student ID was not found in the
                            current student roster.
                        </p>

                        <p className="late-enrollee-sub-message">
                            You may be a <strong>late enrollee</strong>.
                            Would you like to proceed with
                            late enrollee registration?
                        </p>


                        {/* =================================================
                            STUDENT ID
                        ================================================= */}

                        {lateEnrolleeData?.studentId && (

                            <div className="late-enrollee-student-info">

                                <span>
                                    Student ID
                                </span>

                                <strong>
                                    {lateEnrolleeData.studentId}
                                </strong>

                            </div>

                        )}


                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        <div className="late-enrollee-actions">

                            <button
                                type="button"
                                className="late-enrollee-no-button"
                                onClick={
                                    handleLateEnrolleeNo
                                }
                            >
                                No
                            </button>

                            <button
                                type="button"
                                className="late-enrollee-yes-button"
                                onClick={
                                    handleLateEnrolleeYes
                                }
                            >
                                Yes, Continue
                            </button>

                        </div>


                        {/* =================================================
                            NOTICE
                        ================================================= */}

                        <p className="late-enrollee-note">
                            Your registration will be reviewed by
                            the Electoral Board before your account
                            can be activated.
                        </p>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Register;