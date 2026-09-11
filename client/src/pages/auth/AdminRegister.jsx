import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// =====================================================
// ADMIN REGISTRATION
// =====================================================

const AdminRegister = () => {

    const navigate = useNavigate();

    // -------------------------------------------------
    // FORM
    // -------------------------------------------------

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        adminRegistrationCode: "",
    });


    // -------------------------------------------------
    // PHOTO
    // -------------------------------------------------

    const [photoData, setPhotoData] = useState("");

    const [photoPreview, setPhotoPreview] =
        useState("");

    const [cameraOpen, setCameraOpen] =
        useState(false);


    const videoRef =
        useRef(null);

    const canvasRef =
        useRef(null);

    const streamRef =
        useRef(null);


    // -------------------------------------------------
    // UI STATES
    // -------------------------------------------------

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // -------------------------------------------------
    // PASSWORD VISIBILITY
    // -------------------------------------------------

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);


    // -------------------------------------------------
    // PASSWORD REQUIREMENTS
    // -------------------------------------------------

    const passwordRequirements = {

        length:
            formData.password.length >= 8,

        uppercase:
            /[A-Z]/.test(
                formData.password
            ),

        lowercase:
            /[a-z]/.test(
                formData.password
            ),

        number:
            /[0-9]/.test(
                formData.password
            ),

        special:
            /[^A-Za-z0-9]/.test(
                formData.password
            ),

    };


    // =================================================
    // HANDLE INPUT
    // =================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            previous => ({
                ...previous,
                [name]: value,
            })
        );


        setError("");
        setSuccess("");
    };


    // =================================================
    // FILE UPLOAD
    // =================================================

    const handlePhotoUpload = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        // ---------------------------------------------
        // VALIDATE FILE TYPE
        // ---------------------------------------------

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            setError(
                "Please select a valid image file."
            );

            return;
        }


        // ---------------------------------------------
        // VALIDATE FILE SIZE
        // ---------------------------------------------

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            setError(
                "Profile photo must be 5MB or smaller."
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload = () => {

            const result =
                reader.result;


            setPhotoData(
                result
            );

            setPhotoPreview(
                result
            );

            setError("");
        };


        reader.onerror = () => {

            setError(
                "Unable to read the selected photo."
            );

        };


        reader.readAsDataURL(file);
    };


    // =================================================
    // OPEN CAMERA
    // =================================================

    const openCamera = async () => {

        try {

            setError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {
                        facingMode: "user",
                    },

                    audio: false,

                });


            streamRef.current =
                stream;


            setCameraOpen(true);


            // Give React time to render video
            setTimeout(() => {

                if (
                    videoRef.current
                ) {

                    videoRef.current.srcObject =
                        stream;

                }

            }, 100);

        } catch (error) {

            console.error(
                "Camera error:",
                error
            );

            setError(
                "Unable to access the camera. Please allow camera permission or use Upload Photo instead."
            );

        }
    };


    // =================================================
    // TAKE PHOTO
    // =================================================

    const takePhoto = () => {

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;


        if (
            !video ||
            !canvas
        ) {

            return;
        }


        const width =
            video.videoWidth;

        const height =
            video.videoHeight;


        if (
            !width ||
            !height
        ) {

            setError(
                "Camera is not ready yet. Please wait a moment."
            );

            return;
        }


        canvas.width =
            width;

        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );


        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.85
            );


        setPhotoData(
            imageData
        );

        setPhotoPreview(
            imageData
        );


        closeCamera();

        setError("");
    };


    // =================================================
    // CLOSE CAMERA
    // =================================================

    const closeCamera = () => {

        if (
            streamRef.current
        ) {

            streamRef.current
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

            streamRef.current =
                null;
        }


        setCameraOpen(
            false
        );
    };


    // =================================================
    // CLEAN CAMERA ON UNMOUNT
    // =================================================

    useEffect(() => {

        return () => {

            if (
                streamRef.current
            ) {

                streamRef.current
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

            }

        };

    }, []);


    // =================================================
    // VALIDATE FORM
    // =================================================

    const validateForm = () => {

        if (
            !formData.fullName.trim()
        ) {

            return "Please enter the Admin full name.";
        }


        if (
            !formData.email.trim()
        ) {

            return "Please enter the Admin email address.";
        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email.trim()
            )
        ) {

            return "Please enter a valid email address.";
        }


        if (
            !passwordRequirements.length ||
            !passwordRequirements.uppercase ||
            !passwordRequirements.lowercase ||
            !passwordRequirements.number ||
            !passwordRequirements.special
        ) {

            return "Please meet all password requirements.";
        }


        if (
            formData.password !==
            formData.confirmPassword
        ) {

            return "Passwords do not match.";
        }


        if (
            !formData.adminRegistrationCode.trim()
        ) {

            return "Please enter the Admin Registration Code.";
        }


        if (
            !photoData
        ) {

            return "Please take a photo or upload a profile photo.";
        }


        return "";
    };


    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        setError("");
        setSuccess("");


        const validationError =
            validateForm();


        if (
            validationError
        ) {

            setError(
                validationError
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await fetch(
                    `${API_BASE_URL}/admin-auth/register`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({

                                fullName:
                                    formData.fullName.trim(),

                                email:
                                    formData.email
                                        .trim()
                                        .toLowerCase(),

                                password:
                                    formData.password,

                                confirmPassword:
                                    formData.confirmPassword,

                                adminRegistrationCode:
                                    formData.adminRegistrationCode.trim(),

                                photoData:
                                    photoData,

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
                    "Unable to create the Admin account."
                );

                return;
            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            setSuccess(
                "Admin account created successfully. Redirecting to Admin Dashboard..."
            );


            // -----------------------------------------
            // Save staff information locally
            //
            // No password is stored.
            // -----------------------------------------

            if (
                data.user
            ) {

                localStorage.setItem(
                    "votaraAdminUser",
                    JSON.stringify(
                        data.user
                    )
                );

            }


            // -----------------------------------------
            // NOTE:
            //
            // The current registration endpoint creates
            // the account but does not issue a JWT.
            //
            // Therefore we will connect the actual
            // authenticated Admin session in the next
            // authentication step.
            //
            // For now, go to Admin Login so the Admin
            // can authenticate securely.
            // -----------------------------------------

            setTimeout(() => {

                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

            }, 1200);


        } catch (error) {

            console.error(
                "Admin registration error:",
                error
            );

            setError(
                "Unable to connect to the VOTARA server. Please make sure the backend is running."
            );

        } finally {

            setLoading(
                false
            );

        }
    };


    // =================================================
    // PASSWORD CHECK COMPONENT
    // =================================================

    const Requirement = ({
        valid,
        children,
    }) => {

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: valid
                        ? "#15803d"
                        : "#64748b",
                    marginBottom: "5px",
                }}
            >

                <span
                    style={{
                        width: "19px",
                        height: "19px",
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                            valid
                                ? "#dcfce7"
                                : "#f1f5f9",
                        color:
                            valid
                                ? "#15803d"
                                : "#94a3b8",
                        fontWeight: "700",
                    }}
                >
                    {valid ? "✓" : "○"}
                </span>

                {children}

            </div>
        );
    };


    // =================================================
    // RENDER
    // =================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                padding: "40px 20px",
                background:
                    "linear-gradient(135deg, #f8fafc, #eef2ff)",
                fontFamily:
                    "Poppins, Arial, sans-serif",
            }}
        >

            <div
                style={{
                    maxWidth: "620px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow:
                        "0 20px 50px rgba(15, 23, 42, 0.12)",
                }}
            >

                {/* =====================================
                    HEADER
                ====================================== */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >

                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            margin: "0 auto 14px",
                            borderRadius: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                                "#eef2ff",
                            fontSize: "30px",
                        }}
                    >
                        ⚙️
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "28px",
                            color: "#172554",
                        }}
                    >
                        Admin Registration
                    </h1>

                    <p
                        style={{
                            marginTop: "8px",
                            color: "#64748b",
                            fontSize: "14px",
                        }}
                    >
                        Create the initial VOTARA administrator account.
                    </p>

                </div>


                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (

                    <div
                        style={{
                            marginBottom: "18px",
                            padding: "13px 15px",
                            borderRadius: "12px",
                            background: "#fef2f2",
                            border:
                                "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>

                )}


                {/* =====================================
                    SUCCESS
                ====================================== */}

                {success && (

                    <div
                        style={{
                            marginBottom: "18px",
                            padding: "13px 15px",
                            borderRadius: "12px",
                            background: "#f0fdf4",
                            border:
                                "1px solid #bbf7d0",
                            color: "#15803d",
                            fontSize: "14px",
                        }}
                    >
                        {success}
                    </div>

                )}


                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* =================================
                        FULL NAME
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Full Name
                    </label>

                    <input
                        type="text"
                        name="fullName"
                        value={
                            formData.fullName
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter full name"
                        autoComplete="name"
                        style={inputStyle}
                        disabled={loading}
                    />


                    {/* =================================
                        EMAIL
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Email Address
                    </label>

                    <input
                        type="email"
                        name="email"
                        value={
                            formData.email
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter admin email"
                        autoComplete="email"
                        style={inputStyle}
                        disabled={loading}
                    />


                    {/* =================================
                        PASSWORD
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Password
                    </label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Create password"
                            autoComplete="new-password"
                            style={{
                                ...inputStyle,
                                paddingRight: "85px",
                            }}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    previous =>
                                        !previous
                                )
                            }
                            style={showButtonStyle}
                        >
                            {
                                showPassword
                                    ? "Hide"
                                    : "Show"
                            }
                        </button>

                    </div>


                    {/* =================================
                        REQUIREMENTS
                    ================================== */}

                    <div
                        style={{
                            marginTop: "10px",
                            marginBottom: "18px",
                            padding: "14px",
                            borderRadius: "12px",
                            background:
                                "#f8fafc",
                            border:
                                "1px solid #e2e8f0",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "9px",
                            }}
                        >
                            Password Requirements
                        </div>

                        <Requirement
                            valid={
                                passwordRequirements.length
                            }
                        >
                            At least 8 characters
                        </Requirement>

                        <Requirement
                            valid={
                                passwordRequirements.uppercase
                            }
                        >
                            One uppercase letter
                        </Requirement>

                        <Requirement
                            valid={
                                passwordRequirements.lowercase
                            }
                        >
                            One lowercase letter
                        </Requirement>

                        <Requirement
                            valid={
                                passwordRequirements.number
                            }
                        >
                            One number
                        </Requirement>

                        <Requirement
                            valid={
                                passwordRequirements.special
                            }
                        >
                            One special character
                        </Requirement>

                    </div>


                    {/* =================================
                        CONFIRM PASSWORD
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Confirm Password
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
                            name="confirmPassword"
                            value={
                                formData.confirmPassword
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            style={{
                                ...inputStyle,
                                paddingRight: "85px",
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
                            style={showButtonStyle}
                        >
                            {
                                showConfirmPassword
                                    ? "Hide"
                                    : "Show"
                            }
                        </button>

                    </div>


                    {/* =================================
                        PROFILE PHOTO
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Profile Photo
                    </label>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "15px",
                        }}
                    >

                        <button
                            type="button"
                            onClick={
                                openCamera
                            }
                            disabled={loading}
                            style={{
                                ...secondaryButtonStyle,
                                flex: 1,
                                minWidth: "180px",
                            }}
                        >
                            📷 Take Photo
                        </button>


                        <label
                            style={{
                                ...secondaryButtonStyle,
                                flex: 1,
                                minWidth: "180px",
                                textAlign: "center",
                                cursor:
                                    loading
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            📁 Upload Photo

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handlePhotoUpload
                                }
                                disabled={
                                    loading
                                }
                                style={{
                                    display:
                                        "none",
                                }}
                            />

                        </label>

                    </div>


                    {/* =================================
                        CAMERA
                    ================================== */}

                    {cameraOpen && (

                        <div
                            style={{
                                marginBottom: "18px",
                                padding: "15px",
                                borderRadius: "16px",
                                background:
                                    "#0f172a",
                            }}
                        >

                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "100%",
                                    maxHeight:
                                        "360px",
                                    borderRadius:
                                        "12px",
                                    objectFit:
                                        "cover",
                                }}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    marginTop: "12px",
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={
                                        takePhoto
                                    }
                                    style={{
                                        ...primaryButtonStyle,
                                        flex: 1,
                                    }}
                                >
                                    Capture Photo
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        closeCamera
                                    }
                                    style={{
                                        ...secondaryButtonStyle,
                                        flex: 1,
                                        background:
                                            "#ffffff",
                                    }}
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>

                    )}


                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "none",
                        }}
                    />


                    {/* =================================
                        PHOTO PREVIEW
                    ================================== */}

                    {photoPreview && (

                        <div
                            style={{
                                marginBottom: "18px",
                                textAlign: "center",
                            }}
                        >

                            <img
                                src={
                                    photoPreview
                                }
                                alt="Admin profile preview"
                                style={{
                                    width: "130px",
                                    height: "130px",
                                    borderRadius:
                                        "50%",
                                    objectFit:
                                        "cover",
                                    border:
                                        "4px solid #e0e7ff",
                                }}
                            />

                            <div
                                style={{
                                    marginTop: "7px",
                                    fontSize:
                                        "12px",
                                    color:
                                        "#64748b",
                                }}
                            >
                                Profile photo ready
                            </div>

                        </div>

                    )}


                    {/* =================================
                        ADMIN REGISTRATION CODE
                    ================================== */}

                    <label
                        style={labelStyle}
                    >
                        Admin Registration Code
                    </label>

                    <input
                        type="password"
                        name="adminRegistrationCode"
                        value={
                            formData.adminRegistrationCode
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter Admin Registration Code"
                        autoComplete="off"
                        style={inputStyle}
                        disabled={loading}
                    />

                    <p
                        style={{
                            marginTop: "-8px",
                            marginBottom: "20px",
                            fontSize: "12px",
                            color: "#64748b",
                        }}
                    >
                        This code is required to create the initial Admin account.
                    </p>


                    {/* =================================
                        SUBMIT
                    ================================== */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...primaryButtonStyle,
                            width: "100%",
                            opacity:
                                loading
                                    ? 0.7
                                    : 1,
                        }}
                    >
                        {loading
                            ? "Creating Admin Account..."
                            : "Create Admin Account"}
                    </button>

                </form>


                {/* =====================================
                    LOGIN
                ====================================== */}

                <div
                    style={{
                        marginTop: "22px",
                        textAlign: "center",
                        fontSize: "14px",
                        color: "#64748b",
                    }}
                >

                    Already have a staff account?

                    {" "}

                    <Link
                        to="/admin-login"
                        style={{
                            color: "#2563eb",
                            fontWeight: "700",
                            textDecoration:
                                "none",
                        }}
                    >
                        Staff Login
                    </Link>

                </div>


                {/* =====================================
                    BACK
                ====================================== */}

                <div
                    style={{
                        marginTop: "12px",
                        textAlign: "center",
                    }}
                >

                    <Link
                        to="/account-selection"
                        style={{
                            fontSize: "13px",
                            color: "#64748b",
                            textDecoration:
                                "none",
                        }}
                    >
                        ← Back to Account Selection
                    </Link>

                </div>

            </div>

        </div>
    );
};


// =====================================================
// STYLES
// =====================================================

const labelStyle = {

    display: "block",

    marginBottom: "7px",

    marginTop: "17px",

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

    background: "#ffffff",

};


const primaryButtonStyle = {

    border: "none",

    borderRadius: "11px",

    padding: "14px 18px",

    background:
        "#2563eb",

    color: "#ffffff",

    fontWeight: "700",

    fontSize: "14px",

    cursor: "pointer",

};


const secondaryButtonStyle = {

    border:
        "1px solid #cbd5e1",

    borderRadius: "11px",

    padding: "13px 18px",

    background: "#f8fafc",

    color: "#334155",

    fontWeight: "700",

    fontSize: "14px",

    cursor: "pointer",

};


const showButtonStyle = {

    position: "absolute",

    right: "8px",

    top: "7px",

    border: "none",

    background: "#f1f5f9",

    borderRadius: "8px",

    padding: "7px 10px",

    color: "#334155",

    fontWeight: "600",

    cursor: "pointer",

};


export default AdminRegister;