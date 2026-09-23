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

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./src/pages/admin/AdminDashboard";
import ElectoralBoardManagement from "./src/pages/admin/ElectoralBoardManagement";
import AdminAccountManagement from "./src/pages/admin/AdminAccountManagement";
import RegistrationRequirements from "./src/pages/auth/RegistrationRequirements";
import StudentManagement from "./src/pages/admin/StudentManagement";

import CandidateManagement from "./src/pages/admin/CandidateManagement";
import Election from "./src/pages/admin/Election";

import EBCandidateManagement from "./src/pages/electoralBoard/EBCandidateManagement";
import ElectionManagement from "./src/pages/electoralBoard/ElectionManagement";
import CreateElection from "./src/pages/electoralBoard/CreateElection";

import KioskVoting from "./src/pages/electoralBoard/KioskVoting";
import AuditLogs from "./src/pages/admin/AuditLogs";
import Reports from "./src/pages/admin/Reports";
import ElectionResults from "./src/pages/admin/ElectionResults";
import SystemSettings from "./src/pages/admin/SystemSettings";

import StudentDashboard from "./src/pages/student/StudentDashboard";
import Settings from "./src/pages/student/Settings";

import ElectoralBoardLogin from "./src/pages/auth/ElectoralBoardLogin";

import * as EBDashboardModule from "./src/pages/electoralBoard/EBDashboard";

const EBDashboard =
    EBDashboardModule.default || EBDashboardModule.EBDashboard;

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


                <Route
                    path="/"
                    element={<LandingPage />}
                />


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
                    After OTP verification
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
                    CHANGE TEMPORARY PASSWORD
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
                <Route
                    path="/admin/register"
                    element={<AdminRegister />}
                />
                
                <Route
                    path="/admin-login"
                    element={<StaffLogin />}
                />

                {/* =================================================
                    STUDENT SETTINGS
                ================================================= */}

                <Route
                    path="/student-settings"
                    element={<Settings />}
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
                <Route
                    path="/kiosk-voting"
                    element={<KioskVoting />}
                />

                <Route
                    path="/staff-change-password"
                    element={<StaffChangePassword />}
                />
                <Route
                    path="/electoral-board/election-management"
                    element={<ElectionManagement />}
                />
                <Route
                    path="/electoral-board/create-election"
                    element={<CreateElection />}
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
                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/admin/students"
                    element={
                        <StudentManagement />
                    }
                />
                <Route

                    path="/admin/election"
                    element={
                        <Election />
                    }
                />

                <Route
                    path="/admin/candidates"

                    element={
                        <CandidateManagement />
                    }
                />
                <Route
                    path="/electoral-board/candidates"

                    element={
                        <EBCandidateManagement />
                    }
                />

                <Route
                    path="/admin/audit-logs"
                    element={
                        <AuditLogs />
                    }
                />
                <Route
                    path="/admin/reports"
                    element={
                        <Reports />
                    }
                />
                <Route
                    path="/admin/results"
                    element={
                        <ElectionResults />
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <SystemSettings />
                    }
                />
                <Route
                    path="/admin/admin-accounts"
                    element={<AdminAccountManagement />}
                />
                <Route
                    path="/registration-requirements"
                    element={<RegistrationRequirements />}
                />

                <Route
                    path="/vote"
                    element={<Vote />}
                />
            </Routes>
        </div>
    );
};

export default App;