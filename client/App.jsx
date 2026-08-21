import { Routes, Route } from "react-router-dom";

import LandingPage from "./src/pages/public/LandingPage";
import Register from "./src/pages/auth/Register";
import StudentLogin from "./src/pages/auth/StudentLogin";
import OTPVerification from "./src/pages/auth/OTPVerification";
import RegistrationConfirmation from "./src/pages/auth/RegistrationConfirmation";

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
    return (
        <Routes>

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
                element={
                    <RegistrationConfirmation />
                }
            />


            {/* STUDENT LOGIN */}

            <Route
                path="/student-login"
                element={<StudentLogin />}
            />


            {/* TEMPORARY LOGIN */}

            <Route
                path="/login"
                element={<LoginPage />}
            />

        </Routes>
    );
};

export default App;