import React, {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// =====================================================
// STAFF CHANGE PASSWORD
//
// Used by:
// ADMIN / EB
//
// when must_change_password = true
// =====================================================

const StaffChangePassword = () => {

    const navigate =
        useNavigate();


    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");


    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);


    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const [staffUser, setStaffUser] =
        useState(null);


    // =================================================
    // LOAD STAFF SESSION
    // =================================================

    useEffect(() => {

        const token =
            localStorage.getItem(
                "votaraStaffToken"
            );

        const storedUser =
            localStorage.getItem(
                "votaraStaffUser"
            );


        if (
            !token ||
            !storedUser
        ) {

            navigate(
                "/admin-login",
                {
                    replace: true,
                }
            );

            return;
        }


        try {

            const user =
                JSON.parse(
                    storedUser
                );


            setStaffUser(
                user
            );


            if (
                !user.mustChangePassword
            ) {

                if (
                    user.role ===
                    "admin"
                ) {

                    navigate(
                        "/admin-dashboard",
                        {
                            replace: true,
                        }
                    );

                } else {

                    navigate(
                        "/electoral-board/dashboard",
                        {
                            replace: true,
                        }
                    );

                }

            }

        } catch (error) {

            console.error(
                "Staff session error:",
                error
            );

            localStorage.removeItem(
                "votaraStaffToken"
            );

            localStorage.removeItem(
                "votaraStaffUser"
            );

            navigate(
                "/admin-login",
                {
                    replace: true,
                }
            );
        }

    }, [navigate]);


    // =================================================
    // PASSWORD REQUIREMENTS
    // =================================================

    const requirements = {

        length:
            newPassword.length >= 8,

        uppercase:
            /[A-Z]/.test(
                newPassword
            ),

        lowercase:
            /[a-z]/.test(
                newPassword
            ),

        number:
            /[0-9]/.test(
                newPassword
            ),

        special:
            /[^A-Za-z0-9]/.test(
                newPassword
            ),

    };


    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        setError("");


        if (
            !requirements.length ||
            !requirements.uppercase ||
            !requirements.lowercase ||
            !requirements.number ||
            !requirements.special
        ) {

            setError(
                "Please meet all password requirements."
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        try {

            setLoading(true);


            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                );


            const response =
                await fetch(
                    `${API_BASE_URL}/staff-auth/change-password`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,

                        },

                        body:
                            JSON.stringify({

                                newPassword,

                                confirmPassword,

                            }),

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                setError(
                    data.message ||
                    "Unable to change password."
                );

                return;
            }


            // =================================================
            // SAVE NEW SESSION
            // =================================================

            localStorage.setItem(
                "votaraStaffToken",
                data.token
            );


            localStorage.setItem(
                "votaraStaffUser",
                JSON.stringify(
                    data.user
                )
            );


            // =================================================
            // NAVIGATE BASED ON ROLE
            // =================================================

            if (
                data.user.role ===
                "admin"
            ) {

                navigate(
                    "/admin-dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


            if (
                data.user.role ===
                "electoral_board"
            ) {

                navigate(
                    "/electoral-board/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

        } catch (error) {

            console.error(
                "Change staff password error:",
                error
            );

            setError(
                "Unable to connect to the VOTARA server."
            );

        } finally {

            setLoading(false);
        }
    };


    // =================================================
    // REQUIREMENT
    // =================================================

    const Requirement = ({
        valid,
        children,
    }) => (

        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                fontSize: "13px",
                color:
                    valid
                        ? "#15803d"
                        : "#64748b",
            }}
        >

            <span
                style={{
                    fontWeight: "700",
                    color:
                        valid
                            ? "#15803d"
                            : "#94a3b8",
                }}
            >
                {valid
                    ? "✓"
                    : "○"}
            </span>

            {children}

        </div>

    );


    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background:
                    "linear-gradient(135deg, #eff6ff, #f8fafc)",
                fontFamily:
                    "Poppins, Arial, sans-serif",
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "34px",
                    boxShadow:
                        "0 20px 50px rgba(15, 23, 42, 0.12)",
                }}
            >

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "25px",
                    }}
                >

                    <div
                        style={{
                            fontSize: "38px",
                            marginBottom: "10px",
                        }}
                    >
                        🔑
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            color: "#172554",
                            fontSize: "27px",
                        }}
                    >
                        Change Your Password
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                            fontSize: "14px",
                            lineHeight: 1.5,
                        }}
                    >
                        For security, you must create your own password before accessing the VOTARA dashboard.
                    </p>

                    {staffUser && (

                        <p
                            style={{
                                fontSize: "13px",
                                color: "#334155",
                                fontWeight: "600",
                            }}
                        >
                            {staffUser.fullName}
                        </p>

                    )}

                </div>


                {error && (

                    <div
                        style={{
                            marginBottom: "18px",
                            padding: "13px 15px",
                            borderRadius: "12px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>

                )}


                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <label
                        style={labelStyle}
                    >
                        New Password
                    </label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >

                        <input
                            type={
                                showNewPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                newPassword
                            }
                            onChange={event =>
                                setNewPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Create your new password"
                            autoComplete="new-password"
                            style={{
                                ...inputStyle,
                                paddingRight: "75px",
                            }}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowNewPassword(
                                    previous =>
                                        !previous
                                )
                            }
                            style={toggleStyle}
                        >
                            {showNewPassword
                                ? "Hide"
                                : "Show"}
                        </button>

                    </div>


                    <div
                        style={{
                            marginTop: "12px",
                            padding: "14px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                        }}
                    >

                        <Requirement
                            valid={
                                requirements.length
                            }
                        >
                            At least 8 characters
                        </Requirement>

                        <Requirement
                            valid={
                                requirements.uppercase
                            }
                        >
                            One uppercase letter
                        </Requirement>

                        <Requirement
                            valid={
                                requirements.lowercase
                            }
                        >
                            One lowercase letter
                        </Requirement>

                        <Requirement
                            valid={
                                requirements.number
                            }
                        >
                            One number
                        </Requirement>

                        <Requirement
                            valid={
                                requirements.special
                            }
                        >
                            One special character
                        </Requirement>

                    </div>


                    <label
                        style={labelStyle}
                    >
                        Confirm New Password
                    </label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >

                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                confirmPassword
                            }
                            onChange={event =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Confirm your new password"
                            autoComplete="new-password"
                            style={{
                                ...inputStyle,
                                paddingRight: "75px",
                            }}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    previous =>
                                        !previous
                                )
                            }
                            style={toggleStyle}
                        >
                            {showConfirmPassword
                                ? "Hide"
                                : "Show"}
                        </button>

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...primaryButtonStyle,
                            width: "100%",
                            marginTop: "22px",
                            opacity:
                                loading
                                    ? 0.7
                                    : 1,
                        }}
                    >
                        {loading
                            ? "Updating Password..."
                            : "Change Password"}
                    </button>

                </form>

            </div>

        </div>
    );
};


// =====================================================
// STYLES
// =====================================================

const labelStyle = {

    display: "block",

    marginTop: "18px",

    marginBottom: "7px",

    fontSize: "14px",

    fontWeight: "700",

    color: "#334155",

};


const inputStyle = {

    width: "100%",

    boxSizing: "border-box",

    padding: "13px 14px",

    border:
        "1px solid #cbd5e1",

    borderRadius: "11px",

    outline: "none",

    fontSize: "14px",

    color: "#0f172a",

};


const toggleStyle = {

    position: "absolute",

    right: "8px",

    top: "7px",

    border: "none",

    borderRadius: "8px",

    padding: "7px 10px",

    background: "#f1f5f9",

    color: "#334155",

    fontWeight: "600",

    cursor: "pointer",

};


const primaryButtonStyle = {

    border: "none",

    borderRadius: "11px",

    padding: "14px 18px",

    background: "#2563eb",

    color: "#ffffff",

    fontWeight: "700",

    fontSize: "14px",

    cursor: "pointer",

};


export default StaffChangePassword;