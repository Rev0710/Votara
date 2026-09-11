import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./RegistrationSubmitted.css";

const RegistrationSubmitted = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [fullName, setFullName] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [registrationType, setRegistrationType] =
        useState("normal");

    useEffect(() => {
        const savedStudentId =
            sessionStorage.getItem(
                "votara_student_id"
            );

        const savedFullName =
            sessionStorage.getItem(
                "votara_full_name"
            );

        const savedYearLevel =
            sessionStorage.getItem(
                "votara_year_level"
            );

        const savedRegistrationType =
            sessionStorage.getItem(
                "votara_registration_type"
            );

        if (!savedStudentId) {
            navigate("/register");
            return;
        }

        setStudentId(savedStudentId);

        setFullName(
            savedFullName || ""
        );

        setYearLevel(
            savedYearLevel || ""
        );

        setRegistrationType(
            savedRegistrationType || "normal"
        );

    }, [navigate]);


    // =====================================================
    // RETURN TO VOTARA
    // =====================================================

    const handleBackToVotara = () => {
        navigate("/");
    };


    return (
        <div className="registration-submitted-page">

            <div className="registration-submitted-card">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="registration-submitted-left">

                    <Link
                        to="/"
                        className="registration-submitted-logo"
                    >

                        <span className="registration-submitted-logo-mark">

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


                    <div className="registration-submitted-visual">

                        <div className="success-icon">

                            ✓

                        </div>

                    </div>

                </section>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <section className="registration-submitted-right">

                    <div className="registration-submitted-content">

                        {/* =================================================
                            HEADING
                        ================================================= */}

                        <div className="registration-submitted-heading">

                            <div className="success-badge">
                                ✓
                            </div>

                            <h1>
                                Registration Submitted!
                            </h1>

                            <p>
                                Your email has been successfully
                                verified and your registration
                                information has been submitted.
                            </p>

                        </div>


                        {/* =================================================
                            STUDENT INFORMATION
                        ================================================= */}

                        <div className="student-information">

                            <div className="information-row">

                                <span>
                                    Student ID
                                </span>

                                <strong>
                                    {studentId}
                                </strong>

                            </div>


                            <div className="information-row">

                                <span>
                                    Full Name
                                </span>

                                <strong>
                                    {fullName}
                                </strong>

                            </div>


                            <div className="information-row">

                                <span>
                                    Year Level
                                </span>

                                <strong>
                                    {yearLevel}
                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            NORMAL STUDENT
                        ================================================= */}

                        {registrationType ===
                            "normal" && (

                            <div className="registration-notice">

                                <div className="notice-icon">
                                    ℹ
                                </div>

                                <div>

                                    <strong>
                                        Registration successful
                                    </strong>

                                    <p>
                                        Your registration has been
                                        recorded successfully. Your
                                        account is now waiting for
                                        activation by the Electoral
                                        Board or Administrator.
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            LATE ENROLLEE
                        ================================================= */}

                        {registrationType ===
                            "late_enrollee" && (

                            <div className="registration-notice late">

                                <div className="notice-icon">
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Late enrollee registration
                                    </strong>

                                    <p>
                                        Your registration has been
                                        submitted successfully.
                                        Because your Student ID was
                                        not found in the current
                                        enrollment database, your
                                        registration requires
                                        additional verification by
                                        the Electoral Board or
                                        Administrator.
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            NEXT STEP
                        ================================================= */}

                        <div className="next-step">

                            <h3>
                                What happens next?
                            </h3>

                            <p>
                                Please wait for the Electoral Board
                                or Administrator to activate your
                                account and provide your temporary
                                login credentials. Once your account
                                has been activated, you can log in
                                using your Student ID.
                            </p>

                        </div>


                        {/* =================================================
                            ACCOUNT STATUS
                        ================================================= */}

                        <div className="next-step">

                            <h3>
                                Account Status
                            </h3>

                            <p>
                                <strong>
                                    Registration Submitted
                                </strong>
                                <br />
                                Your account is currently
                                <strong>
                                    {" "}waiting for verification and activation.
                                </strong>
                            </p>

                        </div>


                        {/* =================================================
                            RETURN TO VOTARA
                        ================================================= */}

                        <button
                            type="button"
                            className="registration-continue"
                            onClick={
                                handleBackToVotara
                            }
                        >
                            Back to Votara
                        </button>


                        {/* =================================================
                            BACK
                        ================================================= */}

                        <Link
                            to="/"
                            className="registration-back"
                        >
                            ← Back to Votara
                        </Link>

                    </div>

                </section>

            </div>

        </div>
    );
};

export default RegistrationSubmitted;