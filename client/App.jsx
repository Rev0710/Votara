import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/public/LandingPage";

function App() {
  return (
    <Routes>
      {/* Public Website */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication routes will be added next */}
      {/* 
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/registration-submitted" element={<RegistrationSubmitted />} />
      <Route path="/login" element={<Login />} />
      */}

      {/* Student routes will be added later */}
      {/* <Route path="/student/dashboard" element={<StudentDashboard />} /> */}

      {/* Electoral Board routes will be added later */}
      {/* <Route path="/electoral-board/login" element={<EBLogin />} /> */}

      {/* Admin routes will be added later */}
      {/* <Route path="/admin/login" element={<AdminLogin />} /> */}
    </Routes>
  );
}

export default App;