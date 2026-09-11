import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const VALID_YEAR_LEVELS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
];

const LateEnrolleeForm = () => {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const studentId =
        sessionStorage.getItem("votara_student_id") || "";

    const email =
        sessionStorage.getItem("votara_email") || "";

    const handleFullNameChange = (e) => {
        const value = e.target.value.replace(
            /[^A-Za-zÀ-ÖØ-öø-ÿ'._ -]/g,
            ""
        );

        setFullName(value);
    };

    const validateFullName = (name) => {
        const parts = name.trim().split("_");

        if (parts.length !== 3) {
            return "Please follow this format: LastName_FirstName_MiddleInitial";
        }

        const lastName = parts[0].trim();
        const firstName = parts[1].trim();
        const middleInitial = parts[2].trim();

        if (!lastName) {
            return "Please enter your last name.";
        }

        if (!firstName) {
            return "Please enter your first name.";
        }

        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(middleInitial)) {
            return "Middle initial must contain only one letter, such as R or R.";
        }

        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            if (!studentId || !email) {
                throw new Error(
                    "Registration information is missing. Please start again."
                );
            }

            const cleanFullName = fullName.trim();
            const cleanYearLevel = yearLevel.trim();

            const nameError =
                validateFullName(cleanFullName);

            if (nameError) {
                throw new Error(nameError);
            }

            if (!VALID_YEAR_LEVELS.includes(cleanYearLevel)) {
                throw new Error(
                    "Please select a valid year level."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/registration/send-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        studentId,
                        fullName: cleanFullName,
                        yearLevel: cleanYearLevel,
                        email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to send OTP."
                );
            }

            sessionStorage.setItem(
                "votara_full_name",
                cleanFullName
            );

            sessionStorage.setItem(
                "votara_year_level",
                cleanYearLevel
            );

            sessionStorage.setItem(
                "votara_registration_type",
                "late_enrollee"
            );

            navigate("/verify-otp");
        } catch (error) {
            console.error(
                "❌ Late enrollee registration error:",
                error
            );

            setError(
                error.message ||
                "Unable to submit the late-enrollee registration."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef3ff",
                padding: "24px",
                fontFamily: "Poppins, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "#fff",
                    borderRadius: "18px",
                    padding: "36px",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
                }}
            >
                <Link
                    to="/register"
                    style={{
                        textDecoration: "none",
                        color: "#1455ff",
                        fontWeight: 600,
                    }}
                >
                    ← Back
                </Link>

                <h1 style={{ marginBottom: "10px" }}>
                    Late Enrollee Registration
                </h1>

                <p style={{ color: "#667085", lineHeight: 1.6 }}>
                    We could not find your Student ID in the current
                    enrollment database. Complete the information below.
                    Your registration will be subject to Electoral Board
                    verification before you can vote.
                </p>

                <div
                    style={{
                        background: "#f5f7fb",
                        borderRadius: "10px",
                        padding: "14px",
                        marginBottom: "20px",
                        fontSize: "14px",
                    }}
                >
                    <strong>Student ID:</strong> {studentId}
                    <br />
                    <strong>Email:</strong> {email}
                </div>

                {error && (
                    <div
                        style={{
                            background: "#fff1f0",
                            color: "#c62828",
                            border: "1px solid #ffcdd2",
                            borderRadius: "10px",
                            padding: "12px",
                            marginBottom: "18px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "18px" }}>
                        <label
                            htmlFor="fullName"
                            style={{
                                display: "block",
                                fontWeight: 600,
                                marginBottom: "8px",
                            }}
                        >
                            Full Name
                        </label>

                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            placeholder="LastName_FirstName_MiddleInitial"
                            onChange={handleFullNameChange}
                            required
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "13px 15px",
                                border: "1px solid #cfd4dc",
                                borderRadius: "10px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "22px" }}>
                        <label
                            htmlFor="yearLevel"
                            style={{
                                display: "block",
                                fontWeight: 600,
                                marginBottom: "8px",
                            }}
                        >
                            Year Level
                        </label>

                        <select
                            id="yearLevel"
                            value={yearLevel}
                            onChange={(e) =>
                                setYearLevel(e.target.value)
                            }
                            required
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "13px 15px",
                                border: "1px solid #cfd4dc",
                                borderRadius: "10px",
                                background: "#fff",
                            }}
                        >
                            <option value="">
                                Select your year level
                            </option>

                            {VALID_YEAR_LEVELS.map((level) => (
                                <option
                                    key={level}
                                    value={level}
                                >
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            border: 0,
                            padding: "14px",
                            borderRadius: "10px",
                            background: "#1455ff",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {loading
                            ? "Submitting..."
                            : "Continue to Email Verification"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LateEnrolleeForm;
