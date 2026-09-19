import { Routes, Route, useLocation } from "react-router-dom";

// =====================================================
// PUBLIC / AUTH PAGES
// =====================================================

import Vote from "./src/pages/student/Vote";
import LandingPage from "./src/pages/public/LandingPage";
import Register from "./src/pages/auth/Register";
import LateEnrolleeForm from "./src/pages/public/LateEnrolleeForm";
import OTPVerification from "./src/pages/auth/OTPVerification";
import StudentRegistration from "./src/pages/auth/StudentRegistration";
import RegistrationConfirmation from "./src/pages/auth/RegistrationConfirmation";
import RegistrationSubmitted from "./src/pages/public/RegistrationSubmitted";
import StudentLogin from "./src/pages/auth/StudentLogin";
import AccountSelection from "./src/pages/auth/AccountSelection";
import ChangeTemporaryPassword from "./src/pages/auth/ChangeTemporaryPassword";
import UploadProfilePicture from "./src/pages/auth/UploadProfilePicture";
import AdminRegister from "./src/pages/auth/AdminRegister";
import StaffLogin from "./src/pages/auth/StaffLogin";
import StaffChangePassword from "./src/pages/auth/StaffChangePassword";
import PageLoader from "./src/components/transitionloader/PageLoader.jsx";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./src/pages/admin/AdminDashboard";
import ElectoralBoardManagement from "./src/pages/admin/ElectoralBoardManagement";
import AdminAccountManagement from "./src/pages/admin/AdminAccountManagement";
import RegistrationRequirements from "./src/pages/auth/RegistrationRequirements";
import StudentManagement from "./src/pages/admin/StudentManagement";
import CandidateManagement from "./src/pages/admin/CandidateManagement";

// IMPORTANT:
// Current ElectionManagement component is located
// inside the admin folder and uses Admin authentication.
import ElectionManagement from "./src/pages/electoralBoard/ElectionManagement";

import AuditLogs from "./src/pages/admin/AuditLogs";
import Reports from "./src/pages/admin/Reports";
import ElectionResults from "./src/pages/admin/ElectionResults";
import SystemSettings from "./src/pages/admin/SystemSettings";

// =====================================================
// STUDENT
// =====================================================

import StudentDashboard from "./src/pages/student/StudentDashboard";
import Settings from "./src/pages/student/Settings";

// =====================================================
// ELECTORAL BOARD
// =====================================================

import ElectoralBoardLogin from "./src/pages/auth/ElectoralBoardLogin";

import * as EBDashboardModule from "./src/pages/electoralBoard/EBDashboard";

const EBDashboard =
    EBDashboardModule.default ||
    EBDashboardModule.EBDashboard;

// =====================================================
// GLOBAL APP CSS
// =====================================================

import "./App.css";

// =====================================================
// TEMPORARY LOGIN PAGE
// =====================================================

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

// =====================================================
// APP
// =====================================================

const App = () => {
    const location = useLocation();

    return (
        <div
            className="page-transition"
            key={location.pathname}
        >
            <Routes location={location}>

                {/* =================================================
                    PUBLIC LANDING PAGE
                ================================================= */}

                <Route
                    path="/"
                    element={<LandingPage />}
                />

                {/* =================================================
                    STUDENT REGISTRATION
                ================================================= */}

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/late-enrollee"
                    element={<LateEnrolleeForm />}
                />

                {/* =================================================
                    OTP VERIFICATION
                ================================================= */}

                <Route
                    path="/verify-otp"
                    element={<OTPVerification />}
                />

                {/* =================================================
                    STUDENT REGISTRATION DETAILS
                ================================================= */}

                <Route
                    path="/student-registration"
                    element={<StudentRegistration />}
                />

                {/* =================================================
                    REGISTRATION CONFIRMATION
                ================================================= */}

                <Route
                    path="/registration-confirmation"
                    element={<RegistrationConfirmation />}
                />

                {/* =================================================
                    REGISTRATION SUBMITTED
                ================================================= */}

                <Route
                    path="/registration-submitted"
                    element={<RegistrationSubmitted />}
                />

                {/* =================================================
                    STUDENT LOGIN
                ================================================= */}

                <Route
                    path="/student-login"
                    element={<StudentLogin />}
                />

                {/* =================================================
                    STUDENT PASSWORD CHANGE
                ================================================= */}

                <Route
                    path="/change-password"
                    element={<ChangeTemporaryPassword />}
                />

                {/* =================================================
                    PROFILE PICTURE
                ================================================= */}

                <Route
                    path="/upload-profile-picture"
                    element={<UploadProfilePicture />}
                />

                {/* =================================================
                    STUDENT DASHBOARD
                ================================================= */}

                <Route
                    path="/student-dashboard"
                    element={<StudentDashboard />}
                />

                {/* =================================================
                    EXISTING LOGIN ROUTE
                ================================================= */}

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                {/* =================================================
                    ACCOUNT SELECTION
                ================================================= */}

                <Route
                    path="/account-selection"
                    element={<AccountSelection />}
                />

                {/* =================================================
                    STUDENT SETTINGS
                ================================================= */}

                <Route
                    path="/student-settings"
                    element={<Settings />}
                />

                {/* =================================================
                    STUDENT VOTING
                ================================================= */}

                <Route
                    path="/vote"
                    element={<Vote />}
                />

                {/* =================================================
                    ELECTORAL BOARD LOGIN
                ================================================= */}

                <Route
                    path="/electoral-board/login"
                    element={<ElectoralBoardLogin />}
                />

                {/* =================================================
                    ELECTORAL BOARD DASHBOARD
                ================================================= */}

                <Route
                    path="/electoral-board/dashboard"
                    element={<EBDashboard />}
                />

                {/* =================================================
                    ADMIN REGISTRATION
                ================================================= */}

                <Route
                    path="/admin/register"
                    element={<AdminRegister />}
                />

                {/* =================================================
                    ADMIN / STAFF LOGIN
                ================================================= */}

                <Route
                    path="/admin-login"
                    element={<StaffLogin />}
                />

                {/* =================================================
                    STAFF PASSWORD CHANGE
                ================================================= */}

                <Route
                    path="/staff-change-password"
                    element={<StaffChangePassword />}
                />

                {/* =================================================
                    ADMIN DASHBOARD
                ================================================= */}

                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/page-loader"
                    element={<PageLoader />}
                />

                {/* =================================================
                    ADMIN — ELECTORAL BOARD MANAGEMENT
                ================================================= */}

                <Route
                    path="/admin/electoral-board"
                    element={
                        <ElectoralBoardManagement />
                    }
                />

                {/* =================================================
                    ADMIN — STUDENT MANAGEMENT
                ================================================= */}

                <Route
                    path="/admin/students"
                    element={
                        <StudentManagement />
                    }
                />

                {/* =================================================
                    ADMIN — CANDIDATE MANAGEMENT
                ================================================= */}

                <Route
                    path="/admin/candidates"
                    element={
                        <CandidateManagement />
                    }
                />

                {/* =================================================
                    ADMIN — ELECTION MANAGEMENT
                    FIXED ROUTE
                ================================================= */}

                <Route
                    path="/admin/election"
                    element={
                        <ElectionManagement />
                    }
                />

                {/* =================================================
                    LEGACY / COMPATIBILITY ELECTION ROUTE
                =================================================

                    Kept so existing EB navigation does not
                    immediately break while we finish connecting
                    the three VOTARA roles.
                */}

                <Route
                    path="/electoral-board/election"
                    element={
                        <ElectionManagement />
                    }
                />

                {/* =================================================
                    ADMIN — AUDIT LOGS
                ================================================= */}

                <Route
                    path="/admin/audit-logs"
                    element={
                        <AuditLogs />
                    }
                />

                {/* =================================================
                    ADMIN — REPORTS
                ================================================= */}

                <Route
                    path="/admin/reports"
                    element={
                        <Reports />
                    }
                />

                {/* =================================================
                    ADMIN — ELECTION RESULTS
                ================================================= */}

                <Route
                    path="/admin/results"
                    element={
                        <ElectionResults />
                    }
                />

                {/* =================================================
                    ADMIN — SYSTEM SETTINGS
                ================================================= */}

                <Route
                    path="/admin/settings"
                    element={
                        <SystemSettings />
                    }
                />

                {/* =================================================
                    ADMIN — ADMIN ACCOUNTS
                ================================================= */}

                <Route
                    path="/admin/admin-accounts"
                    element={
                        <AdminAccountManagement />
                    }
                />

                {/* =================================================
                    REGISTRATION REQUIREMENTS
                ================================================= */}

                <Route
                    path="/registration-requirements"
                    element={
                        <RegistrationRequirements />
                    }
                />

            </Routes>
        </div>
    );
};

export default App;