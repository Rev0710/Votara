import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";

const StudentRegistration = () => {
    const navigate = useNavigate();

    // =====================================================
    // VERIFIED STUDENT INFORMATION
    // =====================================================

    const [studentId, setStudentId] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [fullName, setFullName] =
        useState("");

    const [yearLevel, setYearLevel] =
        useState("");

    const [registrationType, setRegistrationType] =
        useState("normal");


    // =====================================================
    // PERSONAL INFORMATION
    // =====================================================

    const [birthday, setBirthday] =
        useState("");

    const [contactNumber, setContactNumber] =
        useState("");

    const [province, setProvince] =
        useState("");

    const [barangay, setBarangay] =
        useState("");

    const [city, setCity] =
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

    const [otherDocument, setOtherDocument] =
        useState(null);


    // =====================================================
    // SELFIE
    // =====================================================

    const videoRef = useRef(null);

    const canvasRef = useRef(null);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [selfie, setSelfie] =
        useState(null);

    const [cameraError, setCameraError] =
        useState("");


    // =====================================================
    // PAGE STATE
    // =====================================================

    const [step, setStep] =
        useState(1);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =====================================================
    // LOAD VERIFIED INFORMATION
    // =====================================================

    useEffect(() => {

        const savedStudentId =
            sessionStorage.getItem(
                "votara_student_id"
            );

        const savedEmail =
            sessionStorage.getItem(
                "votara_email"
            );

        const savedFullName =
            sessionStorage.getItem(
                "votara_full_name"
            );

        const savedYearLevel =
            sessionStorage.getItem(
                "votara_year_level"
            );

        const savedRegistrationType =
            sessionStorage.getItem(
                "votara_registration_type"
            );

        const otpVerified =
            sessionStorage.getItem(
                "votara_otp_verified"
            );


        // =================================================
        // REQUIRE OTP VERIFICATION
        // =================================================

        if (
            otpVerified !== "true"
        ) {

            navigate(
                "/register",
                {
                    replace: true,
                }
            );

            return;
        }


        // =================================================
        // REQUIRE STUDENT ID + EMAIL
        // =================================================

        if (
            !savedStudentId ||
            !savedEmail
        ) {

            navigate(
                "/register",
                {
                    replace: true,
                }
            );

            return;
        }


        setStudentId(
            savedStudentId
        );

        setEmail(
            savedEmail
        );

        setFullName(
            savedFullName || ""
        );

        setYearLevel(
            savedYearLevel || ""
        );

        setRegistrationType(
            savedRegistrationType ||
            "normal"
        );

    }, [navigate]);


    // =====================================================
    // CLEANUP CAMERA
    // =====================================================

    useEffect(() => {

        return () => {

            stopCamera();

        };

    }, []);


    // =====================================================
    // START CAMERA
    // =====================================================

    const startCamera = async () => {

        setCameraError("");

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode:
                                "user",
                        },
                        audio: false,
                    }
                );


            if (
                videoRef.current
            ) {

                videoRef.current.srcObject =
                    stream;

                await videoRef.current.play();

            }

            setCameraActive(true);

        } catch (cameraErr) {

            console.error(
                "Camera error:",
                cameraErr
            );

            setCameraError(
                "Unable to access your camera. Please allow camera permission and try again."
            );

            setCameraActive(false);
        }
    };


    // =====================================================
    // STOP CAMERA
    // =====================================================

    const stopCamera = () => {

        if (
            videoRef.current &&
            videoRef.current.srcObject
        ) {

            const tracks =
                videoRef.current
                    .srcObject
                    .getTracks();

            tracks.forEach(
                (track) => {
                    track.stop();
                }
            );

            videoRef.current.srcObject =
                null;
        }

        setCameraActive(false);
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

        const width =
            video.videoWidth || 640;

        const height =
            video.videoHeight || 480;

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


        canvas.toBlob(
            (blob) => {

                if (!blob) {
                    return;
                }

                const file =
                    new File(
                        [
                            blob,
                        ],
                        "votara-selfie.jpg",
                        {
                            type:
                                "image/jpeg",
                        }
                    );

                setSelfie(
                    file
                );

                stopCamera();

            },
            "image/jpeg",
            0.9
        );
    };


    // =====================================================
    // FILE VALIDATION
    // =====================================================

    const handleFileChange = (
        event,
        setter
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        // Maximum 5MB
        if (
            file.size >
            5 * 1024 * 1024
        ) {

            setError(
                "Each document must be 5MB or smaller."
            );

            event.target.value =
                "";

            return;
        }

        setter(file);
    };


    // =====================================================
    // STEP 1 VALIDATION
    // =====================================================

    const validatePersonalInformation =
        () => {

            if (!birthday) {

                setError(
                    "Please enter your birthday."
                );

                return false;
            }

            if (!contactNumber) {

                setError(
                    "Please enter your contact number."
                );

                return false;
            }

            if (
                contactNumber.trim()
                    .length < 10
            ) {

                setError(
                    "Please enter a valid contact number."
                );

                return false;
            }

            return true;
        };


    // =====================================================
    // STEP 2 VALIDATION
    // =====================================================

    const validateDocuments = () => {

        if (!studentIdFront) {

            setError(
                "Please upload the front of your Student ID."
            );

            return false;
        }

        if (!studentIdBack) {

            setError(
                "Please upload the back of your Student ID."
            );

            return false;
        }

        if (!enrollmentProof) {

            setError(
                "Please upload your enrollment proof."
            );

            return false;
        }

        return true;
    };


    // =====================================================
    // STEP 3 VALIDATION
    // =====================================================

    const validateSelfie = () => {

        if (!selfie) {

            setError(
                "Please take your real-time selfie."
            );

            return false;
        }

        return true;
    };


    // =====================================================
    // NEXT STEP
    // =====================================================

    const handleNext = () => {

        setError("");
        setSuccess("");

        if (step === 1) {

            if (
                !validatePersonalInformation()
            ) {
                return;
            }

            setStep(2);

            return;
        }


        if (step === 2) {

            if (
                !validateDocuments()
            ) {
                return;
            }

            setStep(3);

            return;
        }


        if (step === 3) {

            if (
                !validateSelfie()
            ) {
                return;
            }

            setStep(4);

            return;
        }
    };


    // =====================================================
    // PREVIOUS STEP
    // =====================================================

    const handleBack = () => {

        setError("");
        setSuccess("");

        if (step > 1) {

            if (
                step === 3
            ) {

                stopCamera();
            }

            setStep(
                step - 1
            );
        }
    };


    // =====================================================
    // SUBMIT REGISTRATION
    // =====================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        // =================================================
        // FINAL VALIDATION
        // =================================================

        if (
            !validatePersonalInformation() ||
            !validateDocuments() ||
            !validateSelfie()
        ) {

            return;
        }


        setLoading(true);


        try {

            // =================================================
            // SUBMIT BASIC REGISTRATION INFORMATION
            //
            // The backend currently records the application.
            // Document and selfie storage will be connected
            // to Supabase Storage in the next step.
            // =================================================

            const response =
                await fetch(
                    "http://localhost:5000/api/registration/submit",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            studentId,

                            email,

                            birthday,

                            contactNumber,

                            province,

                            barangay,

                            city,

                        }),
                    }
                );


            let data;

            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            console.log(
                "Registration submission response:",
                data
            );


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to submit registration."
                );
            }


            // =================================================
            // SAVE REGISTRATION STATUS
            // =================================================

            sessionStorage.setItem(
                "votara_registration_status",
                "pending_review"
            );


            sessionStorage.setItem(
                "votara_registration_submitted",
                "true"
            );


            // =================================================
            // CLEAN OTP STATE
            // =================================================

            sessionStorage.removeItem(
                "votara_otp_verified"
            );


            // =================================================
            // SUCCESS
            // =================================================

            setSuccess(
                "Your registration has been submitted successfully."
            );


            // =================================================
            // GO TO REGISTRATION SUBMITTED PAGE
            // =================================================

            setTimeout(() => {

                navigate(
                    "/registration-submitted",
                    {
                        replace: true,
                    }
                );

            }, 700);

        } catch (submitError) {

            console.error(
                "❌ Registration submission error:",
                submitError
            );

            setError(
                submitError.message ||
                "Unable to submit registration."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // FORMAT FILE NAME
    // =====================================================

    const getFileName = (
        file
    ) => {

        if (!file) {
            return "No file selected";
        }

        return file.name;
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            style={{
                minHeight:
                    "100vh",
                padding:
                    "30px 15px",
                background:
                    "#f4f7fb",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >

            <div
                style={{
                    maxWidth:
                        "850px",
                    margin:
                        "0 auto",
                    background:
                        "#ffffff",
                    borderRadius:
                        "14px",
                    padding:
                        "30px",
                    boxShadow:
                        "0 4px 20px rgba(0,0,0,0.08)",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        marginBottom:
                            "25px",
                    }}
                >

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/")
                        }
                        style={{
                            border:
                                "none",
                            background:
                                "none",
                            cursor:
                                "pointer",
                            fontSize:
                                "15px",
                            marginBottom:
                                "15px",
                        }}
                    >
                        ← VOTARA
                    </button>

                    <h1
                        style={{
                            margin:
                                "0 0 8px",
                        }}
                    >
                        Complete Your Registration
                    </h1>

                    <p
                        style={{
                            margin:
                                0,
                            color:
                                "#666",
                        }}
                    >
                        Please complete all
                        required information
                        before submitting your
                        registration.
                    </p>

                </div>


                {/* =================================================
                    PROGRESS
                ================================================= */}

                <div
                    style={{
                        display:
                            "flex",
                        gap:
                            "8px",
                        marginBottom:
                            "30px",
                    }}
                >

                    {[
                        "Personal",
                        "Documents",
                        "Selfie",
                        "Review",
                    ].map(
                        (
                            label,
                            index
                        ) => {

                            const stepNumber =
                                index + 1;

                            return (
                                <div
                                    key={
                                        label
                                    }
                                    style={{
                                        flex:
                                            1,
                                        padding:
                                            "10px",
                                        textAlign:
                                            "center",
                                        borderRadius:
                                            "8px",
                                        background:
                                            step >=
                                            stepNumber
                                                ? "#1769ff"
                                                : "#e8edf5",
                                        color:
                                            step >=
                                            stepNumber
                                                ? "#ffffff"
                                                : "#555",
                                        fontSize:
                                            "13px",
                                        fontWeight:
                                            "600",
                                    }}
                                >
                                    {stepNumber}.{" "}
                                    {label}
                                </div>
                            );
                        }
                    )}

                </div>


                {/* =================================================
                    VERIFIED STUDENT INFORMATION
                ================================================= */}

                <div
                    style={{
                        background:
                            "#eef7ff",
                        border:
                            "1px solid #cfe5ff",
                        borderRadius:
                            "10px",
                        padding:
                            "18px",
                        marginBottom:
                            "25px",
                    }}
                >

                    <h3>
                        Verified Student Information
                    </h3>

                    <p>
                        <strong>
                            Student ID:
                        </strong>{" "}
                        {studentId}
                    </p>

                    <p>
                        <strong>
                            Full Name:
                        </strong>{" "}
                        {fullName}
                    </p>

                    <p>
                        <strong>
                            Year Level:
                        </strong>{" "}
                        {yearLevel}
                    </p>

                    <p>
                        <strong>
                            Email:
                        </strong>{" "}
                        {email}
                    </p>

                    <p
                        style={{
                            marginBottom:
                                0,
                        }}
                    >
                        <strong>
                            Registration Type:
                        </strong>{" "}
                        {registrationType ===
                        "late_enrollee"
                            ? "Late Enrollee"
                            : "Normal Registration"}
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div
                        style={{
                            padding:
                                "12px 15px",
                            marginBottom:
                                "20px",
                            borderRadius:
                                "8px",
                            background:
                                "#ffecec",
                            color:
                                "#c62828",
                            border:
                                "1px solid #ffcaca",
                        }}
                    >
                        {error}
                    </div>
                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (
                    <div
                        style={{
                            padding:
                                "12px 15px",
                            marginBottom:
                                "20px",
                            borderRadius:
                                "8px",
                            background:
                                "#eaf8ef",
                            color:
                                "#18834b",
                            border:
                                "1px solid #bde8ce",
                        }}
                    >
                        {success}
                    </div>
                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* =============================================
                        STEP 1 — PERSONAL INFORMATION
                    ============================================= */}

                    {step === 1 && (

                        <section>

                            <h2>
                                1. Personal Information
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#666",
                                }}
                            >
                                Confirm your
                                personal and
                                contact information.
                            </p>


                            <label>
                                Birthday
                            </label>

                            <input
                                type="date"
                                value={
                                    birthday
                                }
                                onChange={(e) =>
                                    setBirthday(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    margin:
                                        "8px 0 18px",
                                    boxSizing:
                                        "border-box",
                                }}
                            />


                            <label>
                                Contact Number
                            </label>

                            <input
                                type="tel"
                                placeholder="09XXXXXXXXX"
                                value={
                                    contactNumber
                                }
                                onChange={(e) =>
                                    setContactNumber(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    margin:
                                        "8px 0 18px",
                                    boxSizing:
                                        "border-box",
                                }}
                            />


                            <label>
                                Province
                            </label>

                            <input
                                type="text"
                                placeholder="Province"
                                value={
                                    province
                                }
                                onChange={(e) =>
                                    setProvince(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    margin:
                                        "8px 0 18px",
                                    boxSizing:
                                        "border-box",
                                }}
                            />


                            <label>
                                City / Municipality
                            </label>

                            <input
                                type="text"
                                placeholder="City or Municipality"
                                value={
                                    city
                                }
                                onChange={(e) =>
                                    setCity(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    margin:
                                        "8px 0 18px",
                                    boxSizing:
                                        "border-box",
                                }}
                            />


                            <label>
                                Barangay
                            </label>

                            <input
                                type="text"
                                placeholder="Barangay"
                                value={
                                    barangay
                                }
                                onChange={(e) =>
                                    setBarangay(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    margin:
                                        "8px 0 25px",
                                    boxSizing:
                                        "border-box",
                                }}
                            />

                        </section>
                    )}


                    {/* =============================================
                        STEP 2 — DOCUMENTS
                    ============================================= */}

                    {step === 2 && (

                        <section>

                            <h2>
                                2. Upload Required Documents
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#666",
                                }}
                            >
                                Upload clear and
                                readable copies of
                                your required
                                documents.
                            </p>


                            <div
                                style={{
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <label>
                                    <strong>
                                        Student ID — Front
                                    </strong>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange(
                                            e,
                                            setStudentIdFront
                                        )
                                    }
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                    }}
                                />

                                <small>
                                    {getFileName(
                                        studentIdFront
                                    )}
                                </small>

                            </div>


                            <div
                                style={{
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <label>
                                    <strong>
                                        Student ID — Back
                                    </strong>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange(
                                            e,
                                            setStudentIdBack
                                        )
                                    }
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                    }}
                                />

                                <small>
                                    {getFileName(
                                        studentIdBack
                                    )}
                                </small>

                            </div>


                            <div
                                style={{
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <label>
                                    <strong>
                                        Enrollment Proof
                                    </strong>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange(
                                            e,
                                            setEnrollmentProof
                                        )
                                    }
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                    }}
                                />

                                <small>
                                    {getFileName(
                                        enrollmentProof
                                    )}
                                </small>

                            </div>


                            <div
                                style={{
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <label>
                                    <strong>
                                        Other Supporting Document
                                        (Optional)
                                    </strong>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange(
                                            e,
                                            setOtherDocument
                                        )
                                    }
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                    }}
                                />

                                <small>
                                    {getFileName(
                                        otherDocument
                                    )}
                                </small>

                            </div>

                        </section>
                    )}


                    {/* =============================================
                        STEP 3 — REAL-TIME SELFIE
                    ============================================= */}

                    {step === 3 && (

                        <section>

                            <h2>
                                3. Real-Time Selfie
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#666",
                                }}
                            >
                                Take a real-time
                                photo using your
                                camera. Please do
                                not upload an
                                existing photo.
                            </p>


                            {cameraError && (
                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        marginBottom:
                                            "15px",
                                        background:
                                            "#ffecec",
                                        color:
                                            "#c62828",
                                        borderRadius:
                                            "8px",
                                    }}
                                >
                                    {
                                        cameraError
                                    }
                                </div>
                            )}


                            <div
                                style={{
                                    maxWidth:
                                        "500px",
                                    margin:
                                        "20px auto",
                                    textAlign:
                                        "center",
                                }}
                            >

                                {!selfie && (
                                    <video
                                        ref={
                                            videoRef
                                        }
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{
                                            width:
                                                "100%",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#111",
                                        }}
                                    />
                                )}


                                {selfie && (
                                    <img
                                        src={
                                            URL.createObjectURL(
                                                selfie
                                            )
                                        }
                                        alt="Captured selfie"
                                        style={{
                                            width:
                                                "100%",
                                            borderRadius:
                                                "10px",
                                        }}
                                    />
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

                            </div>


                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap:
                                        "10px",
                                    justifyContent:
                                        "center",
                                    flexWrap:
                                        "wrap",
                                }}
                            >

                                {!cameraActive &&
                                    !selfie && (

                                        <button
                                            type="button"
                                            onClick={
                                                startCamera
                                            }
                                            style={{
                                                padding:
                                                    "12px 20px",
                                                cursor:
                                                    "pointer",
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
                                        style={{
                                            padding:
                                                "12px 20px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        📸 Capture Selfie
                                    </button>
                                )}


                                {selfie && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelfie(
                                                null
                                            );
                                            startCamera();
                                        }}
                                        style={{
                                            padding:
                                                "12px 20px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        Retake Selfie
                                    </button>
                                )}

                            </div>

                        </section>
                    )}


                    {/* =============================================
                        STEP 4 — REVIEW
                    ============================================= */}

                    {step === 4 && (

                        <section>

                            <h2>
                                4. Review & Submit
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#666",
                                }}
                            >
                                Please review your
                                information before
                                submitting your
                                application.
                            </p>


                            <div
                                style={{
                                    padding:
                                        "18px",
                                    background:
                                        "#f7f9fc",
                                    borderRadius:
                                        "10px",
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <h3>
                                    Student Information
                                </h3>

                                <p>
                                    <strong>
                                        Student ID:
                                    </strong>{" "}
                                    {studentId}
                                </p>

                                <p>
                                    <strong>
                                        Name:
                                    </strong>{" "}
                                    {fullName}
                                </p>

                                <p>
                                    <strong>
                                        Year Level:
                                    </strong>{" "}
                                    {yearLevel}
                                </p>

                                <p>
                                    <strong>
                                        Email:
                                    </strong>{" "}
                                    {email}
                                </p>

                                <p>
                                    <strong>
                                        Birthday:
                                    </strong>{" "}
                                    {birthday}
                                </p>

                                <p>
                                    <strong>
                                        Contact:
                                    </strong>{" "}
                                    {contactNumber}
                                </p>

                                <p>
                                    <strong>
                                        Address:
                                    </strong>{" "}
                                    {[
                                        barangay,
                                        city,
                                        province,
                                    ]
                                        .filter(
                                            Boolean
                                        )
                                        .join(
                                            ", "
                                        )}
                                </p>

                            </div>


                            <div
                                style={{
                                    padding:
                                        "18px",
                                    background:
                                        "#f7f9fc",
                                    borderRadius:
                                        "10px",
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <h3>
                                    Documents
                                </h3>

                                <p>
                                    ✓ Student ID
                                    Front
                                </p>

                                <p>
                                    ✓ Student ID
                                    Back
                                </p>

                                <p>
                                    ✓ Enrollment
                                    Proof
                                </p>

                                {otherDocument && (
                                    <p>
                                        ✓ Other
                                        Supporting
                                        Document
                                    </p>
                                )}

                            </div>


                            <div
                                style={{
                                    padding:
                                        "18px",
                                    background:
                                        "#eaf8ef",
                                    borderRadius:
                                        "10px",
                                    marginBottom:
                                        "20px",
                                }}
                            >

                                <h3>
                                    Identity Verification
                                </h3>

                                <p>
                                    ✓ Real-time
                                    selfie captured
                                </p>

                            </div>


                            <div
                                style={{
                                    padding:
                                        "15px",
                                    background:
                                        "#fff8e1",
                                    borderRadius:
                                        "8px",
                                    border:
                                        "1px solid #ffe082",
                                }}
                            >

                                <strong>
                                    Important:
                                </strong>

                                <p
                                    style={{
                                        marginBottom:
                                            0,
                                    }}
                                >
                                    Submitting this
                                    application does
                                    not mean you are
                                    already approved.
                                    Your registration
                                    will be reviewed
                                    by the Electoral
                                    Board/Admin.
                                </p>

                            </div>

                        </section>
                    )}


                    {/* =================================================
                        NAVIGATION BUTTONS
                    ================================================= */}

                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            marginTop:
                                "30px",
                            gap:
                                "10px",
                        }}
                    >

                        {step > 1 ? (

                            <button
                                type="button"
                                onClick={
                                    handleBack
                                }
                                disabled={
                                    loading
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ← Back
                            </button>

                        ) : (

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/"
                                    )
                                }
                                disabled={
                                    loading
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        )}


                        {step < 4 ? (

                            <button
                                type="button"
                                onClick={
                                    handleNext
                                }
                                disabled={
                                    loading
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    cursor:
                                        "pointer",
                                    background:
                                        "#1769ff",
                                    color:
                                        "#ffffff",
                                    border:
                                        "none",
                                    borderRadius:
                                        "6px",
                                }}
                            >
                                Continue →
                            </button>

                        ) : (

                            <button
                                type="submit"
                                disabled={
                                    loading
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    cursor:
                                        loading
                                            ? "not-allowed"
                                            : "pointer",
                                    background:
                                        "#16a05d",
                                    color:
                                        "#ffffff",
                                    border:
                                        "none",
                                    borderRadius:
                                        "6px",
                                }}
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit Registration"}
                            </button>
                        )}

                    </div>

                </form>

            </div>

        </div>
    );
};


// =========================================================
// DEFAULT EXPORT
// =========================================================

export default StudentRegistration;