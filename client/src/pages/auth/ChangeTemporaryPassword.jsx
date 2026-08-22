import React, {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    changeTemporaryPassword
} from "../../services/authService";


const ChangeTemporaryPassword = () => {

    const navigate =
        useNavigate();


    const token =
        localStorage.getItem(
            "votaraToken"
        );


    const [
        newPassword,
        setNewPassword
    ] = useState("");


    const [
        confirmPassword,
        setConfirmPassword
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const [
        loading,
        setLoading
    ] = useState(false);


    // =====================================================
    // PASSWORD REQUIREMENTS
    // =====================================================

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

        match:
            newPassword.length > 0 &&
            newPassword ===
                confirmPassword,
    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        if (!token) {

            setError(
                "Your login session has expired. Please login again."
            );

            return;
        }


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
            !requirements.match
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


            // Password successfully changed.
            // Go to photo verification.

            navigate(
                "/upload-profile-picture",
                {
                    replace: true
                }
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


    // =====================================================
    // REQUIREMENT ROW
    // =====================================================

    const Requirement = ({
        valid,
        children
    }) => (

        <div
            style={{
                display:
                    "flex",

                alignItems:
                    "center",

                gap:
                    "8px",

                marginBottom:
                    "7px",

                color:
                    valid
                        ? "#159447"
                        : "#777",

                fontSize:
                    "14px",
            }}
        >

            <span
                style={{
                    fontWeight:
                        "bold",
                }}
            >
                {valid
                    ? "✓"
                    : "○"}
            </span>

            <span>
                {children}
            </span>

        </div>
    );


    return (

        <div
            style={{
                minHeight:
                    "100vh",

                display:
                    "flex",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                background:
                    "#eef3ff",

                fontFamily:
                    "Poppins, sans-serif",

                padding:
                    "20px",
            }}
        >

            <div
                style={{
                    width:
                        "450px",

                    maxWidth:
                        "100%",

                    background:
                        "#ffffff",

                    padding:
                        "40px",

                    borderRadius:
                        "15px",

                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >

                <h1
                    style={{
                        textAlign:
                            "center",

                        marginBottom:
                            "10px",
                    }}
                >
                    Create Your Password
                </h1>


                <p
                    style={{
                        textAlign:
                            "center",

                        color:
                            "#666",

                        lineHeight:
                            "1.6",

                        marginBottom:
                            "25px",
                    }}
                >
                    Your Electoral Board
                    password is temporary.
                    Create a secure password
                    before continuing.
                </p>


                {/* ERROR */}

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
                                "20px",
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

                    {/* NEW PASSWORD */}

                    <label>
                        New Password
                    </label>

                    <input
                        type="password"
                        value={
                            newPassword
                        }
                        onChange={(e) =>
                            setNewPassword(
                                e.target.value
                            )
                        }
                        placeholder="Create a new password"
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

                            fontSize:
                                "15px",
                        }}
                    />


                    {/* REQUIREMENTS */}

                    <div
                        style={{
                            background:
                                "#f7f9fc",

                            borderRadius:
                                "10px",

                            padding:
                                "15px",

                            marginBottom:
                                "20px",
                        }}
                    >

                        <strong
                            style={{
                                display:
                                    "block",

                                marginBottom:
                                    "12px",
                            }}
                        >
                            Password requirements
                        </strong>


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
                            At least one uppercase
                            letter (A-Z)
                        </Requirement>


                        <Requirement
                            valid={
                                requirements.lowercase
                            }
                        >
                            At least one lowercase
                            letter (a-z)
                        </Requirement>


                        <Requirement
                            valid={
                                requirements.number
                            }
                        >
                            At least one number
                            (0-9)
                        </Requirement>


                        <Requirement
                            valid={
                                requirements.special
                            }
                        >
                            At least one special
                            character (!@#$%)
                        </Requirement>

                    </div>


                    {/* CONFIRM */}

                    <label>
                        Confirm Password
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
                        placeholder="Confirm your new password"
                        required
                        style={{
                            width:
                                "100%",

                            padding:
                                "13px",

                            marginTop:
                                "8px",

                            marginBottom:
                                "10px",

                            borderRadius:
                                "8px",

                            border:
                                "1px solid #ccc",

                            fontSize:
                                "15px",
                        }}
                    />


                    {confirmPassword && (

                        <div
                            style={{
                                fontSize:
                                    "13px",

                                color:
                                    requirements.match
                                        ? "#159447"
                                        : "#d93025",

                                marginBottom:
                                    "20px",
                            }}
                        >
                            {requirements.match
                                ? "✓ Passwords match"
                                : "✗ Passwords do not match"}
                        </div>

                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={
                            loading
                        }
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
                                    ? "#8aa8ff"
                                    : "#1455ff",

                            color:
                                "#ffffff",

                            fontWeight:
                                "600",

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer",

                            fontSize:
                                "15px",
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