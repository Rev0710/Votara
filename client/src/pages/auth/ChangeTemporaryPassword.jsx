import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    changeTemporaryPassword
} from "../../services/authService";

const ChangeTemporaryPassword = () => {

    const navigate = useNavigate();

    const token =
        localStorage.getItem(
            "votaraToken"
        );

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        if (!token) {

            setError(
                "Your login session has expired. Please login again."
            );

            return;
        }


        if (newPassword.length < 8) {

            setError(
                "Password must be at least 8 characters."
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


            await changeTemporaryPassword(
                token,
                newPassword,
                confirmPassword
            );


            console.log(
                "✅ Password changed successfully."
            );


            navigate(
                "/upload-profile-picture"
            );


        } catch (error) {

            console.error(
                "❌ Password change error:",
                error
            );

            setError(
                error.message ||
                "Unable to change password."
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
                fontFamily:
                    "Poppins, sans-serif",
            }}
        >

            <div
                style={{
                    width: "420px",
                    background: "#ffffff",
                    padding: "40px",
                    borderRadius: "15px",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >

                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: "10px",
                    }}
                >
                    Change Password
                </h1>


                <p
                    style={{
                        textAlign: "center",
                        color: "#666",
                        marginBottom: "30px",
                    }}
                >
                    For security, please create
                    a new password before continuing.
                </p>


                {error && (

                    <div
                        style={{
                            background:
                                "#fff1f0",
                            color:
                                "#d93025",
                            padding:
                                "12px",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "15px",
                            fontSize:
                                "14px",
                        }}
                    >
                        {error}
                    </div>

                )}


                <form
                    onSubmit={handleSubmit}
                >

                    <label>
                        New Password
                    </label>


                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) =>
                            setNewPassword(
                                e.target.value
                            )
                        }
                        placeholder="Enter new password"
                        required
                        style={{
                            width:
                                "100%",
                            padding:
                                "13px",
                            marginTop:
                                "8px",
                            marginBottom:
                                "20px",
                            borderRadius:
                                "8px",
                            border:
                                "1px solid #ccc",
                        }}
                    />


                    <label>
                        Confirm New Password
                    </label>


                    <input
                        type="password"
                        value={
                            confirmPassword
                        }
                        onChange={(e) =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                        placeholder="Confirm new password"
                        required
                        style={{
                            width:
                                "100%",
                            padding:
                                "13px",
                            marginTop:
                                "8px",
                            marginBottom:
                                "20px",
                            borderRadius:
                                "8px",
                            border:
                                "1px solid #ccc",
                        }}
                    />


                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width:
                                "100%",
                            padding:
                                "14px",
                            border:
                                "none",
                            borderRadius:
                                "8px",
                            background:
                                loading
                                    ? "#8ba8ff"
                                    : "#1455ff",
                            color:
                                "white",
                            fontWeight:
                                "600",
                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {loading
                            ? "Saving..."
                            : "Continue"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default ChangeTemporaryPassword;