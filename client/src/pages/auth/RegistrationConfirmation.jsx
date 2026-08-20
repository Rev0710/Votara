import { Link } from "react-router-dom";
import "./RegistrationConfirmation.css";

const RegistrationConfirmation = () => {
    return (
        <div className="confirmation-page">

            <div className="confirmation-card">

                {/* LOGO */}
                <Link
                    to="/"
                    className="confirmation-logo"
                >

                    <span className="confirmation-logo-mark">
                        <span className="triangle triangle-top"></span>
                        <span className="circle"></span>
                        <span className="triangle triangle-bottom"></span>
                    </span>

                    <span>Votara</span>

                </Link>


                {/* PROGRESS */}
                <div className="confirmation-progress-wrapper">

                    <div className="confirmation-progress">

                        <div className="confirmation-progress-active"></div>

                    </div>

                    <span>
                        3 of 3 steps
                    </span>

                </div>


                {/* SUCCESS ICON */}
                <div className="confirmation-icon">
                    ✓
                </div>


                {/* CONTENT */}
                <div className="confirmation-content">

                    <h1>
                        Registration Submitted!
                    </h1>

                    <p>
                        Your registration is now pending
                        <br />
                        for approval by the Electoral Board.
                    </p>

                </div>


                {/* WHAT'S NEXT */}
                <div className="confirmation-next">

                    <h3>
                        What's Next?
                    </h3>

                    <p>
                        Wait for approval
                    </p>

                    <p>
                        Check your temporary password
                    </p>

                    <p>
                        Login and change your password
                    </p>

                </div>


                {/* LOGIN */}
                <Link
                    to="/student-login"
                    className="confirmation-button"
                >
                    Go to Login
                </Link>

            </div>

        </div>
    );
};

export default RegistrationConfirmation;