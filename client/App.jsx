import { Routes, Route, useLocation } from "react-router-dom";

import LandingPage from "./src/pages/public/LandingPage";
import Register from "./src/pages/auth/Register";
import StudentLogin from "./src/pages/auth/StudentLogin";
import OTPVerification from "./src/pages/auth/OTPVerification";
import RegistrationConfirmation from "./src/pages/auth/RegistrationConfirmation";
import AccountSelection from "./src/pages/auth/AccountSelection";

import ChangeTemporaryPassword from "./src/pages/auth/ChangeTemporaryPassword";
import UploadProfilePicture from "./src/pages/auth/UploadProfilePicture";

import StudentDashboard from "./src/pages/student/StudentDashboard";
import "./App.css";


const LoginPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <h1>Login Page</h1>
    </div>
  );
};


const App = () => {
  const location = useLocation();

  return (
    <div
      className="page-transition"
      key={location.pathname}
    >
      <Routes location={location}>
        {/* PUBLIC LANDING PAGE */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* STUDENT REGISTRATION */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* OTP VERIFICATION */}
        <Route
          path="/verify-otp"
          element={<OTPVerification />}
        />

        {/* REGISTRATION CONFIRMATION */}
        <Route
          path="/registration-confirmation"
          element={<RegistrationConfirmation />}
        />

        {/* STUDENT LOGIN */}
        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        {/* CHANGE TEMPORARY PASSWORD */}
        <Route
          path="/change-password"
          element={<ChangeTemporaryPassword />}
        />

        {/* PROFILE PICTURE */}
        <Route
          path="/upload-profile-picture"
          element={<UploadProfilePicture />}
        />

        {/* STUDENT DASHBOARD */}
        <Route
          path="/student-dashboard"
          element={<StudentDashboard />}
        />

        {/* TEMPORARY LOGIN */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* ACCOUNT SELECTION */}
        <Route
          path="/account-selection"
          element={<AccountSelection />}
        />
      </Routes>
    </div>
  );
};

export default App;