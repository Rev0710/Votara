import { Link } from "react-router-dom";
import "./RegistrationConfirmation.css";

const RegistrationConfirmation = () => {
    const studentName =
        sessionStorage.getItem("votara_full_name") || "Not available";

    const studentId =
        sessionStorage.getItem("votara_student_id") || "Not available";

    const email =
        sessionStorage.getItem("votara_email") || "Not available";

    const yearLevel =
        sessionStorage.getItem("votara_year_level") || "Not available";

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-brand">
                    <Link to="/" className="confirmation-logo">
                        <span className="confirmation-logo-mark">
                            <span className="confirmation-logo-symbol">✦</span>
                        </span>
                        <span>Votara</span>
                    </Link>
                </div>

                <div className="confirmation-progress-wrapper">
                    <div className="confirmation-progress">
                        <div className="confirmation-progress-active" />
                    </div>
                    <span>3 of 3 steps</span>
                </div>

                <div className="confirmation-layout">
                    <div className="confirmation-content">
                        <div className="confirmation-icon" aria-hidden="true">
                            ✓
                        </div>

                        <span className="confirmation-kicker">
                            REGISTRATION COMPLETE
                        </span>

                        <h1>Registration Submitted!</h1>

                        <p className="confirmation-description">
                            Your registration has been successfully submitted
                            and is now waiting for review by the Electoral
                            Board. Please keep the information below for your
                            reference.
                        </p>

                        <div className="confirmation-next">
                            <div className="confirmation-section-heading">
                                <span className="confirmation-section-icon">
                                    ✉
                                </span>
                                <span>What Happens Next?</span>
                            </div>

                            <p>
                                Please wait while the Electoral Board reviews
                                your registration. VOTARA will send an official
                                email to the email address you provided once
                                your registration has been approved.
                            </p>

                            <div className="confirmation-review-note">
                                <strong>Expected review time:</strong> Please
                                allow up to <strong>1 hour</strong> for the
                                Electoral Board to complete the review. Keep
                                checking your inbox, including your Spam or
                                Junk folder.
                            </div>

                            <p className="confirmation-follow-up">
                                If approved, your VOTARA email will contain your
                                account instructions and temporary password for
                                your first login. You will be required to
                                change your password after signing in.
                            </p>
                        </div>

                        <div className="confirmation-information">
                            <div className="confirmation-information-title">
                                Registration Information
                            </div>

                            {[
                                ["Name", studentName],
                                ["ID", studentId],
                                ["Email", email],
                                ["Year Level", yearLevel],
                            ].map(([label, value]) => (
                                <div
                                    className="confirmation-information-row"
                                    key={label}
                                >
                                    <span>{label}</span>
                                    <strong>{value}</strong>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/student-login"
                            className="confirmation-button"
                        >
                            Go to Login
                        </Link>
                    </div>

                    <div className="confirmation-orbit" aria-hidden="true">
                        <div className="confirmation-orbit-ring ring-one" />
                        <div className="confirmation-orbit-ring ring-two" />
                        <div className="confirmation-orbit-ring ring-three" />

                        <div className="confirmation-orbit-core">
                            <span className="confirmation-core-mark">
                                ✦
                            </span>
                            <span className="confirmation-core-text">
                                Votara
                            </span>
                        </div>

                        <span className="confirmation-orbit-dot orbit-check">
                            ✓
                        </span>
                        <span className="confirmation-orbit-dot orbit-mail">
                            ✉
                        </span>
                        <span className="confirmation-orbit-dot orbit-shield">
                            ◆
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationConfirmation;
