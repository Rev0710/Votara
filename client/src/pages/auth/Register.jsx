import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [fullName, setFullName] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [email, setEmail] = useState("");

    const [registrationType, setRegistrationType] =
        useState("normal");

    const [showLateEnrolleeForm, setShowLateEnrolleeForm] =
        useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // HANDLE FULL NAME
    //
    // FORMAT:
    // LastName_FirstName_MiddleInitial
    //
    // EXAMPLE:
    // DelaCruz_John_R
    // =====================================================

    const handleFullNameChange = (e) => {
        let value = e.target.value;

        // Allow:
        // Letters
        // Spaces
        // Underscores
        // Hyphens
        // Apostrophes
        // Periods

        value = value.replace(
            /[^A-Za-zÀ-ÖØ-öø-ÿ'._ -]/g,
            ""
        );

        setFullName(value);
    };

    // =====================================================
    // VALIDATE FULL NAME
    // =====================================================

    const validateFullName = (name) => {
        const cleanName = name.trim();

        const nameParts = cleanName.split("_");

        // Must have exactly:
        // LastName
        // FirstName
        // MiddleInitial

        if (nameParts.length !== 3) {
            return {
                valid: false,
                message:
                    "Please follow this format: LastName_FirstName_MiddleInitial",
            };
        }

        const lastName = nameParts[0].trim();
        const firstName = nameParts[1].trim();
        const middleInitial = nameParts[2].trim();

        if (!lastName) {
            return {
                valid: false,
                message:
                    "Please enter your last name.",
            };
        }

        if (!firstName) {
            return {
                valid: false,
                message:
                    "Please enter your first name.",
            };
        }

        if (!middleInitial) {
            return {
                valid: false,
                message:
                    "Please enter your middle initial.",
            };
        }

        // Middle initial:
        // R
        // R.

        if (
            !/^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(
                middleInitial
            )
        ) {
            return {
                valid: false,
                message:
                    "Middle initial must contain only one letter, such as R or R.",
            };
        }

        return {
            valid: true,
            message: "",
        };
    };

    // =====================================================
    // HANDLE SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            // =================================================
            // CLEAN INPUT
            // =================================================

            const cleanStudentId =
                studentId.trim();

            const cleanEmail =
                email.trim().toLowerCase();

            const cleanFullName =
                fullName.trim();

            const cleanYearLevel =
                yearLevel.trim();

            // =================================================
            // STUDENT ID VALIDATION
            // =================================================

            if (!cleanStudentId) {
                throw new Error(
                    "Please enter your Student ID."
                );
            }

            if (
                !/^\d{5}$/.test(
                    cleanStudentId
                )
            ) {
                throw new Error(
                    "Student ID must contain exactly 5 digits."
                );
            }

            // =================================================
            // EMAIL VALIDATION
            // =================================================

            if (!cleanEmail) {
                throw new Error(
                    "Please enter your Gmail address."
                );
            }

            if (
                !/^[^\s@]+@gmail\.com$/i.test(
                    cleanEmail
                )
            ) {
                throw new Error(
                    "Please enter a valid Gmail address."
                );
            }

            // =================================================
            // LATE ENROLLEE VALIDATION
            // =================================================

            if (showLateEnrolleeForm) {

                if (!cleanFullName) {
                    throw new Error(
                        "Please enter your full name."
                    );
                }

                const nameValidation =
                    validateFullName(
                        cleanFullName
                    );

                if (!nameValidation.valid) {
                    throw new Error(
                        nameValidation.message
                    );
                }

                if (!cleanYearLevel) {
                    throw new Error(
                        "Please select your year level."
                    );
                }

                if (
                    ![
                        "1st Year",
                        "2nd Year",
                        "3rd Year",
                        "4th Year",
                    ].includes(
                        cleanYearLevel
                    )
                ) {
                    throw new Error(
                        "Please select a valid year level."
                    );
                }
            }

            // =================================================
            // SEND REGISTRATION REQUEST
            //
            // IMPORTANT:
            // The server checks the Student ID against
            // the enrollment database.
            //
            // Normal student:
            // studentFound = true
            //
            // Late enrollee:
            // studentFound = false
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

                            // These are only supplied
                            // when the late enrollee
                            // form is being used.

                            ...(showLateEnrolleeForm && {
                                fullName:
                                    cleanFullName,

                                yearLevel:
                                    cleanYearLevel,
                            }),
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
            // READ SERVER RESPONSE
            // =================================================

            let data;

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

            // =================================================
            // STUDENT NOT FOUND
            //
            // The backend should return:
            //
            // {
            //   success: false,
            //   studentFound: false,
            //   code: "STUDENT_NOT_FOUND"
            // }
            //
            // This does NOT immediately reject the student.
            // It changes the form to the Late Enrollee Form.
            // =================================================

            if (
                data.studentFound === false &&
                !showLateEnrolleeForm
            ) {
                setRegistrationType(
                    "late_enrollee"
                );

                setShowLateEnrolleeForm(true);

                setError(
                    "Your Student ID was not found in the current enrollment database. Please complete the Late Enrollee Form for additional verification."
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
                    "Unable to send OTP. Please try again."
                );
            }

            // =================================================
            // GET STUDENT INFORMATION
            //
            // For NORMAL students, these values should come
            // from the enrollment database.
            //
            // Example server response:
            //
            // {
            //   success: true,
            //   studentFound: true,
            //   student: {
            //      fullName: "...",
            //      yearLevel: "2nd Year"
            //   }
            // }
            // =================================================

            const serverFullName =
                data.student?.fullName ||
                data.fullName ||
                cleanFullName;

            const serverYearLevel =
                data.student?.yearLevel ||
                data.yearLevel ||
                cleanYearLevel;

            // =================================================
            // SAVE REGISTRATION INFORMATION
            // =================================================

            sessionStorage.setItem(
                "votara_student_id",
                cleanStudentId
            );

            sessionStorage.setItem(
                "votara_full_name",
                serverFullName
            );

            sessionStorage.setItem(
                "votara_year_level",
                serverYearLevel
            );

            sessionStorage.setItem(
                "votara_email",
                cleanEmail
            );

            sessionStorage.setItem(
                "votara_registration_type",
                showLateEnrolleeForm
                    ? "late_enrollee"
                    : "normal"
            );

            // =================================================
            // GO TO OTP PAGE
            // =================================================

            navigate("/verify-otp");

        } catch (error) {
            console.error(
                "❌ Registration error:",
                error
            );

            setError(
                error.message ||
                "Unable to register. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="register-left">

                    {/* VOTARA LOGO */}

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
                            <div className="register-error">
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            LATE ENROLLEE NOTICE
                        ================================================= */}

                        {showLateEnrolleeForm && (
                            <div className="register-error">
                                <strong>
                                    Late Enrollee Registration
                                </strong>
                                <br />
                                Your Student ID is not currently
                                found in the enrollment database.
                                Please provide the additional
                                information below for verification.
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
                                    type="text"
                                    placeholder="Enter your Student ID"
                                    value={studentId}
                                    maxLength={5}
                                    onChange={(e) =>
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
                                        )
                                    }
                                    required
                                    disabled={loading}
                                />

                            </div>


                            {/* =================================================
                                LATE ENROLLEE FULL NAME
                            ================================================= */}

                            {showLateEnrolleeForm && (
                                <div className="form-group">

                                    <label htmlFor="fullName">
                                        Full Name
                                    </label>

                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="LastName_FirstName_MiddleInitial"
                                        value={fullName}
                                        onChange={
                                            handleFullNameChange
                                        }
                                        required
                                        disabled={loading}
                                    />

                                </div>
                            )}


                            {/* =================================================
                                LATE ENROLLEE YEAR LEVEL
                            ================================================= */}

                            {showLateEnrolleeForm && (
                                <div className="form-group">

                                    <label htmlFor="yearLevel">
                                        Year Level
                                    </label>

                                    <div className="select-wrapper">

                                        <select
                                            id="yearLevel"
                                            value={yearLevel}
                                            onChange={(e) =>
                                                setYearLevel(
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={loading}
                                        >

                                            <option value="">
                                                Select your year level
                                            </option>

                                            <option value="1st Year">
                                                1st Year
                                            </option>

                                            <option value="2nd Year">
                                                2nd Year
                                            </option>

                                            <option value="3rd Year">
                                                3rd Year
                                            </option>

                                            <option value="4th Year">
                                                4th Year
                                            </option>

                                        </select>

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                EMAIL
                            ================================================= */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Gmail Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your Gmail address"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    required
                                    disabled={loading}
                                />

                            </div>


                            {/* =================================================
                                SUBMIT
                            ================================================= */}

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Checking..."
                                    : showLateEnrolleeForm
                                    ? "Continue Registration"
                                    : "Sign up"}

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

        </div>
    );
};

export default Register;