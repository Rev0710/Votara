import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import MaintenanceGate from './src/MaintenanceGate';
import EBWorkspace from './src/pages/electoralBoard/EBWorkspace';
import AdminWorkspace from './src/pages/admin/AdminWorkspace';
const AdminLateEnrollees = lazy(() => import('./src/pages/admin/AdminLateEnrollees'));
import VotaraIntro from "./src/components/VotaraIntro";

// =====================================================
// PUBLIC / AUTH PAGES
// =====================================================
const Vote = lazy(() => import("./src/pages/student/Vote"));
import LandingPage from "./src/pages/public/LandingPage";
import Contact from "./src/pages/public/Contact";
const Register = lazy(() => import("./src/pages/auth/Register"));
const LateEnrolleeForm = lazy(() => import("./src/pages/public/LateEnrolleeForm"));
const OTPVerification = lazy(() => import("./src/pages/auth/OTPVerification"));
const StudentRegistration = lazy(() => import("./src/pages/auth/StudentRegistration"));
const RegistrationConfirmation = lazy(() => import("./src/pages/auth/RegistrationConfirmation"));
const RegistrationSubmitted = lazy(() => import("./src/pages/public/RegistrationSubmitted"));
const StudentLogin = lazy(() => import("./src/pages/auth/StudentLogin"));
const ForgotPassword = lazy(() => import("./src/pages/auth/ForgotPassword"));
const AccountSelection = lazy(() => import("./src/pages/auth/AccountSelection"));
const ChangeTemporaryPassword = lazy(() => import("./src/pages/auth/ChangeTemporaryPassword"));
const UploadProfilePicture = lazy(() => import("./src/pages/auth/UploadProfilePicture"));
const AdminRegister = lazy(() => import("./src/pages/auth/AdminRegister"));
const StaffLogin = lazy(() => import("./src/pages/auth/StaffLogin"));
const StaffChangePassword = lazy(() => import("./src/pages/auth/StaffChangePassword"));

// =====================================================
// ADMIN
// =====================================================

const AdminDashboard = lazy(() => import("./src/pages/admin/AdminDashboard"));
const RegistrationRequirements = lazy(() => import("./src/pages/auth/RegistrationRequirements"));
const AdminDataManagement = lazy(() => import("./src/pages/admin/AdminDataManagement"));
const AdminUserAccessManagement = lazy(() => import("./src/pages/admin/AdminUserAccessManagement"));


const ManagePartyList = lazy(() => import("./src/pages/electoralBoard/ManagePartyList"));
const ElectionManagement = lazy(() => import("./src/pages/electoralBoard/ElectionManagement"));
const CreateElection = lazy(() => import("./src/pages/electoralBoard/CreateElection"));

const KioskVoting = lazy(() => import("./src/pages/electoralBoard/KioskVoting"));
const ElectoralBoardAuditLogs = lazy(() => import("./src/pages/electoralBoard/AuditLogs"));
const AdminAuditLogs = lazy(() => import("./src/pages/admin/AdminAuditLogs"));
const Reports = lazy(() => import("./src/pages/admin/Reports"));
const SystemSettings = lazy(() => import("./src/pages/admin/SystemSettings"));

const StudentDashboard = lazy(() => import("./src/pages/student/StudentDashboard"));
const Settings = lazy(() => import("./src/pages/student/Settings"));

const ElectoralBoardLogin = lazy(() => import("./src/pages/auth/ElectoralBoardLogin"));

const EBDashboard = lazy(() => import("./src/pages/electoralBoard/EBDashboard"));

import "./App.css";
import "./src/pages/admin/AdminWorkspace.css";
import "./src/pages/electoralBoard/EBWorkspace.css";


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
    // Play the intro only on the initial visit to the public root URL.
    // Route changes later in this SPA do not restart the intro.
   const [showInitialIntro, setShowInitialIntro] = useState(
    () => location.pathname === "/"
);

if (showInitialIntro) {
    return (
        <VotaraIntro
            onComplete={() => setShowInitialIntro(false)}
        />
    );
}

    return (
        <div
            className="page-transition"
            key={location.pathname}
        >
            <Suspense fallback={<div className="route-loading" role="status">Loading VOTARA…</div>}>
            <MaintenanceGate><AdminWorkspace><EBWorkspace><Routes location={location}>
<Route path="/admin/late-enrollees" element={<AdminLateEnrollees/>}/>


                <Route
                    path="/"
                    element={<LandingPage />}
                />
                <Route path="/contact" element={<Contact />} />


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
                    element={<StudentLogin />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
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
                    path="/electoral-board/audit-logs"
                    element={<ElectoralBoardAuditLogs />}
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
                        <Navigate to="/admin/users" replace />
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/admin/students"
                    element={
                        <Navigate to="/admin/users" replace />
                    }
                />
                <Route
                    path="/admin/data-management"
                    element={<AdminDataManagement />}
                />

                <Route
                    path="/admin/users"
                    element={<AdminUserAccessManagement />}
                />
                <Route

                    path="/admin/election"
                    element={
                        <Navigate to="/admin/reports" replace />
                    }
                />

                <Route
                    path="/admin/candidates"

                    element={
                        <Navigate to="/admin/data-management" replace />
                    }
                />
                <Route
                    path="/electoral-board/candidates"
                    element={<Navigate to="/electoral-board/election-management" replace />}
                />

                <Route
                    path="/electoral-board/manage-party-list"
                    element={<ManagePartyList />}
                />

                <Route
                    path="/admin/audit-logs"
                    element={
                        <AdminAuditLogs />
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
                        <Navigate to="/admin/reports" replace />
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
                    element={<Navigate to="/admin/users" replace />}
                />
                <Route
                    path="/registration-requirements"
                    element={<RegistrationRequirements />}
                />

                <Route
                    path="/vote"
                    element={<Vote />}
                />
            </Routes></EBWorkspace></AdminWorkspace></MaintenanceGate>
            </Suspense>
        </div>
    );
};

export default App;
