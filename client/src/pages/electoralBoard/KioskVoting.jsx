import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    verifyKioskStudent,
    authorizeKioskStudent,
    submitKioskRegistration,
    approveKioskRegistration,
    setKioskPersonalPassword,
    getActiveKioskSession,
} from "../../services/kioskService";

import {
    getElectionConfiguration,
} from "../../services/electionService";

import {
    submitVote,
    checkVoteStatus,
} from "../../services/votingService";

import "./KioskVoting.css";


// =====================================================
// CONSTANTS
// =====================================================

const YEARS = [
    "2nd Year",
    "3rd Year",
    "4th Year",
];


// =====================================================
// FILE READER
// =====================================================

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onload = () =>
            resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });


// =====================================================
// YEAR NORMALIZATION
// =====================================================

const normalizeYear = (value) => {

    const raw =
        String(value || "")
            .trim()
            .toLowerCase();

    if (
        raw.includes("2nd") ||
        raw === "2"
    ) {
        return "2nd Year";
    }

    if (
        raw.includes("3rd") ||
        raw === "3"
    ) {
        return "3rd Year";
    }

    if (
        raw.includes("4th") ||
        raw === "4"
    ) {
        return "4th Year";
    }

    return value;
};


// =====================================================
// POSITION YEAR ACCESS
// =====================================================

const getPositionYearAccess = (
    position
) => {

    const direct =
        position?.yearLevels ||
        position?.year_level_access ||
        position?.position_year_levels ||
        [];

    const values =
        Array.isArray(direct)
            ? direct.map(
                (item) =>
                    normalizeYear(
                        item?.year_level ||
                        item
                    )
            )
            : [];

    if (values.length) {
        return values;
    }

    const name =
        String(
            position?.name || ""
        ).toLowerCase();

    if (
        name.includes(
            "2nd year representative"
        )
    ) {
        return ["2nd Year"];
    }

    if (
        name.includes(
            "3rd year representative"
        )
    ) {
        return ["3rd Year"];
    }

    if (
        name.includes(
            "4th year representative"
        )
    ) {
        return ["4th Year"];
    }

    return YEARS;
};


// =====================================================
// NORMALIZE POSITIONS
// =====================================================

const normalizePositions = (
    configuration
) => {

    const raw =
        configuration?.positions ||
        configuration?.election?.positions ||
        [];

    return raw
        .filter(
            (position) =>
                position?.is_active !== false
        )
        .map(
            (position) => ({
                ...position,

                candidates: (
                    position?.candidates ||
                    position?.candidate_list ||
                    []
                ).filter(
                    (candidate) =>
                        candidate?.is_active !== false
                ),
            })
        )
        .sort(
            (a, b) =>
                Number(
                    a.display_order || 0
                ) -
                Number(
                    b.display_order || 0
                )
        );
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function KioskVoting() {

    const navigate =
        useNavigate();

    const [searchParams] =
        useSearchParams();


    // =================================================
    // SESSION URL
    // =================================================

    const sessionIdFromUrl =
        searchParams.get(
            "sessionId"
        ) || "";


    // =================================================
    // CAMERA REFERENCES
    // =================================================

    const selfieVideoRef =
        useRef(null);

    const selfieCanvasRef =
        useRef(null);

    const selfieStreamRef =
        useRef(null);


    // =================================================
    // CAMERA STATE
    // =================================================

    const [
        cameraActive,
        setCameraActive,
    ] = useState(false);

    const [
        selfiePreview,
        setSelfiePreview,
    ] = useState("");


    // =================================================
    // GENERAL STATE
    // =================================================

    const [
        session,
        setSession,
    ] = useState(null);

    const [
        studentId,
        setStudentId,
    ] = useState("");

    const [
        student,
        setStudent,
    ] = useState(null);

    const [
        verification,
        setVerification,
    ] = useState(null);

    const [
        step,
        setStep,
    ] = useState("student");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");


    // =================================================
    // REGISTRATION STATE
    // =================================================

    const [
        registration,
        setRegistration,
    ] = useState({

        fullName: "",

        yearLevel: "",

        email: "",

        studentIdFront: null,

        studentIdBack: null,

        enrollmentProof: null,

        selfie: null,
    });


    // =================================================
    // REGISTRATION REVIEW
    // =================================================

    const [
        registrationReview,
        setRegistrationReview,
    ] = useState(null);


    // =================================================
    // ACTIVATION / PASSWORD
    // =================================================

    const [
        activationToken,
        setActivationToken,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");


    // =================================================
    // ELECTION
    // =================================================

    const [
        election,
        setElection,
    ] = useState(null);

    const [
        positions,
        setPositions,
    ] = useState([]);

    const [
        selections,
        setSelections,
    ] = useState({});

    const [
        submittedBallot,
        setSubmittedBallot,
    ] = useState(null);


    // =================================================
    // ELIGIBLE POSITIONS
    // =================================================

    const eligiblePositions =
        useMemo(() => {

            if (!student?.yearLevel) {
                return [];
            }

            return positions.filter(
                (position) =>
                    getPositionYearAccess(
                        position
                    ).includes(
                        student.yearLevel
                    )
            );

        }, [
            positions,
            student,
        ]);


    const requiredPositions =
        eligiblePositions.filter(
            (position) =>
                position.is_required !== false
        );


    // =================================================
    // INITIALIZE
    // =================================================

    useEffect(() => {

        initialize();

    }, []);


    // =================================================
    // CAMERA CLEANUP
    // =================================================

    useEffect(() => {

        return () => {

            if (
                selfieStreamRef.current
            ) {

                selfieStreamRef.current
                    .getTracks()
                    .forEach(
                        (track) =>
                            track.stop()
                    );

                selfieStreamRef.current =
                    null;
            }

        };

    }, []);


    // =================================================
    // BACK TO KIOSK MANAGEMENT
    // =================================================

    const handleBackToKioskManagement =
        () => {

            // Stop camera first.
            stopSelfieCamera();


            // When Kiosk Management opened
            // this page in a new tab.
            if (
                window.opener &&
                !window.opener.closed
            ) {

                window.close();

                return;
            }


            // Fallback when opened directly.
            if (
                window.history.length > 1
            ) {

                navigate(-1);

                return;
            }


            navigate(
                "/electoral-board/dashboard"
            );
        };


    // =================================================
    // INITIALIZE KIOSK SESSION
    // =================================================

    const initialize =
        async () => {

            try {

                setLoading(true);

                setError("");


                const response =
                    await getActiveKioskSession();

                const active =
                    response?.session;


                if (!active) {

                    throw new Error(
                        "There is no active kiosk session. Please return to Kiosk Management."
                    );
                }


                if (
                    sessionIdFromUrl &&
                    active.id !==
                        sessionIdFromUrl
                ) {

                    throw new Error(
                        "This kiosk session is no longer the active session for this Electoral Board account."
                    );
                }


                setSession(active);

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    err.message ||
                    "Unable to open the student kiosk."
                );

            } finally {

                setLoading(false);
            }
        };


    // =================================================
    // CLEAR STUDENT SESSION
    // =================================================

    const clearStudentSession =
        () => {

            // Make sure camera is stopped.
            stopSelfieCamera();


            localStorage.removeItem(
                "votaraKioskToken"
            );

            localStorage.removeItem(
                "votaraKioskStudent"
            );

            localStorage.removeItem(
                "votaraKioskElectionId"
            );

            localStorage.removeItem(
                "votaraKioskSessionId"
            );

            localStorage.removeItem(
                "votaraKioskMode"
            );


            setStudent(null);

            setVerification(null);

            setSelections({});

            setElection(null);

            setPositions([]);

            setSubmittedBallot(null);

            setRegistrationReview(null);

            setActivationToken("");

            setPassword("");

            setConfirmPassword("");

            setSelfiePreview("");

            setRegistration({
                fullName: "",
                yearLevel: "",
                email: "",
                studentIdFront: null,
                studentIdBack: null,
                enrollmentProof: null,
                selfie: null,
            });

            setStep("student");

            setStudentId("");

            setSuccess("");

            setError("");
        };


    // =================================================
    // VERIFY STUDENT
    // =================================================

    const handleVerifyStudent =
        async (event) => {

            event.preventDefault();


            if (!session?.id) {

                setError(
                    "No active kiosk session is available."
                );

                return;
            }


            if (!studentId.trim()) {

                setError(
                    "Please enter the student's Student ID."
                );

                return;
            }


            try {

                setActionLoading(true);

                setError("");

                setSuccess("");


                const response =
                    await verifyKioskStudent(
                        session.id,
                        studentId.trim()
                    );


                setStudent(
                    response.student
                );

                setVerification(
                    response
                );


                if (
                    response.accountExists
                ) {

                    setStep("verified");

                } else {

                    setRegistration(
                        (current) => ({
                            ...current,

                            fullName:
                                response
                                    .student
                                    ?.fullName ||
                                "",

                            yearLevel:
                                response
                                    .student
                                    ?.yearLevel ||
                                "",
                        })
                    );

                    setStep("register");
                }

            } catch (err) {

                const code =
                    err?.response
                        ?.data?.code;


                if (
                    code ===
                    "STUDENT_NOT_FOUND"
                ) {

                    setRegistration(
                        (current) => ({
                            ...current,
                            fullName: "",
                            yearLevel: "",
                        })
                    );

                    setStep("register");
                }


                setError(
                    err?.response?.data?.message ||
                    "Unable to verify this student."
                );

            } finally {

                setActionLoading(false);
            }
        };


    // =================================================
    // AUTHORIZE STUDENT
    // =================================================

    const authorizeStudent =
        async () => {

            try {

                setActionLoading(true);

                setError("");


                const response =
                    await authorizeKioskStudent(
                        session.id,
                        student.studentId
                    );


                activateKioskToken(
                    response
                );


                await loadVotingConfiguration(
                    response.electionId,
                    response.student
                );

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to authorize this student for voting."
                );

            } finally {

                setActionLoading(false);
            }
        };


    // =================================================
    // ACTIVATE KIOSK TOKEN
    // =================================================

    const activateKioskToken =
        (response) => {

            localStorage.setItem(
                "votaraKioskToken",
                response.token
            );

            localStorage.setItem(
                "votaraKioskMode",
                "true"
            );

            localStorage.setItem(
                "votaraKioskStudent",
                JSON.stringify(
                    response.student
                )
            );

            localStorage.setItem(
                "votaraKioskElectionId",
                response.electionId
            );

            localStorage.setItem(
                "votaraKioskSessionId",
                response.sessionId
            );


            setStudent(
                response.student
            );
        };


    // =================================================
    // LOAD VOTING CONFIGURATION
    // =================================================

    const loadVotingConfiguration =
        async (
            electionId,
            currentStudent = student
        ) => {

            try {

                setActionLoading(true);

                setError("");


                const [
                    configuration,
                    status,
                ] = await Promise.all([

                    getElectionConfiguration(
                        electionId
                    ),

                    checkVoteStatus(
                        electionId
                    ),

                ]);


                if (
                    status?.hasVoted
                ) {

                    throw new Error(
                        "This student has already voted in this election."
                    );
                }


                const normalizedElection =
                    configuration?.election ||
                    configuration;


                const normalizedPositions =
                    normalizePositions(
                        configuration
                    );


                setElection(
                    normalizedElection
                );

                setPositions(
                    normalizedPositions
                );

                setSelections({});

                setStudent(
                    currentStudent
                );

                setStep("vote");

            } catch (err) {

                console.error(err);

                clearStudentSession();

                setError(
                    err?.response?.data?.message ||
                    err.message ||
                    "Unable to load the voting ballot."
                );

            } finally {

                setActionLoading(false);
            }
        };


    // =====================================================
    // START SELFIE CAMERA
    // =====================================================

    const startSelfieCamera =
        async () => {

            try {

                setError("");


                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices
                        .getUserMedia
                ) {

                    setError(
                        "This device or browser does not support camera access."
                    );

                    return;
                }


                // Stop an existing stream first.
                if (
                    selfieStreamRef.current
                ) {

                    selfieStreamRef.current
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop()
                        );

                    selfieStreamRef.current =
                        null;
                }


                const stream =
                    await navigator.mediaDevices
                        .getUserMedia({

                            video: {

                                facingMode:
                                    "user",

                                width: {
                                    ideal: 1280,
                                },

                                height: {
                                    ideal: 720,
                                },
                            },

                            audio: false,
                        });


                selfieStreamRef.current =
                    stream;


                if (
                    selfieVideoRef.current
                ) {

                    selfieVideoRef.current.srcObject =
                        stream;


                    try {

                        await selfieVideoRef
                            .current
                            .play();

                    } catch (playError) {

                        console.warn(
                            "Camera video play warning:",
                            playError
                        );
                    }
                }


                setCameraActive(
                    true
                );

            } catch (cameraError) {

                console.error(
                    "Selfie camera error:",
                    cameraError
                );


                if (
                    cameraError?.name ===
                    "NotAllowedError"
                ) {

                    setError(
                        "Camera permission was denied. Please allow camera access and try again."
                    );

                } else if (
                    cameraError?.name ===
                    "NotFoundError"
                ) {

                    setError(
                        "No camera was found on this device."
                    );

                } else if (
                    cameraError?.name ===
                    "NotReadableError"
                ) {

                    setError(
                        "The camera is currently being used by another application."
                    );

                } else {

                    setError(
                        "Unable to access the camera. Please check the camera permission."
                    );
                }

            }
        };


    // =====================================================
    // STOP SELFIE CAMERA
    // =====================================================

    const stopSelfieCamera =
        () => {

            if (
                selfieStreamRef.current
            ) {

                selfieStreamRef.current
                    .getTracks()
                    .forEach(
                        (track) =>
                            track.stop()
                    );

                selfieStreamRef.current =
                    null;
            }


            if (
                selfieVideoRef.current
            ) {

                selfieVideoRef.current.srcObject =
                    null;
            }


            setCameraActive(
                false
            );
        };


    // =====================================================
    // CAPTURE REAL-TIME SELFIE
    // =====================================================

    const captureSelfie =
        () => {

            const video =
                selfieVideoRef.current;

            const canvas =
                selfieCanvasRef.current;


            if (
                !video ||
                !canvas ||
                video.readyState < 2
            ) {

                setError(
                    "Please wait for the camera to become ready."
                );

                return;
            }


            const width =
                video.videoWidth ||
                1280;

            const height =
                video.videoHeight ||
                720;


            canvas.width =
                width;

            canvas.height =
                height;


            const context =
                canvas.getContext(
                    "2d"
                );


            if (!context) {

                setError(
                    "Unable to capture the selfie."
                );

                return;
            }


            /*
             * Capture the actual camera frame.
             *
             * We do NOT mirror the saved image.
             * The saved selfie therefore matches
             * the actual camera frame.
             */

            context.drawImage(
                video,
                0,
                0,
                width,
                height
            );


            const dataUrl =
                canvas.toDataURL(
                    "image/jpeg",
                    0.9
                );


            const selfieFile = {

                name:
                    `kiosk-selfie-${Date.now()}.jpg`,

                type:
                    "image/jpeg",

                data:
                    dataUrl,
            };


            setRegistration(
                (current) => ({
                    ...current,

                    selfie:
                        selfieFile,
                })
            );


            setSelfiePreview(
                dataUrl
            );


            stopSelfieCamera();

            setError("");
        };


    // =====================================================
    // RETAKE SELFIE
    // =====================================================

    const retakeSelfie =
        () => {

            setRegistration(
                (current) => ({
                    ...current,
                    selfie: null,
                })
            );


            setSelfiePreview(
                ""
            );


            setError("");


            // Give React a moment to remove
            // the old preview before opening
            // the camera again.
            setTimeout(() => {

                startSelfieCamera();

            }, 100);
        };


    // =====================================================
    // REGISTRATION FILE HANDLER
    // =====================================================

    const handleRegistrationFile =
        async (
            field,
            event
        ) => {

            const file =
                event.target
                    .files?.[0];


            if (!file) {
                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setError(
                    "Each registration file must be 5MB or smaller."
                );

                event.target.value =
                    "";

                return;
            }


            try {

                const data =
                    await readFileAsDataUrl(
                        file
                    );


                setRegistration(
                    (current) => ({
                        ...current,

                        [field]: {

                            name:
                                file.name,

                            type:
                                file.type,

                            data,
                        },
                    })
                );

            } catch {

                setError(
                    `Unable to read ${file.name}.`
                );
            }
        };


    // =====================================================
    // SUBMIT REGISTRATION
    // =====================================================

    const submitRegistration =
        async (event) => {

            event.preventDefault();


            if (
                !registration
                    .fullName
                    .trim()
            ) {

                setError(
                    "Full name is required."
                );

                return;
            }


            if (
                !YEARS.includes(
                    registration.yearLevel
                )
            ) {

                setError(
                    "Only 2nd Year, 3rd Year, and 4th Year students are eligible to vote."
                );

                return;
            }


            if (
                !registration.studentIdFront ||
                !registration.studentIdBack ||
                !registration.enrollmentProof ||
                !registration.selfie
            ) {

                setError(
                    "School ID front, School ID back, enrollment proof, and real-time selfie are required."
                );

                return;
            }


            try {

                setActionLoading(true);

                setError("");

                setSuccess("");


                const response =
                    await submitKioskRegistration({

                        sessionId:
                            session.id,

                        studentId:
                            studentId.trim(),

                        fullName:
                            registration
                                .fullName
                                .trim(),

                        yearLevel:
                            registration
                                .yearLevel,

                        email:
                            registration.email
                                .trim() ||
                            null,

                        studentIdFront:
                            registration
                                .studentIdFront,

                        studentIdBack:
                            registration
                                .studentIdBack,

                        enrollmentProof:
                            registration
                                .enrollmentProof,

                        selfie:
                            registration
                                .selfie,
                    });


                setRegistrationReview(
                    response
                );

                setStep(
                    "review-registration"
                );

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to submit assisted registration."
                );

            } finally {

                setActionLoading(
                    false
                );
            }
        };


    // =====================================================
    // APPROVE REGISTRATION
    // =====================================================

    const approveRegistration =
        async () => {

            if (
                !registrationReview
                    ?.registration
                    ?.id
            ) {

                return;
            }


            try {

                setActionLoading(
                    true
                );

                setError("");


                const response =
                    await approveKioskRegistration({

                        registrationId:
                            registrationReview
                                .registration
                                .id,

                        sessionId:
                            session.id,
                    });


                setActivationToken(
                    response.activationToken
                );


                setStudent(
                    response.student
                );


                setSuccess(
                    "Registration approved. The student must create a personal 8-character password before voting."
                );


                setStep(
                    "set-password"
                );

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to approve assisted registration."
                );

            } finally {

                setActionLoading(
                    false
                );
            }
        };


    // =====================================================
    // PASSWORD REQUIREMENTS
    // =====================================================

    const passwordRequirements =
        useMemo(
            () => ({

                length:
                    password.length ===
                    8,

                upper:
                    /[A-Z]/.test(
                        password
                    ),

                lower:
                    /[a-z]/.test(
                        password
                    ),

                number:
                    /[0-9]/.test(
                        password
                    ),

                special:
                    /[^A-Za-z0-9]/.test(
                        password
                    ),

            }),
            [password]
        );


    const passwordValid =
        Object.values(
            passwordRequirements
        ).every(Boolean);


    // =====================================================
    // SET PERSONAL PASSWORD
    // =====================================================

    const setPersonalPassword =
        async (event) => {

            event.preventDefault();


            if (
                !passwordValid
            ) {

                setError(
                    "Password must be exactly 8 characters and include uppercase, lowercase, number, and special character."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                setError(
                    "Passwords do not match."
                );

                return;
            }


            try {

                setActionLoading(
                    true
                );

                setError("");


                const response =
                    await setKioskPersonalPassword(
                        activationToken,
                        password
                    );


                activateKioskToken({

                    token:
                        response.token,

                    student:
                        response.student,

                    electionId:
                        session.election_id,

                    sessionId:
                        session.id,
                });


                setSuccess(
                    "Personal password created successfully. Loading the ballot..."
                );


                await loadVotingConfiguration(
                    session.election_id,
                    response.student
                );

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to set the student's personal password."
                );

            } finally {

                setActionLoading(
                    false
                );
            }
        };


    // =====================================================
    // SELECT CANDIDATE
    // =====================================================

    const selectCandidate =
        (
            positionId,
            candidateId
        ) => {

            setSelections(
                (current) => ({

                    ...current,

                    [positionId]:
                        candidateId,
                })
            );
        };


    // =====================================================
    // SUBMIT VOTE
    // =====================================================

    const submitKioskVote =
        async () => {

            const missing =
                requiredPositions.filter(
                    (position) =>
                        !selections[
                            position.id
                        ]
                );


            if (missing.length) {

                setError(
                    `Please select a candidate for: ${missing
                        .map(
                            (position) =>
                                position.name
                        )
                        .join(", ")}.`
                );

                return;
            }


            try {

                setActionLoading(
                    true
                );

                setError("");

                setSuccess("");


                const formattedSelections =
                    eligiblePositions

                        .filter(
                            (position) =>
                                selections[
                                    position.id
                                ]
                        )

                        .map(
                            (position) => ({

                                positionId:
                                    position.id,

                                candidateId:
                                    selections[
                                        position.id
                                    ],

                            })
                        );


                const response =
                    await submitVote(
                        session.election_id,
                        formattedSelections
                    );


                setSubmittedBallot(
                    response
                );


                setStep(
                    "complete"
                );

            } catch (err) {

                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to submit the ballot."
                );

            } finally {

                setActionLoading(
                    false
                );
            }
        };


    // =====================================================
    // NEXT STUDENT
    // =====================================================

    const nextStudent =
        () => {

            stopSelfieCamera();

            clearStudentSession();

            initialize();
        };


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (

            <div className="kiosk-voting-page kiosk-voting-center">

                <div className="kiosk-voting-card">

                    <div className="kiosk-voting-icon">
                        🖥️
                    </div>

                    <h1>
                        Opening Student Kiosk
                    </h1>

                    <p>
                        Checking the active Electoral Board kiosk session...
                    </p>

                    <div className="kiosk-voting-spinner" />

                </div>

            </div>
        );
    }


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div className="kiosk-voting-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="kiosk-voting-header">

                <button
                    type="button"
                    className="kiosk-back-button"
                    onClick={
                        handleBackToKioskManagement
                    }
                    aria-label="Back to Kiosk Management"
                >

                    <span className="kiosk-back-arrow">
                        ←
                    </span>

                    <span>
                        Back to Kiosk Management
                    </span>

                </button>


                <div className="kiosk-voting-header-info">

                    <div className="kiosk-voting-brand">
                        VOTARA
                    </div>

                    <h1>
                        Student Voting Kiosk
                    </h1>

                    <p>
                        {
                            session?.elections
                                ?.title ||
                            "Election"
                        }
                    </p>

                </div>


                <div className="kiosk-session-pill">

                    <span />

                    ACTIVE SESSION

                </div>

            </header>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="kiosk-voting-main">


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="kiosk-voting-alert error">

                        <span>
                            !
                        </span>

                        <div>
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (

                    <div className="kiosk-voting-alert success">

                        <span>
                            ✓
                        </span>

                        <div>
                            {success}
                        </div>

                    </div>

                )}


                {/* =================================================
                    STUDENT ID
                ================================================= */}

                {step === "student" && (

                    <section className="kiosk-voting-card kiosk-id-card">

                        <div className="kiosk-voting-icon">
                            🎓
                        </div>

                        <h2>
                            Enter Student ID
                        </h2>

                        <p>
                            Ask the student to enter their Student ID before proceeding.
                        </p>


                        <form
                            onSubmit={
                                handleVerifyStudent
                            }
                        >

                            <input
                                value={
                                    studentId
                                }
                                onChange={
                                    (event) =>
                                        setStudentId(
                                            event.target
                                                .value
                                        )
                                }
                                placeholder="Student ID"
                                autoFocus
                                disabled={
                                    actionLoading
                                }
                            />


                            <button
                                type="submit"
                                className="kiosk-main-button"
                                disabled={
                                    actionLoading
                                }
                            >

                                {
                                    actionLoading
                                        ? "Verifying..."
                                        : "Verify Student"
                                }

                            </button>

                        </form>

                    </section>

                )}


                {/* =================================================
                    VERIFIED STUDENT
                ================================================= */}

                {step === "verified" &&
                    student && (

                        <section className="kiosk-voting-card">

                            <div className="kiosk-card-heading">

                                <div>

                                    <span className="kiosk-eyebrow">
                                        STUDENT VERIFIED
                                    </span>

                                    <h2>
                                        {
                                            student.fullName
                                        }
                                    </h2>

                                    <p>
                                        {
                                            student.studentId
                                        }

                                        {" · "}

                                        {
                                            student.yearLevel
                                        }
                                    </p>

                                </div>


                                <span className="kiosk-check">
                                    ✓
                                </span>

                            </div>


                            <div className="kiosk-verification-grid">

                                <div>

                                    <span>
                                        Election
                                    </span>

                                    <strong>
                                        {
                                            session
                                                ?.elections
                                                ?.title
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Eligibility
                                    </span>

                                    <strong>
                                        Eligible to vote
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Voting status
                                    </span>

                                    <strong>
                                        Not yet voted
                                    </strong>

                                </div>

                            </div>


                            <div className="kiosk-action-row">

                                <button
                                    type="button"
                                    className="kiosk-secondary-button"
                                    onClick={
                                        clearStudentSession
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="kiosk-main-button"
                                    onClick={
                                        authorizeStudent
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >

                                    {
                                        actionLoading
                                            ? "Authorizing..."
                                            : "Continue to Vote"
                                    }

                                </button>

                            </div>

                        </section>

                    )}


                {/* =================================================
                    ASSISTED REGISTRATION
                ================================================= */}

                {step === "register" && (

                    <section className="kiosk-voting-card">

                        <div className="kiosk-card-heading">

                            <div>

                                <span className="kiosk-eyebrow">
                                    ASSISTED REGISTRATION
                                </span>

                                <h2>
                                    Register Student In Person
                                </h2>

                                <p>
                                    No existing VOTARA account was found. Complete the required verification documents.
                                </p>

                            </div>

                        </div>


                        <form
                            className="kiosk-registration-form"
                            onSubmit={
                                submitRegistration
                            }
                        >


                            {/* =========================================
                                STUDENT INFORMATION
                            ========================================= */}

                            <div className="kiosk-form-grid">

                                <label>

                                    Student ID

                                    <input
                                        value={
                                            studentId
                                        }
                                        disabled
                                    />

                                </label>


                                <label>

                                    Full Name

                                    <input
                                        value={
                                            registration
                                                .fullName
                                        }
                                        onChange={
                                            (event) =>
                                                setRegistration(
                                                    {
                                                        ...registration,
                                                        fullName:
                                                            event
                                                                .target
                                                                .value,
                                                    }
                                                )
                                        }
                                        required
                                    />

                                </label>


                                <label>

                                    Year Level

                                    <select
                                        value={
                                            registration
                                                .yearLevel
                                        }
                                        onChange={
                                            (event) =>
                                                setRegistration(
                                                    {
                                                        ...registration,
                                                        yearLevel:
                                                            event
                                                                .target
                                                                .value,
                                                    }
                                                )
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select year level
                                        </option>

                                        {YEARS.map(
                                            (year) => (

                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {
                                                        year
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </label>


                                <label>

                                    Email (optional)

                                    <input
                                        type="email"
                                        value={
                                            registration
                                                .email
                                        }
                                        onChange={
                                            (event) =>
                                                setRegistration(
                                                    {
                                                        ...registration,
                                                        email:
                                                            event
                                                                .target
                                                                .value,
                                                    }
                                                )
                                        }
                                        placeholder="Optional for assisted kiosk registration"
                                    />

                                </label>

                            </div>


                            {/* =========================================
                                DOCUMENTS
                            ========================================= */}

                            <div className="kiosk-doc-grid">


                                {/* =====================================
                                    SCHOOL ID FRONT
                                ===================================== */}

                                <label className="kiosk-file-box">

                                    <span>
                                        School ID - Front
                                    </span>

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,application/pdf"
                                        onChange={
                                            (event) =>
                                                handleRegistrationFile(
                                                    "studentIdFront",
                                                    event
                                                )
                                        }
                                        required
                                    />

                                    <small>
                                        {
                                            registration
                                                .studentIdFront
                                                ?.name ||
                                            "Choose file · max 5MB"
                                        }
                                    </small>

                                </label>


                                {/* =====================================
                                    SCHOOL ID BACK
                                ===================================== */}

                                <label className="kiosk-file-box">

                                    <span>
                                        School ID - Back
                                    </span>

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,application/pdf"
                                        onChange={
                                            (event) =>
                                                handleRegistrationFile(
                                                    "studentIdBack",
                                                    event
                                                )
                                        }
                                        required
                                    />

                                    <small>
                                        {
                                            registration
                                                .studentIdBack
                                                ?.name ||
                                            "Choose file · max 5MB"
                                        }
                                    </small>

                                </label>


                                {/* =====================================
                                    ENROLLMENT PROOF
                                ===================================== */}

                                <label className="kiosk-file-box">

                                    <span>
                                        Registration / Enrollment Proof
                                    </span>

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,application/pdf"
                                        onChange={
                                            (event) =>
                                                handleRegistrationFile(
                                                    "enrollmentProof",
                                                    event
                                                )
                                        }
                                        required
                                    />

                                    <small>
                                        {
                                            registration
                                                .enrollmentProof
                                                ?.name ||
                                            "Choose file · max 5MB"
                                        }
                                    </small>

                                </label>


                                {/* =====================================
                                    REAL-TIME SELFIE
                                ===================================== */}

                                <div className="kiosk-file-box kiosk-selfie-box">

                                    <span>
                                        Real-Time Selfie
                                    </span>


                                    {!selfiePreview && (

                                        <div
                                            className="kiosk-camera-container"
                                            style={{
                                                width:
                                                    "100%",
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "12px",
                                            }}
                                        >

                                            {/* =================================
                                                CAMERA VIDEO
                                            ================================= */}

                                            <video
                                                ref={
                                                    selfieVideoRef
                                                }
                                                className="kiosk-selfie-video"
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

                                                    maxWidth:
                                                        "520px",

                                                    aspectRatio:
                                                        "4 / 3",

                                                    objectFit:
                                                        "cover",

                                                    borderRadius:
                                                        "14px",

                                                    background:
                                                        "#111827",

                                                    transform:
                                                        "scaleX(-1)",
                                                }}
                                            />


                                            {/* =================================
                                                HIDDEN CANVAS
                                            ================================= */}

                                            <canvas
                                                ref={
                                                    selfieCanvasRef
                                                }
                                                style={{
                                                    display:
                                                        "none",
                                                }}
                                            />


                                            {/* =================================
                                                OPEN CAMERA
                                            ================================= */}

                                            {!cameraActive && (

                                                <button
                                                    type="button"
                                                    className="kiosk-camera-button"
                                                    onClick={
                                                        startSelfieCamera
                                                    }
                                                    style={{
                                                        width:
                                                            "100%",
                                                        minHeight:
                                                            "52px",
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        cursor:
                                                            "pointer",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    📷 Open Camera
                                                </button>

                                            )}


                                            {/* =================================
                                                TAKE SELFIE
                                            ================================= */}

                                            {cameraActive && (

                                                <button
                                                    type="button"
                                                    className="kiosk-camera-button"
                                                    onClick={
                                                        captureSelfie
                                                    }
                                                    style={{
                                                        width:
                                                            "100%",
                                                        minHeight:
                                                            "52px",
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        cursor:
                                                            "pointer",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    📸 Take Selfie
                                                </button>

                                            )}

                                        </div>

                                    )}


                                    {/* =====================================
                                        SELFIE PREVIEW
                                    ===================================== */}

                                    {selfiePreview && (

                                        <div
                                            className="kiosk-selfie-preview"
                                            style={{
                                                width:
                                                    "100%",
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "12px",
                                            }}
                                        >

                                            <img
                                                src={
                                                    selfiePreview
                                                }
                                                alt="Captured real-time selfie"
                                                style={{
                                                    width:
                                                        "100%",
                                                    maxWidth:
                                                        "520px",
                                                    aspectRatio:
                                                        "4 / 3",
                                                    objectFit:
                                                        "cover",
                                                    borderRadius:
                                                        "14px",
                                                    display:
                                                        "block",
                                                }}
                                            />


                                            <div
                                                style={{
                                                    width:
                                                        "100%",
                                                    display:
                                                        "flex",
                                                    gap:
                                                        "10px",
                                                }}
                                            >

                                                <button
                                                    type="button"
                                                    className="kiosk-camera-button"
                                                    onClick={
                                                        retakeSelfie
                                                    }
                                                    style={{
                                                        width:
                                                            "100%",
                                                        minHeight:
                                                            "52px",
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        cursor:
                                                            "pointer",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    🔄 Retake Selfie
                                                </button>

                                            </div>

                                        </div>

                                    )}


                                    {/* =====================================
                                        SELFIE STATUS
                                    ===================================== */}

                                    <small>

                                        {
                                            registration
                                                .selfie

                                                ? "✓ Real-time selfie captured successfully."

                                                : "Your selfie must be taken using the device camera."
                                        }

                                    </small>

                                </div>

                            </div>


                            {/* =========================================
                                ACTIONS
                            ========================================= */}

                            <div className="kiosk-action-row">

                                <button
                                    type="button"
                                    className="kiosk-secondary-button"
                                    onClick={
                                        clearStudentSession
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="kiosk-main-button"
                                    disabled={
                                        actionLoading
                                    }
                                >

                                    {
                                        actionLoading
                                            ? "Submitting..."
                                            : "Submit for EB Verification"
                                    }

                                </button>

                            </div>

                        </form>

                    </section>

                )}


                {/* =================================================
                    REGISTRATION REVIEW
                ================================================= */}

                {step === "review-registration" &&
                    registrationReview && (

                        <section className="kiosk-voting-card">

                            <div className="kiosk-card-heading">

                                <div>

                                    <span className="kiosk-eyebrow">
                                        EB REVIEW
                                    </span>

                                    <h2>
                                        Verify Student Registration
                                    </h2>

                                    <p>
                                        Review the submitted information and documents before approving the account.
                                    </p>

                                </div>

                            </div>


                            <div className="kiosk-review-student">

                                <strong>
                                    {
                                        registrationReview
                                            .registration
                                            .fullName
                                    }
                                </strong>

                                <span>
                                    {
                                        registrationReview
                                            .registration
                                            .studentId
                                    }

                                    {" · "}

                                    {
                                        registrationReview
                                            .registration
                                            .yearLevel
                                    }
                                </span>

                            </div>


                            <div className="kiosk-review-grid">

                                {(
                                    registrationReview
                                        .review
                                        ?.documents ||
                                    []
                                ).map(
                                    (document) => (

                                        <a
                                            key={
                                                document.type
                                            }
                                            href={
                                                document.url ||
                                                "#"
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="kiosk-review-document"
                                        >

                                            <span>
                                                📄
                                            </span>

                                            <strong>
                                                {
                                                    document.type
                                                        .replaceAll(
                                                            "_",
                                                            " "
                                                        )
                                                }
                                            </strong>

                                            <small>
                                                Open document
                                            </small>

                                        </a>

                                    )
                                )}


                                {registrationReview
                                    .review
                                    ?.selfieUrl && (

                                    <a
                                        href={
                                            registrationReview
                                                .review
                                                .selfieUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="kiosk-review-document"
                                    >

                                        <span>
                                            📷
                                        </span>

                                        <strong>
                                            Selfie
                                        </strong>

                                        <small>
                                            Open selfie
                                        </small>

                                    </a>

                                )}

                            </div>


                            <div className="kiosk-warning-box">

                                Approve only after the Electoral Board has verified the student's identity and submitted documents.

                            </div>


                            <div className="kiosk-action-row">

                                <button
                                    type="button"
                                    className="kiosk-secondary-button"
                                    onClick={
                                        clearStudentSession
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="kiosk-main-button"
                                    onClick={
                                        approveRegistration
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >

                                    {
                                        actionLoading
                                            ? "Approving..."
                                            : "Approve & Continue"
                                    }

                                </button>

                            </div>

                        </section>

                    )}


                {/* =================================================
                    SET PASSWORD
                ================================================= */}

                {step === "set-password" && (

                    <section className="kiosk-voting-card kiosk-password-card">

                        <div className="kiosk-voting-icon">
                            🔐
                        </div>

                        <span className="kiosk-eyebrow">
                            CREATE PERSONAL PASSWORD
                        </span>

                        <h2>
                            {
                                student?.fullName
                            }
                        </h2>

                        <p>
                            Create the student's personal 8-character password before voting.
                        </p>


                        <form
                            onSubmit={
                                setPersonalPassword
                            }
                        >

                            <input
                                type="password"
                                value={
                                    password
                                }
                                onChange={
                                    (event) =>
                                        setPassword(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                placeholder="Personal password"
                                maxLength={8}
                                autoFocus
                            />


                            <div className="kiosk-password-checks">

                                {[
                                    [
                                        "length",
                                        "Exactly 8 characters",
                                    ],
                                    [
                                        "upper",
                                        "Uppercase letter",
                                    ],
                                    [
                                        "lower",
                                        "Lowercase letter",
                                    ],
                                    [
                                        "number",
                                        "Number",
                                    ],
                                    [
                                        "special",
                                        "Special character",
                                    ],
                                ].map(
                                    ([
                                        key,
                                        label,
                                    ]) => (

                                        <div
                                            key={
                                                key
                                            }
                                            className={
                                                passwordRequirements[
                                                    key
                                                ]
                                                    ? "valid"
                                                    : ""
                                            }
                                        >

                                            <span>
                                                {
                                                    passwordRequirements[
                                                        key
                                                    ]
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </span>

                                            {
                                                label
                                            }

                                        </div>

                                    )
                                )}

                            </div>


                            <input
                                type="password"
                                value={
                                    confirmPassword
                                }
                                onChange={
                                    (event) =>
                                        setConfirmPassword(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                placeholder="Confirm password"
                                maxLength={8}
                            />


                            <button
                                type="submit"
                                className="kiosk-main-button"
                                disabled={
                                    actionLoading
                                }
                            >

                                {
                                    actionLoading
                                        ? "Saving..."
                                        : "Save Password & Continue"
                                }

                            </button>

                        </form>

                    </section>

                )}


                {/* =================================================
                    BALLOT
                ================================================= */}

                {step === "vote" && (

                    <section className="kiosk-ballot-card">

                        <div className="kiosk-ballot-heading">

                            <div>

                                <span className="kiosk-eyebrow">
                                    BALLOT
                                </span>

                                <h2>
                                    {
                                        student?.fullName
                                    }
                                </h2>

                                <p>
                                    {
                                        student?.studentId
                                    }

                                    {" · "}

                                    {
                                        student?.yearLevel
                                    }
                                </p>

                            </div>


                            <span className="kiosk-ballot-election">
                                {
                                    election?.title
                                }
                            </span>

                        </div>


                        {eligiblePositions.length ===
                        0 ? (

                            <div className="kiosk-warning-box">

                                No voting positions are configured for this student's year level.

                            </div>

                        ) : (

                            <div className="kiosk-position-list">

                                {eligiblePositions.map(
                                    (position) => (

                                        <div
                                            className="kiosk-position-card"
                                            key={
                                                position.id
                                            }
                                        >

                                            <div className="kiosk-position-heading">

                                                <div>

                                                    <h3>
                                                        {
                                                            position.name
                                                        }
                                                    </h3>

                                                    {
                                                        position.description &&
                                                        (
                                                            <p>
                                                                {
                                                                    position.description
                                                                }
                                                            </p>
                                                        )
                                                    }

                                                </div>


                                                {
                                                    position.is_required !==
                                                        false && (

                                                        <span>
                                                            Required
                                                        </span>

                                                    )
                                                }

                                            </div>


                                            <div className="kiosk-candidate-grid">

                                                {
                                                    position
                                                        .candidates
                                                        .length
                                                        ? position
                                                            .candidates
                                                            .map(
                                                                (
                                                                    candidate
                                                                ) => (

                                                                    <label
                                                                        className={`kiosk-candidate ${
                                                                            selections[
                                                                                position
                                                                                    .id
                                                                            ] ===
                                                                            candidate.id
                                                                                ? "selected"
                                                                                : ""
                                                                        }`}
                                                                        key={
                                                                            candidate.id
                                                                        }
                                                                    >

                                                                        <input
                                                                            type="radio"
                                                                            name={`position-${position.id}`}
                                                                            checked={
                                                                                selections[
                                                                                    position
                                                                                        .id
                                                                                ] ===
                                                                                candidate.id
                                                                            }
                                                                            onChange={() =>
                                                                                selectCandidate(
                                                                                    position.id,
                                                                                    candidate.id
                                                                                )
                                                                            }
                                                                        />

                                                                        <span className="kiosk-radio" />

                                                                        <span>

                                                                            <strong>
                                                                                {
                                                                                    candidate.full_name ||
                                                                                    candidate.fullName ||
                                                                                    candidate.name
                                                                                }
                                                                            </strong>

                                                                            {
                                                                                candidate.platform && (
                                                                                    <small>
                                                                                        {
                                                                                            candidate.platform
                                                                                        }
                                                                                    </small>
                                                                                )
                                                                            }

                                                                        </span>

                                                                    </label>

                                                                )
                                                            )

                                                        : (

                                                            <div className="kiosk-empty-candidates">

                                                                No active candidates are available for this position.

                                                            </div>

                                                        )
                                                }

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}


                        <div className="kiosk-ballot-footer">

                            <span>
                                {
                                    Object.keys(
                                        selections
                                    ).length
                                }{" "}
                                position(s) selected
                            </span>


                            <button
                                type="button"
                                className="kiosk-main-button"
                                onClick={
                                    submitKioskVote
                                }
                                disabled={
                                    actionLoading
                                }
                            >

                                {
                                    actionLoading
                                        ? "Submitting Ballot..."
                                        : "Submit Ballot"
                                }

                            </button>

                        </div>

                    </section>

                )}


                {/* =================================================
                    COMPLETE
                ================================================= */}

                {step === "complete" && (

                    <section className="kiosk-voting-card kiosk-complete-card">

                        <div className="kiosk-success-icon">
                            ✓
                        </div>

                        <span className="kiosk-eyebrow">
                            BALLOT RECORDED
                        </span>

                        <h2>
                            Your vote has been successfully submitted.
                        </h2>

                        <p>
                            The ballot was recorded securely. No vote choices are stored in the kiosk session.
                        </p>


                        {
                            submittedBallot
                                ?.ballotId && (

                                <div className="kiosk-ballot-reference">

                                    Ballot recorded ·{" "}
                                    {
                                        submittedBallot
                                            .ballotId
                                    }

                                </div>

                            )
                        }


                        <button
                            type="button"
                            className="kiosk-main-button"
                            onClick={
                                nextStudent
                            }
                        >
                            Next Student
                        </button>

                    </section>

                )}

            </main>

        </div>
    );
}



export default KioskVoting;