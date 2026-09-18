import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";


// =========================================================
// VOTARA - REGISTRATION REQUIREMENTS
// =========================================================
//
// NORMAL STUDENT
// otp_verified
//      ↓
// requirements
//      ↓
// pending_review
//
//
// LATE ENROLLEE
// late_enrollee
//      ↓
// requirements
//      ↓
// pending_review
//      ↓
// EB Late Enrollee Management
//
//
// CORRECTION
// needs_correction
//      ↓
// corrected requirements
//      ↓
// pending_review
//
// =========================================================


const RegistrationRequirements = () => {

    const navigate = useNavigate();


    // =====================================================
    // CAMERA
    // =====================================================

    const videoRef =
        useRef(null);

    const canvasRef =
        useRef(null);

    const streamRef =
        useRef(null);


    const [cameraActive, setCameraActive] =
        useState(false);

    const [selfiePreview, setSelfiePreview] =
        useState("");

    const [cameraError, setCameraError] =
        useState("");


    // =====================================================
    // DOCUMENTS
    // =====================================================

    const [studentIdFront, setStudentIdFront] =
        useState(null);

    const [studentIdBack, setStudentIdBack] =
        useState(null);

    const [enrollmentProof, setEnrollmentProof] =
        useState(null);

    const [supportingDocument, setSupportingDocument] =
        useState(null);


    // =====================================================
    // LATE ENROLLEE INFORMATION
    // =====================================================

    const [lateFullName, setLateFullName] =
        useState("");

    const [lateYearLevel, setLateYearLevel] =
        useState("");

    const [isLateEnrollee, setIsLateEnrollee] =
        useState(false);


    // =====================================================
    // GENERAL STATE
    // =====================================================

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);


    // =====================================================
    // CORRECTION MODE
    // =====================================================

    const [isCorrectionMode, setIsCorrectionMode] =
        useState(false);

    const [correctionMessage, setCorrectionMessage] =
        useState("");


    // =====================================================
    // SESSION INFORMATION
    // =====================================================

    const registeredStudentId =
        sessionStorage.getItem(
            "votara_student_id"
        ) || "";


    const registeredEmail =
        sessionStorage.getItem(
            "votara_email"
        ) || "";


    const registeredStudentName =
        sessionStorage.getItem(
            "votara_full_name"
        ) || "";


    const registeredYearLevel =
        sessionStorage.getItem(
            "votara_year_level"
        ) || "";


    // =====================================================
    // LOAD REGISTRATION MODE
    // =====================================================

    useEffect(() => {

        const registrationStatus =
            sessionStorage.getItem(
                "votara_registration_status"
            );


        const registrationType =
            sessionStorage.getItem(
                "votara_registration_type"
            );


        const savedLateFlag =
            sessionStorage.getItem(
                "votara_is_late_enrollee"
            );


        const savedCorrectionMessage =
            sessionStorage.getItem(
                "votara_correction_message"
            );


        // =================================================
        // DETERMINE LATE ENROLLEE MODE
        // =================================================
        //
        // Support both:
        //
        // "late_enrollee" = current/final value
        // "late"          = older value
        //
        // =================================================

        const lateMode =
            registrationType === "late_enrollee" ||
            registrationType === "late" ||
            savedLateFlag === "true";


        setIsLateEnrollee(
            lateMode
        );


        // =================================================
        // CORRECTION MODE
        // =================================================

        const correctionMode =
            registrationStatus ===
            "needs_correction";


        setIsCorrectionMode(
            correctionMode
        );


        setCorrectionMessage(
            savedCorrectionMessage || ""
        );


        // =================================================
        // RESTORE LATE ENROLLEE INFORMATION
        // =================================================

        const savedLateName =
            sessionStorage.getItem(
                "votara_late_full_name"
            ) || "";


        const savedLateYear =
            sessionStorage.getItem(
                "votara_late_year_level"
            ) || "";


        // =================================================
        // IMPORTANT
        //
        // For late enrollees:
        // use late-enrollee values first.
        //
        // For normal students:
        // use official roster values.
        // =================================================

        if (lateMode) {

            setLateFullName(
                savedLateName
            );


            setLateYearLevel(
                savedLateYear
            );

        } else {

            setLateFullName(
                registeredStudentName
            );


            setLateYearLevel(
                registeredYearLevel
            );
        }


        console.log(
            "📋 REGISTRATION REQUIREMENTS MODE:",
            {
                registrationStatus,
                registrationType,
                savedLateFlag,
                isLateEnrollee: lateMode,
                correctionMode,
            }
        );

    }, []);


    // =====================================================
    // CAMERA CLEANUP
    // =====================================================

    useEffect(() => {

        return () => {

            if (streamRef.current) {

                streamRef.current
                    .getTracks()
                    .forEach(
                        (track) => {
                            track.stop();
                        }
                    );

                streamRef.current =
                    null;
            }

        };

    }, []);


    // =====================================================
    // START CAMERA
    // =====================================================

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


            streamRef.current =
                stream;


            if (videoRef.current) {

                videoRef.current.srcObject =
                    stream;

            }


            setCameraActive(
                true
            );

        } catch (err) {

            console.error(
                "Camera access error:",
                err
            );


            setCameraError(
                "Unable to access your camera. Please allow camera permission and try again."
            );


            setCameraActive(
                false
            );
        }
    };


    // =====================================================
    // STOP CAMERA
    // =====================================================

    const stopCamera = () => {

        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach(
                    (track) => {
                        track.stop();
                    }
                );


            streamRef.current =
                null;
        }


        if (videoRef.current) {

            videoRef.current.srcObject =
                null;
        }


        setCameraActive(
            false
        );
    };


    // =====================================================
    // CAPTURE SELFIE
    // =====================================================

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


        if (
            !video.videoWidth ||
            !video.videoHeight
        ) {

            setCameraError(
                "Camera is not ready yet. Please wait a moment and try again."
            );

            return;
        }


        canvas.width =
            video.videoWidth;


        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {

            setCameraError(
                "Unable to capture the selfie."
            );

            return;
        }


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


    // =====================================================
    // RETAKE SELFIE
    // =====================================================

    const retakeSelfie = () => {

        setSelfiePreview("");

        setCameraError("");

        startCamera();
    };


    // =====================================================
    // FILE HANDLERS
    // =====================================================

    const handleStudentIdFront = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (file) {

            setStudentIdFront(
                file
            );
        }
    };


    const handleStudentIdBack = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (file) {

            setStudentIdBack(
                file
            );
        }
    };


    const handleEnrollmentProof = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (file) {

            setEnrollmentProof(
                file
            );
        }
    };


    const handleSupportingDocument = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (file) {

            setSupportingDocument(
                file
            );
        }
    };


    // =====================================================
    // REMOVE FILE
    // =====================================================

    const removeFile = (
        setter
    ) => {

        setter(null);
    };


    // =====================================================
    // FILE TO DATA URL
    // =====================================================

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


                reader.readAsDataURL(
                    file
                );

            }
        );
    };


    // =====================================================
    // PREPARE FILE
    // =====================================================

    const prepareFile = async (
        file
    ) => {

        if (!file) {

            return null;
        }


        const data =
            await fileToDataUrl(
                file
            );


        return {

            name:
                file.name,

            data,

        };
    };


    // =====================================================
    // CONTINUE & SUBMIT
    // =====================================================

    const handleContinue = async () => {

        setError("");


        // =================================================
        // GET SESSION DATA
        // =================================================

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


        // =================================================
        // LATE ENROLLEE VALIDATION
        // =================================================

        if (
            isLateEnrollee &&
            !isCorrectionMode
        ) {

            const cleanedName =
                lateFullName.trim();


            const cleanedYear =
                lateYearLevel.trim();


            // ---------------------------------------------
            // FULL NAME
            // ---------------------------------------------

            if (!cleanedName) {

                setError(
                    "Please enter your full name."
                );

                return;
            }


            // ---------------------------------------------
            // YEAR LEVEL
            // ---------------------------------------------

            if (!cleanedYear) {

                setError(
                    "Please select your year level."
                );

                return;
            }


            // ---------------------------------------------
            // FINAL VOTARA YEAR-LEVEL RULE
            //
            // Late enrollee registration only accepts:
            //
            // 2nd Year
            // 3rd Year
            // 4th Year
            //
            // 1st Year does not use the general
            // year-level representative.
            // ---------------------------------------------

            const validYearLevels = [
                "2nd Year",
                "3rd Year",
                "4th Year",
            ];


            if (
                !validYearLevels.includes(
                    cleanedYear
                )
            ) {

                setError(
                    "Please select a valid year level: 2nd Year, 3rd Year, or 4th Year."
                );

                return;
            }


            // =================================================
            // SAVE LATE ENROLLEE INFORMATION
            // =================================================

            sessionStorage.setItem(
                "votara_late_full_name",
                cleanedName
            );


            sessionStorage.setItem(
                "votara_late_year_level",
                cleanedYear
            );


            sessionStorage.setItem(
                "votara_full_name",
                cleanedName
            );


            sessionStorage.setItem(
                "votara_year_level",
                cleanedYear
            );


            sessionStorage.setItem(
                "votara_registration_type",
                "late_enrollee"
            );


            sessionStorage.setItem(
                "votara_is_late_enrollee",
                "true"
            );

        }


        // =================================================
        // INITIAL SUBMISSION
        // =================================================

        if (!isCorrectionMode) {


            // ---------------------------------------------
            // STUDENT ID FRONT
            // ---------------------------------------------

            if (!studentIdFront) {

                setError(
                    "Please upload the front side of your Student ID."
                );

                return;
            }


            // ---------------------------------------------
            // STUDENT ID BACK
            // ---------------------------------------------

            if (!studentIdBack) {

                setError(
                    "Please upload the back side of your Student ID."
                );

                return;
            }


            // ---------------------------------------------
            // LATE ENROLLEE REGISTRATION FORM
            // ---------------------------------------------
            //
            // The existing state is called
            // enrollmentProof, but for late enrollees
            // it represents the Registration Form.
            //
            // ---------------------------------------------

            if (
                isLateEnrollee &&
                !enrollmentProof
            ) {

                setError(
                    "Please upload your Registration Form."
                );

                return;
            }


            // ---------------------------------------------
            // REAL-TIME SELFIE
            // ---------------------------------------------

            if (!selfiePreview) {

                setError(
                    "Please take your real-time selfie."
                );

                return;
            }
        }


        // =================================================
        // CORRECTION VALIDATION
        // =================================================

        if (isCorrectionMode) {

            const hasCorrectedDocument =
                Boolean(
                    studentIdFront ||
                    studentIdBack ||
                    enrollmentProof ||
                    supportingDocument
                );


            const hasCorrectedSelfie =
                Boolean(
                    selfiePreview
                );


            if (
                !hasCorrectedDocument &&
                !hasCorrectedSelfie
            ) {

                setError(
                    "Please replace at least one corrected document or retake your selfie before resubmitting."
                );

                return;
            }
        }


        // =================================================
        // SUBMIT
        // =================================================

        try {

            setSubmitting(
                true
            );


            // =================================================
            // PREPARE FILES
            // =================================================

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


            // =================================================
            // FINAL STUDENT INFORMATION
            // =================================================

            const finalFullName =
                isLateEnrollee
                    ? lateFullName.trim()
                    : (
                        registeredStudentName ||
                        ""
                    );


            const finalYearLevel =
                isLateEnrollee
                    ? lateYearLevel.trim()
                    : (
                        registeredYearLevel ||
                        ""
                    );


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "📤 SENDING REGISTRATION REQUIREMENTS:",
                {

                    studentId,

                    email,

                    isLateEnrollee,

                    fullName:
                        finalFullName,

                    yearLevel:
                        finalYearLevel,

                    registrationStatus:
                        sessionStorage.getItem(
                            "votara_registration_status"
                        ),

                    registrationType:
                        sessionStorage.getItem(
                            "votara_registration_type"
                        ),

                    studentIdFront:
                        preparedStudentIdFront
                            ? "PRESENT"
                            : "MISSING",

                    studentIdBack:
                        preparedStudentIdBack
                            ? "PRESENT"
                            : "MISSING",

                    registrationForm:
                        preparedEnrollmentProof
                            ? "PRESENT"
                            : "MISSING",

                    supportingDocument:
                        preparedSupportingDocument
                            ? "PRESENT"
                            : "MISSING",

                    selfie:
                        selfiePreview
                            ? "PRESENT"
                            : "MISSING",

                }
            );


            // =================================================
            // API REQUEST
            // =================================================

            const response =
                await api.post(
                    "/registration-documents/upload",
                    {

                        studentId,

                        email,


                        // -------------------------------------------------
                        // IMPORTANT
                        // -------------------------------------------------
                        //
                        // These are required by the backend for
                        // late-enrollee registration.
                        //
                        // -------------------------------------------------

                        fullName:
                            finalFullName,

                        yearLevel:
                            finalYearLevel,


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
                "📦 DOCUMENT UPLOAD RESPONSE:",
                response.data
            );


            // =================================================
            // SUCCESS
            // =================================================

            if (
                response.data?.success
            ) {


                // -------------------------------------------------
                // Save registration status
                // -------------------------------------------------

                sessionStorage.setItem(
                    "votara_registration_status",

                    response.data
                        ?.registrationStatus ||
                    "pending_review"
                );


                // -------------------------------------------------
                // Save registration type
                // -------------------------------------------------

                const returnedRegistrationType =
                    response.data
                        ?.registration
                        ?.registrationType;


                if (
                    returnedRegistrationType
                ) {

                    sessionStorage.setItem(
                        "votara_registration_type",

                        returnedRegistrationType
                    );

                } else if (
                    isLateEnrollee
                ) {

                    sessionStorage.setItem(
                        "votara_registration_type",
                        "late_enrollee"
                    );
                }


                // -------------------------------------------------
                // Save late-enrollee flag
                // -------------------------------------------------

                if (
                    response.data
                        ?.isLateEnrollee ||
                    isLateEnrollee
                ) {

                    sessionStorage.setItem(
                        "votara_is_late_enrollee",
                        "true"
                    );

                } else {

                    sessionStorage.setItem(
                        "votara_is_late_enrollee",
                        "false"
                    );
                }


                // -------------------------------------------------
                // Save final late enrollee information
                // -------------------------------------------------

                if (
                    isLateEnrollee
                ) {

                    sessionStorage.setItem(
                        "votara_late_full_name",
                        finalFullName
                    );


                    sessionStorage.setItem(
                        "votara_late_year_level",
                        finalYearLevel
                    );


                    sessionStorage.setItem(
                        "votara_full_name",
                        finalFullName
                    );


                    sessionStorage.setItem(
                        "votara_year_level",
                        finalYearLevel
                    );

                }


                // -------------------------------------------------
                // Clear correction message
                // -------------------------------------------------

                sessionStorage.removeItem(
                    "votara_correction_message"
                );


                // -------------------------------------------------
                // Navigate to confirmation
                // -------------------------------------------------

                navigate(
                    "/registration-confirmation",
                    {
                        replace: true,
                    }
                );


                return;
            }


            // =================================================
            // UNSUCCESSFUL RESPONSE
            // =================================================

            setError(
                response.data?.message ||
                "Unable to submit your registration requirements."
            );


        } catch (err) {

            console.error(
                "❌ Registration requirements submission error:",
                err
            );


            console.error(
                "❌ Upload status:",
                err?.response?.status
            );


            console.error(
                "❌ Upload response:",
                err?.response?.data
            );


            const serverMessage =
                err?.response?.data
                    ?.message;


            setError(
                serverMessage ||
                "Unable to submit your registration requirements. Please try again."
            );


        } finally {

            setSubmitting(
                false
            );
        }

    };


    // =====================================================
    // FILE CARD
    // =====================================================

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
                                        "700",

                                    color:
                                        "#172033",

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
                            onClick={() =>
                                onRemove()
                            }
                            disabled={
                                submitting
                            }
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

                                fontWeight:
                                    "700",

                                cursor:
                                    "pointer",
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
                                "1px dashed #cbd5e1",

                            borderRadius:
                                "9px",

                            padding:
                                "20px",

                            textAlign:
                                "center",

                            cursor:
                                submitting
                                    ? "not-allowed"
                                    : "pointer",

                            background:
                                "#fbfdff",
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    "28px",

                                marginBottom:
                                    "7px",
                            }}
                        >
                            📄
                        </div>


                        <div
                            style={{
                                color:
                                    "#266EFF",

                                fontWeight:
                                    "700",

                                fontSize:
                                    "13px",
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


    // =====================================================
    // RENDER
    // =====================================================

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
                        {isCorrectionMode
                            ? "Correct Your Registration"
                            : isLateEnrollee
                            ? "Late Enrollee Registration"
                            : "Complete Your Registration"}
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
                        {isCorrectionMode
                            ? "Review the correction message, replace the requested items, and resubmit your registration for review."
                            : isLateEnrollee
                            ? "Complete your student information and requirements so the Electoral Board can review your late enrollee application."
                            : "Submit your required identification documents and complete your real-time identity verification."}
                    </p>

                </div>


                {/* =================================================
                    LATE ENROLLEE WARNING
                ================================================= */}

                {isLateEnrollee &&
                    !isCorrectionMode && (

                    <div
                        style={{
                            background:
                                "#fff8e7",

                            border:
                                "1px solid #f4d58d",

                            borderRadius:
                                "14px",

                            padding:
                                "18px 20px",

                            marginBottom:
                                "20px",
                        }}
                    >

                        <div
                            style={{
                                display:
                                    "flex",

                                gap:
                                    "12px",

                                alignItems:
                                    "flex-start",
                            }}
                        >

                            <div
                                style={{
                                    fontSize:
                                        "25px",
                                }}
                            >
                                ⚠️
                            </div>


                            <div>

                                <div
                                    style={{
                                        fontWeight:
                                            "800",

                                        color:
                                            "#8a5a00",

                                        fontSize:
                                            "15px",

                                        marginBottom:
                                            "5px",
                                    }}
                                >
                                    Late Enrollee Registration
                                </div>


                                <div
                                    style={{
                                        color:
                                            "#6b5a2b",

                                        fontSize:
                                            "13px",

                                        lineHeight:
                                            "1.6",
                                    }}
                                >
                                    Your Student ID was not found
                                    in the original official roster.
                                    You may continue as a late
                                    enrollee by providing your
                                    correct full name, selecting
                                    your year level, and submitting
                                    the required documents.
                                    Your application will be reviewed
                                    by the Electoral Board.
                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    LATE ENROLLEE INFORMATION
                ================================================= */}

                {isLateEnrollee &&
                    !isCorrectionMode && (

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

                            <div
                                style={{
                                    color:
                                        "#266EFF",

                                    fontSize:
                                        "11px",

                                    fontWeight:
                                        "800",

                                    letterSpacing:
                                        "1.1px",

                                    marginBottom:
                                        "5px",
                                }}
                            >
                                LATE ENROLLEE INFORMATION
                            </div>


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
                                Student Information
                            </h2>


                            <p
                                style={{
                                    margin:
                                        "6px 0 0",

                                    color:
                                        "#718096",

                                    fontSize:
                                        "12px",

                                    lineHeight:
                                        "1.5",
                                }}
                            >
                                Enter your information exactly as it
                                appears on your official school
                                records. The Electoral Board will
                                verify this information.
                            </p>

                        </div>


                        <div
                            style={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(260px, 1fr))",

                                gap:
                                    "15px",
                            }}
                        >

                            {/* =====================================
                                FULL NAME
                            ====================================== */}

                            <div>

                                <label
                                    htmlFor="late-full-name"
                                    style={{
                                        display:
                                            "block",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            "700",

                                        color:
                                            "#172033",

                                        marginBottom:
                                            "7px",
                                    }}
                                >
                                    Full Name{" "}

                                    <span
                                        style={{
                                            color:
                                                "#dc2626",
                                        }}
                                    >
                                        *
                                    </span>

                                </label>


                                <input
                                    id="late-full-name"
                                    type="text"
                                    value={
                                        lateFullName
                                    }
                                    onChange={(
                                        event
                                    ) => {

                                        setLateFullName(
                                            event.target.value
                                        );

                                        setError("");

                                    }}
                                    placeholder="Enter your complete full name"
                                    autoComplete="name"
                                    disabled={
                                        submitting
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        boxSizing:
                                            "border-box",

                                        padding:
                                            "12px 14px",

                                        border:
                                            "1px solid #cbd5e1",

                                        borderRadius:
                                            "9px",

                                        fontSize:
                                            "13px",

                                        outline:
                                            "none",

                                        background:
                                            "#ffffff",

                                        color:
                                            "#172033",
                                    }}
                                />

                            </div>


                            {/* =====================================
                                YEAR LEVEL
                            ====================================== */}

                            <div>

                                <label
                                    htmlFor="late-year-level"
                                    style={{
                                        display:
                                            "block",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            "700",

                                        color:
                                            "#172033",

                                        marginBottom:
                                            "7px",
                                    }}
                                >
                                    Year Level{" "}

                                    <span
                                        style={{
                                            color:
                                                "#dc2626",
                                        }}
                                    >
                                        *
                                    </span>

                                </label>


                                <select
                                    id="late-year-level"
                                    value={
                                        lateYearLevel
                                    }
                                    onChange={(
                                        event
                                    ) => {

                                        setLateYearLevel(
                                            event.target.value
                                        );

                                        setError("");

                                    }}
                                    disabled={
                                        submitting
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        boxSizing:
                                            "border-box",

                                        padding:
                                            "12px 14px",

                                        border:
                                            "1px solid #cbd5e1",

                                        borderRadius:
                                            "9px",

                                        fontSize:
                                            "13px",

                                        background:
                                            "#ffffff",

                                        color:
                                            lateYearLevel
                                                ? "#172033"
                                                : "#718096",

                                        cursor:
                                            "pointer",
                                    }}
                                >

                                    <option
                                        value=""
                                    >
                                        Select your year level
                                    </option>


                                    <option
                                        value="2nd Year"
                                    >
                                        2nd Year
                                    </option>


                                    <option
                                        value="3rd Year"
                                    >
                                        3rd Year
                                    </option>


                                    <option
                                        value="4th Year"
                                    >
                                        4th Year
                                    </option>

                                </select>


                                <div
                                    style={{
                                        marginTop:
                                            "6px",

                                        fontSize:
                                            "11px",

                                        color:
                                            "#718096",
                                    }}
                                >
                                    Available year levels:
                                    2nd Year, 3rd Year,
                                    and 4th Year.
                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    REGISTRATION INFORMATION
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",

                        borderRadius:
                            "16px",

                        padding:
                            "22px 25px",

                        boxShadow:
                            "0 5px 25px rgba(20,40,80,0.06)",

                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "16px",
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
                                    "1.1px",

                                marginBottom:
                                    "5px",
                            }}
                        >
                            REGISTRATION INFORMATION
                        </div>


                        <div
                            style={{
                                fontSize:
                                    "17px",

                                fontWeight:
                                    "800",

                                color:
                                    "#172033",
                            }}
                        >
                            Account Information
                        </div>

                    </div>


                    <div
                        style={{
                            display:
                                "grid",

                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",

                            gap:
                                "12px",
                        }}
                    >

                        {[
                            [
                                "Student ID",
                                registeredStudentId ||
                                    "Not available",
                            ],

                            [
                                "Email",
                                registeredEmail ||
                                    "Not available",
                            ],

                            [
                                "Name",
                                isLateEnrollee
                                    ? (
                                        lateFullName ||
                                        "Enter below"
                                    )
                                    : (
                                        registeredStudentName ||
                                        "Not available"
                                    ),
                            ],

                            [
                                "Year Level",
                                isLateEnrollee
                                    ? (
                                        lateYearLevel ||
                                        "Select below"
                                    )
                                    : (
                                        registeredYearLevel ||
                                        "Not available"
                                    ),
                            ],

                        ].map(
                            ([
                                label,
                                value,
                            ]) => (

                                <div
                                    key={label}
                                    style={{
                                        border:
                                            "1px solid #e1e7f0",

                                        borderRadius:
                                            "10px",

                                        padding:
                                            "13px 14px",

                                        background:
                                            "#f9fbff",
                                    }}
                                >

                                    <div
                                        style={{
                                            fontSize:
                                                "10px",

                                            fontWeight:
                                                "800",

                                            letterSpacing:
                                                "0.7px",

                                            color:
                                                "#718096",

                                            marginBottom:
                                                "5px",
                                        }}
                                    >
                                        {label}
                                    </div>


                                    <div
                                        style={{
                                            fontSize:
                                                "14px",

                                            fontWeight:
                                                "700",

                                            color:
                                                "#172033",

                                            wordBreak:
                                                "break-word",
                                        }}
                                    >
                                        {value}
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>


                {/* =================================================
                    CORRECTION NOTICE
                ================================================= */}

                {isCorrectionMode && (

                    <div
                        style={{
                            background:
                                "#fff9e8",

                            border:
                                "1px solid #f2d48a",

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
                                    "800",

                                color:
                                    "#9a6700",

                                fontSize:
                                    "13px",

                                marginBottom:
                                    "7px",
                            }}
                        >
                            ⚠️ Correction Requested
                        </div>


                        <div
                            style={{
                                color:
                                    "#6b5a2b",

                                fontSize:
                                    "13px",

                                lineHeight:
                                    "1.6",
                            }}
                        >
                            {correctionMessage ||
                                "The Electoral Board has requested a correction to your registration. Please replace the incorrect requirement(s) and resubmit."}
                        </div>


                        <div
                            style={{
                                marginTop:
                                    "10px",

                                color:
                                    "#7a6a3a",

                                fontSize:
                                    "12px",

                                lineHeight:
                                    "1.5",
                            }}
                        >
                            You do not need to replace valid
                            requirements. Only upload the item(s)
                            that need correction.
                        </div>

                    </div>

                )}


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
                            {isCorrectionMode
                                ? "Replace Corrected Documents"
                                : "Required Documents"}
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
                            {isCorrectionMode
                                ? "Upload only the document(s) requested for correction. Valid documents can remain unchanged."
                                : isLateEnrollee
                                ? "Late enrollees must submit clear copies of their Student ID and Registration Form."
                                : "Upload clear and readable copies of your identification documents."}
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

                        {/* =========================================
                            STUDENT ID FRONT
                        ========================================== */}

                        <FileCard
                            label="Student ID — Front"
                            required={
                                !isCorrectionMode
                            }
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


                        {/* =========================================
                            STUDENT ID BACK
                        ========================================== */}

                        <FileCard
                            label="Student ID — Back"
                            required={
                                !isCorrectionMode
                            }
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


                        {/* =========================================
                            REGISTRATION FORM
                        ========================================== */}

                        <FileCard
                            label={
                                isLateEnrollee
                                    ? "Registration Form"
                                    : "Enrollment Proof"
                            }
                            required={
                                isLateEnrollee &&
                                !isCorrectionMode
                            }
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


                        {/* =========================================
                            SUPPORTING DOCUMENT
                        ========================================== */}

                        <FileCard
                            label="Other Supporting Document"
                            required={
                                false
                            }
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
                            {isCorrectionMode
                                ? "Retake Real-Time Selfie"
                                : "Real-Time Selfie"}
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
                            {isCorrectionMode
                                ? "Only retake your selfie if the Electoral Board requested a new selfie."
                                : "Take a live selfie using your device camera. Do not upload an old photo."}
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

                                                    color:
                                                        "#94a3b8",
                                                }}
                                            >
                                                Click Start Camera
                                                to begin.
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
                    ERROR
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
                            {isCorrectionMode
                                ? "Ready to resubmit?"
                                : "Ready to submit?"}
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
                            {isCorrectionMode
                                ? "Make sure you have corrected the item(s) identified by the Electoral Board."
                                : isLateEnrollee
                                ? "Make sure your name, year level, documents, and selfie are correct before submitting."
                                : "Make sure all required information and documents are correct."}
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
                            ? (
                                isCorrectionMode
                                    ? "Resubmitting..."
                                    : "Submitting..."
                            )
                            : (
                                isCorrectionMode
                                    ? "Resubmit Correction →"
                                    : "Continue & Submit →"
                            )}
                    </button>

                </div>

            </div>

        </div>

    );
};


export default RegistrationRequirements;