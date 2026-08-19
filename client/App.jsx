import { Routes, Route } from "react-router-dom";

import LandingPage from "./src/pages/public/LandingPage";
import Register from "./src/pages/auth/Register";

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

            {/* LOGIN - TEMPORARY */}
            <Route
                path="/login"
                element={<LoginPage />}
            />

        </Routes>
    );
};

export default App;