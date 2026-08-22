import React, {
    useRef,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    uploadProfilePicture
} from "../../services/authService";


const UploadProfilePicture = () => {

    const navigate =
        useNavigate();

    const fileInputRef =
        useRef(null);

    const videoRef =
        useRef(null);

    const canvasRef =
        useRef(null);


    const [
        preview,
        setPreview
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        cameraOpen,
        setCameraOpen
    ] = useState(false);


    const [
        stream,
        setStream
    ] = useState(null);


    const token =
        localStorage.getItem(
            "votaraToken"
        );


    // =====================================================
    // FILE UPLOAD
    // =====================================================

    const handleFileChange = (e) => {

        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            setError(
                "Please select an image file."
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload = () => {

            setPreview(
                reader.result
            );

            setError("");
        };


        reader.readAsDataURL(file);
    };


    // =====================================================
    // OPEN CAMERA
    // =====================================================

    const openCamera = async () => {

        try {

            setError("");

            const mediaStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: false,
                    }
                );


            setStream(
                mediaStream
            );

            setCameraOpen(
                true
            );


            setTimeout(() => {

                if (
                    videoRef.current
                ) {

                    videoRef.current.srcObject =
                        mediaStream;

                }

            }, 100);

        } catch (error) {

            console.error(
                error
            );

            setError(
                "Unable to access your camera. Please allow camera permission or upload a photo instead."
            );
        }
    };


    // =====================================================
    // TAKE PHOTO
    // =====================================================

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


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const image =
            canvas.toDataURL(
                "image/png"
            );


        setPreview(
            image
        );


        closeCamera();
    };


    // =====================================================
    // CLOSE CAMERA
    // =====================================================

    const closeCamera = () => {

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );
        }


        setStream(null);

        setCameraOpen(
            false
        );
    };


    // =====================================================
    // SUBMIT PHOTO
    // =====================================================

    const handleSubmit = async () => {

        setError("");


        if (!token) {

            setError(
                "Your login session has expired. Please login again."
            );

            return;
        }


        if (!preview) {

            setError(
                "Please take or upload a profile photo first."
            );

            return;
        }


        try {

            setLoading(true);


            const data =
                await uploadProfilePicture(
                    token,
                    preview
                );


            // Update stored student
            // information

            const storedStudent =
                localStorage.getItem(
                    "votaraStudent"
                );


            if (
                storedStudent
            ) {

                const student =
                    JSON.parse(
                        storedStudent
                    );


                student.profilePicture =
                    data.profilePicture;


                localStorage.setItem(
                    "votaraStudent",
                    JSON.stringify(
                        student
                    )
                );
            }


            // Go to dashboard

            navigate(
                "/student-dashboard",
                {
                    replace: true
                }
            );

        } catch (error) {

            console.error(
                "❌ Profile picture error:",
                error
            );

            setError(
                error.message ||
                "Unable to upload profile picture."
            );

        } finally {

            setLoading(false);
        }
    };


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
                        "500px",

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

                    textAlign:
                        "center",
                }}
            >

                <h1>
                    Profile Photo
                </h1>


                <p
                    style={{
                        color:
                            "#666",

                        lineHeight:
                            "1.6",

                        marginBottom:
                            "25px",
                    }}
                >
                    Take a photo or upload
                    your photo to complete
                    your account setup.
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

                            textAlign:
                                "left",
                        }}
                    >
                        {error}
                    </div>

                )}


                {/* CAMERA */}

                {cameraOpen && (

                    <div
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >

                        <video
                            ref={
                                videoRef
                            }
                            autoPlay
                            playsInline
                            style={{
                                width:
                                    "100%",

                                borderRadius:
                                    "12px",

                                background:
                                    "#000",
                            }}
                        />


                        <div
                            style={{
                                display:
                                    "flex",

                                gap:
                                    "10px",

                                marginTop:
                                    "15px",
                            }}
                        >

                            <button
                                type="button"
                                onClick={
                                    takePhoto
                                }
                                style={{
                                    flex:
                                        1,

                                    padding:
                                        "12px",

                                    border:
                                        "none",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "#1455ff",

                                    color:
                                        "#fff",

                                    fontWeight:
                                        "600",
                                }}
                            >
                                📷 Take Photo
                            </button>


                            <button
                                type="button"
                                onClick={
                                    closeCamera
                                }
                                style={{
                                    flex:
                                        1,

                                    padding:
                                        "12px",

                                    border:
                                        "1px solid #ccc",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "#fff",
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                )}


                {/* PREVIEW */}

                {preview && !cameraOpen && (

                    <div
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >

                        <img
                            src={
                                preview
                            }
                            alt="Profile preview"
                            style={{
                                width:
                                    "180px",

                                height:
                                    "180px",

                                objectFit:
                                    "cover",

                                borderRadius:
                                    "50%",

                                border:
                                    "4px solid #1455ff",
                            }}
                        />

                    </div>

                )}


                {/* BUTTONS */}

                {!cameraOpen && (

                    <>

                        <button
                            type="button"
                            onClick={
                                openCamera
                            }
                            style={{
                                width:
                                    "100%",

                                padding:
                                    "13px",

                                marginBottom:
                                    "12px",

                                border:
                                    "none",

                                borderRadius:
                                    "8px",

                                background:
                                    "#1455ff",

                                color:
                                    "#fff",

                                fontWeight:
                                    "600",

                                fontSize:
                                    "15px",
                            }}
                        >
                            📷 Take a Photo
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            style={{
                                width:
                                    "100%",

                                padding:
                                    "13px",

                                border:
                                    "1px solid #1455ff",

                                borderRadius:
                                    "8px",

                                background:
                                    "#fff",

                                color:
                                    "#1455ff",

                                fontWeight:
                                    "600",

                                fontSize:
                                    "15px",

                                marginBottom:
                                    "20px",
                            }}
                        >
                            📁 Upload Photo
                        </button>


                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="image/*"
                            onChange={
                                handleFileChange
                            }
                            style={{
                                display:
                                    "none",
                            }}
                        />

                    </>

                )}


                {/* CONTINUE */}

                <button
                    type="button"
                    onClick={
                        handleSubmit
                    }
                    disabled={
                        loading ||
                        !preview
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
                            loading ||
                            !preview
                                ? "#aebbdc"
                                : "#159447",

                        color:
                            "#fff",

                        fontWeight:
                            "600",

                        fontSize:
                            "15px",

                        cursor:
                            loading ||
                            !preview
                                ? "not-allowed"
                                : "pointer",
                    }}
                >

                    {loading
                        ? "Saving Photo..."
                        : "Continue to Dashboard"}

                </button>


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

        </div>
    );
};


export default UploadProfilePicture;