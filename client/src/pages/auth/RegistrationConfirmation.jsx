import { Link } from "react-router-dom";
import "./RegistrationConfirmation.css";

const RegistrationConfirmation = () => {
  const studentData = JSON.parse(
    sessionStorage.getItem("registeredStudent") || "null"
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
        <div className="confirmation-progress-wrapper">
          <div className="confirmation-progress">
            <div className="confirmation-progress-active"></div>
          </div>
          <span>3 of 3 steps</span>
        </div>

        {/* SUCCESS ICON */}
        <div className="confirmation-icon">✓</div>

        {/* MAIN CONTENT */}
        <div className="confirmation-content">
          <h1>Registration Submitted!</h1>
          <p>
            Your registration is now pending
            <br />
            for approval by the Electoral Board.
          </p>
        </div>

        {/* WHAT'S NEXT */}
        <div className="confirmation-next">
          <h3>What's Next?</h3>
          <p>1. Wait for approval</p>
          <p>2. Check your Temporary password</p>
          <p>3. Login and change your password</p>
        </div>

        {/* ACTION BUTTON */}
        <Link to="/student-login" className="confirmation-button">
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default RegistrationConfirmation;