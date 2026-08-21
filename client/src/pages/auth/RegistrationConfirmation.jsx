import { Link } from "react-router-dom";
import "./RegistrationConfirmation.css";

const RegistrationConfirmation = () => {

    const studentData =
        JSON.parse(
            sessionStorage.getItem(
                "registeredStudent"
            ) || "null"
        );

    return (
        <div className="confirmation-page">

            <div className="confirmation-card">

                {/* LOGO */}
                <div className="confirmation-logo">
                    <span className="confirmation-logo-mark">
                        <span className="triangle triangle-top"></span>
                        <span className="circle"></span>
                        <span className="triangle triangle-bottom"></span>
                    </span>

                    <span>Votara</span>
                </div>


                {/* PROGRESS */}
                <div className="confirmation-progress">

                    <div className="confirmation-progress-line">
                        <div></div>
                    </div>

                    <span>
                        3 of 3 steps
                    </span>

                </div>


                {/* SUCCESS ICON */}
                <div className="success-icon">
                    ✓
                </div>


                <h1>
                    Registration Submitted!
                </h1>


                <p className="confirmation-message">
                    Your registration is now pending
                    <br />
                    for approval by the Electoral Board.
                </p>


                {/* WHAT'S NEXT */}
                <div className="next-box">

                    <strong>
                        What's Next?
                    </strong>

                    <p>
                        Wait for approval
                        <br />
                        Check your Temporary password
                        <br />
                        Login and change your password
                    </p>

                </div>


                {/* LOGIN */}
                <Link
                    to="/student-login"
                    className="login-button"
                >
                    Go to Login
                </Link>

            </div>

        </div>
    );
};

export default RegistrationConfirmation;