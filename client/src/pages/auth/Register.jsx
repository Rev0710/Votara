import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import votaraLogo from "../../assets/images/votara-logo.png";
import "./Register.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (
        import.meta.env.PROD
            ? "https://votara-api-olij.onrender.com/api"
            : "http://localhost:5000/api"
    );

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showLateEnrolleeModal, setShowLateEnrolleeModal] =
        useState(false);

    const [lateEnrolleeData, setLateEnrolleeData] =
        useState(null);

    const clearError = () => {
        if (error) {
            setError("");
        }
    };

    const saveRegistrationSession = ({
        studentId: cleanStudentId,
        email: cleanEmail,
        fullName = "",
        yearLevel = "",
        registrationType = "normal",
    }) => {
        sessionStorage.setItem("votara_student_id", cleanStudentId);
        sessionStorage.setItem("votara_full_name", fullName);
        sessionStorage.setItem("votara_year_level", yearLevel);
        sessionStorage.setItem("votara_email", cleanEmail);
        sessionStorage.setItem("votara_registration_type", registrationType);
    };

    const handleBack = () => {
        if (!loading) {
            navigate("/");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setShowLateEnrolleeModal(false);

        const cleanStudentId = studentId.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanStudentId) {
            setError("Please enter your Student ID.");
            return;
        }

        if (!/^\d{5}$/.test(cleanStudentId)) {
            setError("Student ID must contain exactly 5 digits.");
            return;
        }

        if (!cleanEmail) {
            setError("Please enter your Gmail address.");
            return;
        }

        if (!/^[^\s@]+@gmail\.com$/i.test(cleanEmail)) {
            setError("Please enter a valid Gmail address.");
            return;
        }

        try {
            setLoading(true);

            let response;

            try {
                response = await fetch(
                    `${API_BASE_URL}/registration/send-otp`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            studentId: cleanStudentId,
                            email: cleanEmail,
                        }),
                    }
                );
            } catch (networkError) {
                console.error("❌ Registration network error:", networkError);

                throw new Error(
                    "Unable to connect to the VOTARA server. Please make sure the server is running on port 5000."
                );
            }

            let data = {};

            try {
                data = await response.json();
            } catch (jsonError) {
                console.error("❌ Invalid server response:", jsonError);

                throw new Error(
                    "The VOTARA server returned an invalid response. Please check the server console."
                );
            }

            console.log("📋 Registration server response:", data);

            const studentNotFound =
                data?.studentFound === false ||
                data?.code === "STUDENT_NOT_FOUND" ||
                data?.code === "STUDENT_NOT_IN_ROSTER";

            if (studentNotFound) {
                const lateData = {
                    studentId: cleanStudentId,
                    email: cleanEmail,
                    fullName:
                        data?.student?.fullName ||
                        data?.fullName ||
                        "",
                    yearLevel:
                        data?.student?.yearLevel ||
                        data?.yearLevel ||
                        "",
                    registrationType: "late_enrollee",
                };

                setLateEnrolleeData(lateData);
                setShowLateEnrolleeModal(true);
                setLoading(false);
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to continue registration. Please try again."
                );
            }

            const serverFullName =
                data?.student?.fullName ||
                data?.fullName ||
                "";

            const serverYearLevel =
                data?.student?.yearLevel ||
                data?.yearLevel ||
                "";

            saveRegistrationSession({
                studentId: cleanStudentId,
                email: cleanEmail,
                fullName: serverFullName,
                yearLevel: serverYearLevel,
                registrationType: "normal",
            });

            navigate("/verify-otp");
        } catch (error) {
            console.error("❌ Registration error:", error);

            setError(
                error?.message ||
                "Unable to register. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLateEnrolleeYes = () => {
        if (!lateEnrolleeData) {
            setError(
                "Late enrollee information is unavailable. Please try again."
            );

            setShowLateEnrolleeModal(false);
            return;
        }

        saveRegistrationSession({
            studentId: lateEnrolleeData.studentId,
            email: lateEnrolleeData.email,
            fullName: lateEnrolleeData.fullName,
            yearLevel: lateEnrolleeData.yearLevel,
            registrationType: "late_enrollee",
        });

        setShowLateEnrolleeModal(false);
        navigate("/registration-requirements");
    };

    const handleLateEnrolleeNo = () => {
        setShowLateEnrolleeModal(false);
        setLateEnrolleeData(null);

        sessionStorage.removeItem("votara_student_id");
        sessionStorage.removeItem("votara_full_name");
        sessionStorage.removeItem("votara_year_level");
        sessionStorage.removeItem("votara_email");
        sessionStorage.removeItem("votara_registration_type");

        navigate("/");
    };

    return (
        <div className="register-page">
            <div className="register-card">

                <section className="register-left">

                    <button
                        type="button"
                        className="register-logo"
                        onClick={handleBack}
                        aria-label="Go to VOTARA home"
                        disabled={loading}
                    >
                        <img src={votaraLogo} alt="Votara" />
                    </button>

                    <div className="register-left-copy">
                        <span className="register-eyebrow">
                            VOTARA&nbsp;&nbsp;/&nbsp;&nbsp;CAMPUS ELECTIONS
                        </span>

                        <h2>
                            Your voice
                            <br />
                            belongs here.
                        </h2>

                        <p>
                            We'll verify your student record and send a
                            one-time code to your school email.
                        </p>

                        <div className="register-steps">
                            <div><span>01</span> Student details</div>
                            <div><span>02</span> Verify your one-time code</div>
                            <div><span>03</span> Await board review</div>
                        </div>
                    </div>

                    <div className="register-orbit" aria-hidden="true">
                        <div className="register-orbit-ring orbit-one"></div>
                        <div className="register-orbit-ring orbit-two"></div>
                        <div className="register-orbit-ring orbit-three"></div>

                        <div className="register-orbit-core">
                            <img src={votaraLogo} alt="" />
                        </div>

                        <span className="orbit-dot orbit-check">✓</span>
                        <span className="orbit-dot orbit-shield">▣</span>
                        <span className="orbit-dot orbit-user">♙</span>
                    </div>
                </section>

                <section className="register-right">
                    <Link
                        to="/"
                        className="register-back-top"
                        aria-label="Go back to VOTARA home"
                    >
                        ← Back to Votara
                    </Link>

                    <div className="register-content">

                        <div className="register-heading">
                            <span className="register-kicker">
                                VOTER REGISTRATION
                            </span>

                            <h1>Create your account</h1>

                            <p>
                                Enter your student ID and school email. We'll send a
                                one-time code to that email.
                            </p>
                        </div>

                        {error && (
                            <div className="register-error" role="alert">
                                {error}
                            </div>
                        )}

                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label htmlFor="studentId">
                                    Student ID
                                </label>

                                <input
                                    id="studentId"
                                    name="studentId"
                                    type="text"
                                    placeholder="Enter your student ID"
                                    value={studentId}
                                    maxLength={5}
                                    inputMode="numeric"
                                    autoComplete="username"
                                    onChange={(e) => {
                                        setStudentId(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 5)
                                        );

                                        clearError();
                                    }}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your school email"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        clearError();
                                    }}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading ? "Checking..." : "Continue"}
                            </button>
                        </form>

                        <div className="register-links">
                            <Link
                                to="/account-selection"
                                className="admin-link"
                            >
                                Register as an admin or electoral board member
                            </Link>

                            <Link
                                to="/login"
                                className="signin-link"
                            >
                                Sign in
                            </Link>

                        </div>
                    </div>
                </section>
            </div>

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
                        <div className="late-enrollee-icon">
                            <span>!</span>
                        </div>

                        <h2 id="late-enrollee-title">
                            Hello, Student!
                        </h2>

                        <p className="late-enrollee-main-message">
                            Your Student ID was not found in the
                            current student roster.
                        </p>

                        <p className="late-enrollee-sub-message">
                            You may be a <strong>late enrollee</strong>.
                            Would you like to proceed with
                            late enrollee registration?
                        </p>

                        {lateEnrolleeData?.studentId && (
                            <div className="late-enrollee-student-info">
                                <span>Student ID</span>
                                <strong>
                                    {lateEnrolleeData.studentId}
                                </strong>
                            </div>
                        )}

                        <div className="late-enrollee-actions">
                            <button
                                type="button"
                                className="late-enrollee-no-button"
                                onClick={handleLateEnrolleeNo}
                            >
                                No
                            </button>

                            <button
                                type="button"
                                className="late-enrollee-yes-button"
                                onClick={handleLateEnrolleeYes}
                            >
                                Yes, Continue
                            </button>
                        </div>

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
