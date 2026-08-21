import React, {
    useRef,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    uploadProfilePicture,
} from "../../services/authService";


const UploadProfilePicture = () => {

    const navigate = useNavigate();

    const fileInputRef =
        useRef(null);

    const videoRef =
        useRef(null);

    const canvasRef =
        useRef(null);

    const [image, setImage] =
        useState(null);

    const [cameraOpen, setCameraOpen] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const token =
        localStorage.getItem(
            "votaraToken"
        );


    // ==========================================
    // SELECT IMAGE
    // ==========================================

    const handleFileChange = (e) => {

        const file =
            e.target.files?.[0];

        if (!file) return;

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

            setImage(
                reader.result
            );

            setError("");

        };

        reader.readAsDataURL(file);
    };


    // ==========================================
    // OPEN CAMERA
    // ==========================================

    const openCamera = async () => {

        try {

            setError("");

            setCameraOpen(true);

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                    }
                );

            if (videoRef.current) {

                videoRef.current.srcObject =
                    stream;

            }

        } catch (error) {

            console.error(error);

            setCameraOpen(false);

            setError(
                "Unable to access your camera. Please allow camera permission."
            );
        }
    };


    // ==========================================
    // TAKE PHOTO
    // ==========================================

    const takePhoto = () => {

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;

        if (!video || !canvas) {
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

        const photo =
            canvas.toDataURL(
                "image/jpeg",
                0.8
            );

        setImage(photo);

        // Stop camera
        const stream =
            video.srcObject;

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );
        }

        video.srcObject = null;

        setCameraOpen(false);
    };


    // ==========================================
    // SAVE PROFILE PICTURE
    // ==========================================

    const handleNext = async () => {

        if (!token) {

            setError(
                "Your session has expired. Please login again."
            );

            return;
        }

        if (!image) {

            setError(
                "Please take or upload a profile picture."
            );

            return;
        }

        try {

            setLoading(true);

            await uploadProfilePicture(
                token,
                image
            );

            navigate(
                "/student-dashboard"
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "#ffffff",
                fontFamily:
                    "Poppins, sans-serif",
                padding: "50px",
            }}
        >

            <div
                style={{
                    maxWidth: "700px",
                    margin: "0 auto",
                }}
            >

                <h1
                    style={{
                        color:
                            "#1455ff",
                        marginBottom:
                            "50px",
                    }}
                >
                    ◈ Votara
                </h1>


                <div
                    style={{
                        textAlign:
                            "center",
                    }}
                >

                    <h2>
                        Take or Upload your
                        Profile Picture
                    </h2>


                    {error && (
                        <p
                            style={{
                                color:
                                    "red",
                            }}
                        >
                            {error}
                        </p>
                    )}


                    {/* CAMERA */}

                    {cameraOpen && (

                        <div>

                            <video
                                ref={
                                    videoRef
                                }
                                autoPlay
                                playsInline
                                style={{
                                    width:
                                        "300px",
                                    borderRadius:
                                        "50%",
                                    objectFit:
                                        "cover",
                                }}
                            />

                            <br />

                            <button
                                onClick={
                                    takePhoto
                                }
                                style={{
                                    marginTop:
                                        "20px",
                                    padding:
                                        "12px 25px",
                                    background:
                                        "#1455ff",
                                    color:
                                        "white",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                }}
                            >
                                Take Photo
                            </button>

                        </div>
                    )}


                    {/* PREVIEW */}

                    {!cameraOpen && (

                        <div
                            style={{
                                margin:
                                    "30px auto",
                            }}
                        >

                            {image ? (

                                <img
                                    src={image}
                                    alt="Profile Preview"
                                    style={{
                                        width:
                                            "180px",
                                        height:
                                            "180px",
                                        objectFit:
                                            "cover",
                                        borderRadius:
                                            "50%",
                                    }}
                                />

                            ) : (

                                <div
                                    style={{
                                        width:
                                            "180px",
                                        height:
                                            "180px",
                                        borderRadius:
                                            "50%",
                                        background:
                                            "#e9ddff",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        margin:
                                            "0 auto",
                                        fontSize:
                                            "60px",
                                    }}
                                >
                                    👤
                                </div>

                            )}

                        </div>
                    )}


                    {!cameraOpen && (

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "center",
                                gap:
                                    "10px",
                            }}
                        >

                            <button
                                onClick={
                                    openCamera
                                }
                                style={{
                                    padding:
                                        "10px 20px",
                                    background:
                                        "white",
                                    border:
                                        "1px solid #aaa",
                                    borderRadius:
                                        "8px",
                                }}
                            >
                                Take Photo
                            </button>


                            <button
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                style={{
                                    padding:
                                        "10px 20px",
                                    background:
                                        "white",
                                    border:
                                        "1px solid #aaa",
                                    borderRadius:
                                        "8px",
                                }}
                            >
                                Upload Photo
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


                    <div
                        style={{
                            marginTop:
                                "30px",
                        }}
                    >

                        <button
                            onClick={() =>
                                navigate(
                                    "/student-login"
                                )
                            }
                            style={{
                                padding:
                                    "10px 40px",
                                marginRight:
                                    "10px",
                                border:
                                    "1px solid #aaa",
                                borderRadius:
                                    "20px",
                                background:
                                    "white",
                            }}
                        >
                            Back
                        </button>


                        <button
                            onClick={
                                handleNext
                            }
                            disabled={
                                loading
                            }
                            style={{
                                padding:
                                    "10px 40px",
                                border:
                                    "none",
                                borderRadius:
                                    "20px",
                                background:
                                    "#1455ff",
                                color:
                                    "white",
                            }}
                        >
                            {loading
                                ? "Saving..."
                                : "NEXT"}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default UploadProfilePicture;