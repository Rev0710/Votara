import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StudentLogin.css";

const StudentLogin = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        if (!studentId || !password) {
            alert("Please enter your Student ID and Password.");
            return;
        }

        console.log("Student ID:", studentId);
        console.log("Password:", password);

        // Add your authentication here later
    };

    return (
        <div className="student-login-page">

    <div className="student-login-card">

        <section className="student-login-left">

            <Link to="/" className="student-login-logo">

                <span className="student-login-logo-mark">
                    <span className="triangle triangle-top"></span>
                    <span className="circle"></span>
                    <span className="triangle triangle-bottom"></span>
                </span>

                <span>Votara</span>

            </Link>

            <div className="student-login-visual">

                <div className="visual-circle visual-circle-one"></div>
                <div className="visual-circle visual-circle-two"></div>

                <div className="visual-content">
                    <span className="visual-line"></span>
                    <span className="visual-line"></span>
                    <span className="visual-line"></span>
                </div>

            </div>

        </section>


        <section className="student-login-right">

            <div className="student-login-form-container">

                <h1>Welcome !</h1>

                <p className="login-description">
                    Login as a voter on Western Institute
                    <br />
                    of Technology voting platform to vote in
                    <br />
                    your preferred candidate
                </p>

                <form onSubmit={handleLogin}>

                    <div className="login-input-group">
                        <input
                            type="text"
                            placeholder="Student ID No."
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                        />
                    </div>

                    <div className="login-input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="student-login-button"
                    >
                        Login
                    </button>

                </form>

                <div className="login-back">
                    <Link to="/">
                        ← Back to Home
                    </Link>
                </div>

            </div>

        </section>

    </div>

</div>
    );
};

export default StudentLogin;