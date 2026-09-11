import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

const RegistrationRequirements = () => {
    const navigate = useNavigate();

    // =========================================================
    // CAMERA
    // =========================================================

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [selfiePreview, setSelfiePreview] =
        useState("");

    const [cameraError, setCameraError] =
        useState("");

    // =========================================================
    // DOCUMENTS
    // =========================================================

    const [studentIdFront, setStudentIdFront] =
        useState(null);

    const [studentIdBack, setStudentIdBack] =
        useState(null);

    const [enrollmentProof, setEnrollmentProof] =
        useState(null);

    const [supportingDocument, setSupportingDocument] =
        useState(null);

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    // =========================================================
    // CLEAN UP CAMERA
    // =========================================================

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // =========================================================
    // START CAMERA
    // =========================================================

    const startCamera = async () => {
        try {
            setCameraError("");

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setCameraError(
                    "Your browser does not support camera access."
                );
                return;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                    },
                    audio: false,
                });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject =
                    stream;
            }

            setCameraActive(true);

        } catch (err) {
            console.error(
                "Camera access error:",
                err
            );

            setCameraError(
                "Unable to access your camera. Please allow camera permission and try again."
            );

            setCameraActive(false);
        }
    };

    // =========================================================
    // STOP CAMERA
    // =========================================================

    const stopCamera = () => {
        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject =
                null;
        }

        setCameraActive(false);
    };

    // =========================================================
    // CAPTURE SELFIE
    // =========================================================

    const captureSelfie = () => {
        if (
            !videoRef.current ||
            !canvasRef.current
        ) {
            return;
        }

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );

        setSelfiePreview(
            imageData
        );

        stopCamera();
    };

    // =========================================================
    // RETAKE SELFIE
    // =========================================================

    const retakeSelfie = () => {
        setSelfiePreview("");
        startCamera();
    };

    // =========================================================
    // FILE HANDLERS
    // =========================================================

    const handleStudentIdFront = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (file) {
            setStudentIdFront(file);
        }
    };

    const handleStudentIdBack = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (file) {
            setStudentIdBack(file);
        }
    };

    const handleEnrollmentProof = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (file) {
            setEnrollmentProof(file);
        }
    };

    const handleSupportingDocument = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (file) {
            setSupportingDocument(file);
        }
    };

    // =========================================================
    // REMOVE FILE
    // =========================================================

    const removeFile = (
        setter
    ) => {
        setter(null);
    };

    // =========================================================
    // FILE → DATA URL
    // =========================================================

    const fileToDataUrl = (
        file
    ) => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                if (!file) {
                    resolve(null);
                    return;
                }

                const reader =
                    new FileReader();

                reader.onload = () => {
                    resolve(
                        reader.result
                    );
                };

                reader.onerror = () => {
                    reject(
                        new Error(
                            `Unable to read ${file.name}.`
                        )
                    );
                };

                reader.readAsDataURL(file);
            }
        );
    };

    // =========================================================
    // PREPARE DOCUMENT
    // =========================================================

    const prepareFile = async (
        file
    ) => {

        if (!file) {
            return null;
        }

        const data =
            await fileToDataUrl(file);

        return {
            name:
                file.name,

            data,
        };
    };

    // =========================================================
    // CONTINUE & SUBMIT
    // =========================================================

    const handleContinue = async () => {

        setError("");

        // -----------------------------------------------------
        // REQUIRED DOCUMENT CHECK
        // -----------------------------------------------------

        if (!studentIdFront) {
            setError(
                "Please upload the front side of your Student ID."
            );
            return;
        }

        if (!studentIdBack) {
            setError(
                "Please upload the back side of your Student ID."
            );
            return;
        }

        // -----------------------------------------------------
        // SELFIE CHECK
        // -----------------------------------------------------

        if (!selfiePreview) {
            setError(
                "Please take your real-time selfie."
            );
            return;
        }

        // -----------------------------------------------------
        // GET REGISTRATION INFORMATION
        // -----------------------------------------------------

        const studentId =
            sessionStorage.getItem(
                "votara_student_id"
            );

        const email =
            sessionStorage.getItem(
                "votara_email"
            );

        if (!studentId) {
            setError(
                "Your Student ID could not be found. Please restart the registration process."
            );
            return;
        }

        if (!email) {
            setError(
                "Your registration email could not be found. Please restart the registration process."
            );
            return;
        }

        // -----------------------------------------------------
        // START SUBMISSION
        // -----------------------------------------------------

        try {

            setSubmitting(true);

            // -------------------------------------------------
            // CONVERT FILES
            // -------------------------------------------------

            const preparedStudentIdFront =
                await prepareFile(
                    studentIdFront
                );

            const preparedStudentIdBack =
                await prepareFile(
                    studentIdBack
                );

            const preparedEnrollmentProof =
                await prepareFile(
                    enrollmentProof
                );

            const preparedSupportingDocument =
                await prepareFile(
                    supportingDocument
                );

            // -------------------------------------------------
            // SEND TO BACKEND
            // -------------------------------------------------

            const response =
                await api.post(
                    "/registration-documents/upload",
                    {
                        studentId,
                        email,

                        studentIdFront:
                            preparedStudentIdFront,

                        studentIdBack:
                            preparedStudentIdBack,

                        enrollmentProof:
                            preparedEnrollmentProof,

                        supportingDocument:
                            preparedSupportingDocument,

                        selfie:
                            selfiePreview,
                    }
                );

            console.log(
                "Registration requirements submitted:",
                response.data
            );

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            if (
                response.data?.success
            ) {

                // Keep registration status
                // available for the next page.
                sessionStorage.setItem(
                    "votara_registration_status",
                    response.data
                        ?.registrationStatus ||
                    "pending_review"
                );

                navigate(
                    "/registration-confirmation"
                );

                return;
            }

            setError(
                response.data?.message ||
                "Unable to submit your registration requirements."
            );

        } catch (err) {

            console.error(
                "Registration requirements submission error:",
                err
            );

            const serverMessage =
                err.response?.data?.message;

            setError(
                serverMessage ||
                "Unable to submit your registration requirements. Please try again."
            );

        } finally {

            setSubmitting(false);
        }
    };

    // =========================================================
    // FILE CARD
    // =========================================================

    const FileCard = ({
        label,
        required,
        file,
        inputId,
        onChange,
        onRemove,
    }) => {

        return (
            <div
                style={{
                    border:
                        "1px solid #d9e1ee",
                    borderRadius:
                        "12px",
                    padding:
                        "16px",
                    background:
                        "#ffffff",
                }}
            >

                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        marginBottom:
                            "10px",
                    }}
                >

                    <div>

                        <div
                            style={{
                                fontWeight:
                                    "700",
                                fontSize:
                                    "14px",
                                color:
                                    "#172033",
                            }}
                        >
                            {label}
                        </div>

                        <div
                            style={{
                                fontSize:
                                    "12px",
                                color:
                                    "#718096",
                                marginTop:
                                    "4px",
                            }}
                        >
                            {required
                                ? "Required"
                                : "Optional"}
                        </div>

                    </div>

                    {file && (
                        <span
                            style={{
                                color:
                                    "#15803d",
                                fontWeight:
                                    "700",
                                fontSize:
                                    "12px",
                            }}
                        >
                            ✓ Ready
                        </span>
                    )}

                </div>


                {file ? (

                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "space-between",
                            gap:
                                "10px",
                            padding:
                                "10px 12px",
                            background:
                                "#f5f8ff",
                            borderRadius:
                                "8px",
                        }}
                    >

                        <div
                            style={{
                                minWidth:
                                    0,
                            }}
                        >

                            <div
                                style={{
                                    fontSize:
                                        "13px",
                                    fontWeight:
                                        "600",
                                    overflow:
                                        "hidden",
                                    textOverflow:
                                        "ellipsis",
                                    whiteSpace:
                                        "nowrap",
                                }}
                            >
                                {file.name}
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        "11px",
                                    color:
                                        "#718096",
                                    marginTop:
                                        "3px",
                                }}
                            >
                                {(
                                    file.size /
                                    1024 /
                                    1024
                                ).toFixed(2)}{" "}
                                MB
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={submitting}
                            style={{
                                border:
                                    "none",
                                background:
                                    "#fff1f2",
                                color:
                                    "#dc2626",
                                borderRadius:
                                    "7px",
                                padding:
                                    "7px 10px",
                                cursor:
                                    submitting
                                        ? "not-allowed"
                                        : "pointer",
                                fontWeight:
                                    "600",
                                opacity:
                                    submitting
                                        ? 0.6
                                        : 1,
                            }}
                        >
                            Remove
                        </button>

                    </div>

                ) : (

                    <label
                        htmlFor={inputId}
                        style={{
                            display:
                                "block",
                            border:
                                "1px dashed #b9c7dc",
                            borderRadius:
                                "9px",
                            padding:
                                "18px",
                            textAlign:
                                "center",
                            cursor:
                                submitting
                                    ? "not-allowed"
                                    : "pointer",
                            background:
                                "#fafcff",
                            opacity:
                                submitting
                                    ? 0.6
                                    : 1,
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    "24px",
                                marginBottom:
                                    "7px",
                            }}
                        >
                            📄
                        </div>

                        <div
                            style={{
                                fontWeight:
                                    "700",
                                fontSize:
                                    "13px",
                                color:
                                    "#266EFF",
                            }}
                        >
                            Choose File
                        </div>

                        <div
                            style={{
                                fontSize:
                                    "11px",
                                color:
                                    "#718096",
                                marginTop:
                                    "4px",
                            }}
                        >
                            PDF, JPG, JPEG, or PNG
                        </div>

                        <input
                            id={inputId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={
                                onChange
                            }
                            disabled={
                                submitting
                            }
                            style={{
                                display:
                                    "none",
                            }}
                        />

                    </label>

                )}

            </div>
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            style={{
                minHeight:
                    "100vh",
                background:
                    "#f4f7fc",
                padding:
                    "35px 20px",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >

            <div
                style={{
                    maxWidth:
                        "1050px",
                    margin:
                        "0 auto",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "25px 30px",
                        boxShadow:
                            "0 5px 25px rgba(20,40,80,0.06)",
                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            color:
                                "#266EFF",
                            fontSize:
                                "11px",
                            fontWeight:
                                "800",
                            letterSpacing:
                                "1.4px",
                            marginBottom:
                                "7px",
                        }}
                    >
                        VOTARA • STUDENT REGISTRATION
                    </div>

                    <h1
                        style={{
                            margin:
                                "0",
                            color:
                                "#172033",
                            fontSize:
                                "28px",
                        }}
                    >
                        Complete Your Registration
                    </h1>

                    <p
                        style={{
                            margin:
                                "8px 0 0",
                            color:
                                "#667085",
                            fontSize:
                                "14px",
                            lineHeight:
                                "1.6",
                        }}
                    >
                        Submit your required identification
                        documents and complete your real-time
                        identity verification.
                    </p>

                </div>


                {/* =================================================
                    SECURITY NOTICE
                ================================================= */}

                <div
                    style={{
                        background:
                            "#eef5ff",
                        border:
                            "1px solid #cfe0ff",
                        borderRadius:
                            "12px",
                        padding:
                            "15px 18px",
                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            fontWeight:
                                "700",
                            color:
                                "#1554d1",
                            fontSize:
                                "13px",
                            marginBottom:
                                "5px",
                        }}
                    >
                        🔐 Identity Verification
                    </div>

                    <div
                        style={{
                            color:
                                "#5c6b82",
                            fontSize:
                                "12px",
                            lineHeight:
                                "1.6",
                        }}
                    >
                        Make sure your submitted information
                        matches your official Student ID.
                        Your selfie must be captured using
                        your camera during registration.
                    </div>

                </div>


                {/* =================================================
                    DOCUMENTS
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "25px",
                        boxShadow:
                            "0 5px 25px rgba(20,40,80,0.06)",
                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "18px",
                        }}
                    >

                        <h2
                            style={{
                                margin:
                                    "0",
                                fontSize:
                                    "19px",
                                color:
                                    "#172033",
                            }}
                        >
                            Required Documents
                        </h2>

                        <p
                            style={{
                                margin:
                                    "6px 0 0",
                                color:
                                    "#718096",
                                fontSize:
                                    "12px",
                            }}
                        >
                            Upload clear and readable copies
                            of your identification documents.
                        </p>

                    </div>


                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(280px, 1fr))",
                            gap:
                                "15px",
                        }}
                    >

                        <FileCard
                            label="Student ID — Front"
                            required={true}
                            file={
                                studentIdFront
                            }
                            inputId="student-id-front"
                            onChange={
                                handleStudentIdFront
                            }
                            onRemove={() =>
                                removeFile(
                                    setStudentIdFront
                                )
                            }
                        />

                        <FileCard
                            label="Student ID — Back"
                            required={true}
                            file={
                                studentIdBack
                            }
                            inputId="student-id-back"
                            onChange={
                                handleStudentIdBack
                            }
                            onRemove={() =>
                                removeFile(
                                    setStudentIdBack
                                )
                            }
                        />

                        <FileCard
                            label="Enrollment Proof"
                            required={false}
                            file={
                                enrollmentProof
                            }
                            inputId="enrollment-proof"
                            onChange={
                                handleEnrollmentProof
                            }
                            onRemove={() =>
                                removeFile(
                                    setEnrollmentProof
                                )
                            }
                        />

                        <FileCard
                            label="Other Supporting Document"
                            required={false}
                            file={
                                supportingDocument
                            }
                            inputId="supporting-document"
                            onChange={
                                handleSupportingDocument
                            }
                            onRemove={() =>
                                removeFile(
                                    setSupportingDocument
                                )
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    REAL-TIME SELFIE
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "25px",
                        boxShadow:
                            "0 5px 25px rgba(20,40,80,0.06)",
                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "18px",
                        }}
                    >

                        <h2
                            style={{
                                margin:
                                    "0",
                                fontSize:
                                    "19px",
                                color:
                                    "#172033",
                            }}
                        >
                            Real-Time Selfie
                        </h2>

                        <p
                            style={{
                                margin:
                                    "6px 0 0",
                                color:
                                    "#718096",
                                fontSize:
                                    "12px",
                            }}
                        >
                            Take a live selfie using your
                            device camera. Do not upload an
                            old photo.
                        </p>

                    </div>


                    <div
                        style={{
                            maxWidth:
                                "520px",
                            margin:
                                "0 auto",
                        }}
                    >

                        {!selfiePreview ? (

                            <div
                                style={{
                                    background:
                                        "#0f172a",
                                    borderRadius:
                                        "14px",
                                    overflow:
                                        "hidden",
                                    position:
                                        "relative",
                                }}
                            >

                                <video
                                    ref={
                                        videoRef
                                    }
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        display:
                                            cameraActive
                                                ? "block"
                                                : "none",
                                        width:
                                            "100%",
                                        aspectRatio:
                                            "4 / 3",
                                        objectFit:
                                            "cover",
                                    }}
                                />

                                {!cameraActive && (

                                    <div
                                        style={{
                                            aspectRatio:
                                                "4 / 3",
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            justifyContent:
                                                "center",
                                            color:
                                                "#cbd5e1",
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px",
                                        }}
                                    >

                                        <div>

                                            <div
                                                style={{
                                                    fontSize:
                                                        "45px",
                                                    marginBottom:
                                                        "10px",
                                                }}
                                            >
                                                📷
                                            </div>

                                            <div
                                                style={{
                                                    fontWeight:
                                                        "700",
                                                    marginBottom:
                                                        "6px",
                                                }}
                                            >
                                                Camera Ready
                                            </div>

                                            <div
                                                style={{
                                                    fontSize:
                                                        "12px",
                                                }}
                                            >
                                                Click the button
                                                below to start
                                                your camera.
                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>

                        ) : (

                            <div
                                style={{
                                    borderRadius:
                                        "14px",
                                    overflow:
                                        "hidden",
                                    border:
                                        "1px solid #d9e1ee",
                                }}
                            >

                                <img
                                    src={
                                        selfiePreview
                                    }
                                    alt="Captured selfie"
                                    style={{
                                        display:
                                            "block",
                                        width:
                                            "100%",
                                        aspectRatio:
                                            "4 / 3",
                                        objectFit:
                                            "cover",
                                    }}
                                />

                            </div>

                        )}


                        <canvas
                            ref={
                                canvasRef
                            }
                            style={{
                                display:
                                    "none",
                            }}
                        />


                        {cameraError && (

                            <div
                                style={{
                                    marginTop:
                                        "12px",
                                    background:
                                        "#fff1f2",
                                    color:
                                        "#b42318",
                                    border:
                                        "1px solid #fecdd3",
                                    borderRadius:
                                        "8px",
                                    padding:
                                        "10px 12px",
                                    fontSize:
                                        "12px",
                                }}
                            >
                                {cameraError}
                            </div>

                        )}


                        <div
                            style={{
                                display:
                                    "flex",
                                gap:
                                    "10px",
                                justifyContent:
                                    "center",
                                marginTop:
                                    "15px",
                                flexWrap:
                                    "wrap",
                            }}
                        >

                            {!cameraActive &&
                                !selfiePreview && (

                                    <button
                                        type="button"
                                        onClick={
                                            startCamera
                                        }
                                        disabled={
                                            submitting
                                        }
                                        style={{
                                            background:
                                                "#266EFF",
                                            color:
                                                "#ffffff",
                                            border:
                                                "none",
                                            borderRadius:
                                                "9px",
                                            padding:
                                                "12px 22px",
                                            fontWeight:
                                                "700",
                                            cursor:
                                                submitting
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                submitting
                                                    ? 0.6
                                                    : 1,
                                        }}
                                    >
                                        📷 Start Camera
                                    </button>

                                )}


                            {cameraActive && (

                                <button
                                    type="button"
                                    onClick={
                                        captureSelfie
                                    }
                                    disabled={
                                        submitting
                                    }
                                    style={{
                                        background:
                                            "#15803d",
                                        color:
                                            "#ffffff",
                                        border:
                                            "none",
                                        borderRadius:
                                            "9px",
                                        padding:
                                            "12px 22px",
                                        fontWeight:
                                            "700",
                                        cursor:
                                            submitting
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            submitting
                                                ? 0.6
                                                : 1,
                                    }}
                                >
                                    ✓ Capture Selfie
                                </button>

                            )}


                            {selfiePreview && (

                                <button
                                    type="button"
                                    onClick={
                                        retakeSelfie
                                    }
                                    disabled={
                                        submitting
                                    }
                                    style={{
                                        background:
                                            "#eef3ff",
                                        color:
                                            "#266EFF",
                                        border:
                                            "1px solid #cbd9ff",
                                        borderRadius:
                                            "9px",
                                        padding:
                                            "12px 22px",
                                        fontWeight:
                                            "700",
                                        cursor:
                                            submitting
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            submitting
                                                ? 0.6
                                                : 1,
                                    }}
                                >
                                    ↻ Retake Selfie
                                </button>

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ERROR / MESSAGE
                ================================================= */}

                {error && (

                    <div
                        style={{
                            background:
                                "#fff1f2",
                            border:
                                "1px solid #fecdd3",
                            color:
                                "#b42318",
                            borderRadius:
                                "10px",
                            padding:
                                "12px 15px",
                            marginBottom:
                                "20px",
                            fontSize:
                                "13px",
                        }}
                    >
                        {error}
                    </div>

                )}


                {/* =================================================
                    SUBMIT
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "20px 25px",
                        boxShadow:
                            "0 5px 25px rgba(20,40,80,0.06)",
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap:
                            "15px",
                        flexWrap:
                            "wrap",
                    }}
                >

                    <div>

                        <div
                            style={{
                                fontWeight:
                                    "700",
                                fontSize:
                                    "14px",
                                color:
                                    "#172033",
                            }}
                        >
                            Ready to submit?
                        </div>

                        <div
                            style={{
                                fontSize:
                                    "12px",
                                color:
                                    "#718096",
                                marginTop:
                                    "4px",
                            }}
                        >
                            Make sure all required information
                            and documents are correct.
                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleContinue
                        }
                        disabled={
                            submitting
                        }
                        style={{
                            background:
                                "#266EFF",
                            color:
                                "#ffffff",
                            border:
                                "none",
                            borderRadius:
                                "9px",
                            padding:
                                "13px 25px",
                            fontWeight:
                                "700",
                            cursor:
                                submitting
                                    ? "not-allowed"
                                    : "pointer",
                            opacity:
                                submitting
                                    ? 0.7
                                    : 1,
                            minWidth:
                                "170px",
                        }}
                    >
                        {submitting
                            ? "Submitting..."
                            : "Continue & Submit →"}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default RegistrationRequirements;