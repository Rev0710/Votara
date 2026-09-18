import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";


// =========================================================
// REGISTRATION STATUS
// =========================================================

function RegistrationStatus() {

    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [registration, setRegistration] =
        useState(null);


    // =========================================================
    // GET STUDENT INFORMATION
    // =========================================================

    const getStudentInformation = () => {

        const studentId =
            sessionStorage.getItem(
                "votara_student_id"
            ) ||
            localStorage.getItem(
                "votara_student_id"
            );

        const email =
            sessionStorage.getItem(
                "votara_registration_email"
            ) ||
            localStorage.getItem(
                "votara_registration_email"
            );

        return {
            studentId,
            email,
        };
    };


    // =========================================================
    // LOAD REGISTRATION STATUS
    // =========================================================

    useEffect(() => {

        const loadRegistrationStatus =
            async () => {

                try {

                    setLoading(true);
                    setError("");

                    const {
                        studentId,
                        email,
                    } =
                        getStudentInformation();


                    if (
                        !studentId ||
                        !email
                    ) {

                        setError(
                            "Your registration information could not be found. Please return to registration and try again."
                        );

                        setLoading(false);

                        return;
                    }


                    /*
                     * IMPORTANT:
                     *
                     * This endpoint will be connected to
                     * the existing registration backend.
                     *
                     * We are keeping this request isolated
                     * so the rest of the registration system
                     * is not affected.
                     */

                    const response =
                        await api.get(
                            "/registration/status",
                            {
                                params: {
                                    studentId,
                                    email,
                                },
                            }
                        );


                    const data =
                        response.data;


                    if (
                        !data ||
                        !data.registration
                    ) {

                        setError(
                            "Registration information was not found."
                        );

                        setLoading(false);

                        return;
                    }


                    const currentRegistration =
                        data.registration;


                    setRegistration(
                        currentRegistration
                    );


                    // -------------------------------------------------
                    // SAVE STATUS FOR REGISTRATION REQUIREMENTS PAGE
                    // -------------------------------------------------

                    if (
                        currentRegistration.status
                    ) {

                        sessionStorage.setItem(
                            "votara_registration_status",
                            currentRegistration.status
                        );
                    }


                    // -------------------------------------------------
                    // SAVE CORRECTION MESSAGE
                    // -------------------------------------------------

                    if (
                        currentRegistration.correctionMessage
                    ) {

                        sessionStorage.setItem(
                            "votara_correction_message",
                            currentRegistration.correctionMessage
                        );

                    } else {

                        sessionStorage.removeItem(
                            "votara_correction_message"
                        );
                    }


                } catch (err) {

                    console.error(
                        "Registration status error:",
                        err
                    );


                    setError(
                        err?.response?.data?.message ||
                        "Unable to load your registration status."
                    );

                } finally {

                    setLoading(false);
                }
            };


        loadRegistrationStatus();

    }, []);


    // =========================================================
    // STATUS HELPERS
    // =========================================================

    const getStatusInformation =
        (status) => {

            switch (status) {

                case "pending_review":

                    return {
                        title:
                            "Registration Under Review",

                        message:
                            "Your registration requirements have been submitted successfully. The Electoral Board will review your application.",

                        icon:
                            "🕐",

                        type:
                            "pending",
                    };


                case "needs_correction":

                    return {
                        title:
                            "Correction Required",

                        message:
                            registration?.correctionMessage ||
                            "The Electoral Board has requested a correction to your registration requirements.",

                        icon:
                            "⚠️",

                        type:
                            "correction",
                    };


                case "approved":

                    return {
                        title:
                            "Registration Approved",

                        message:
                            "Your registration has been approved by the Electoral Board.",

                        icon:
                            "✅",

                        type:
                            "approved",
                    };


                case "rejected":

                    return {
                        title:
                            "Registration Rejected",

                        message:
                            registration?.rejectionReason ||
                            "Your registration application was not approved.",

                        icon:
                            "❌",

                        type:
                            "rejected",
                    };


                case "cancelled":

                    return {
                        title:
                            "Registration Cancelled",

                        message:
                            "This registration application has been cancelled.",

                        icon:
                            "ℹ️",

                        type:
                            "cancelled",
                    };


                default:

                    return {
                        title:
                            "Registration Status",

                        message:
                            "Your registration status is currently being processed.",

                        icon:
                            "ℹ️",

                        type:
                            "pending",
                    };
            }
        };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div
                style={styles.page}
            >

                <div
                    style={styles.card}
                >

                    <div
                        style={styles.loadingIcon}
                    >
                        ⏳
                    </div>

                    <h2
                        style={styles.title}
                    >
                        Checking Registration
                    </h2>

                    <p
                        style={styles.description}
                    >
                        Please wait while we retrieve
                        your registration status.
                    </p>

                </div>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (

            <div
                style={styles.page}
            >

                <div
                    style={styles.card}
                >

                    <div
                        style={styles.errorIcon}
                    >
                        ⚠️
                    </div>

                    <h2
                        style={styles.title}
                    >
                        Unable to Load Status
                    </h2>

                    <p
                        style={styles.description}
                    >
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                        style={styles.primaryButton}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    // =========================================================
    // STATUS
    // =========================================================

    const status =
        registration?.status ||
        "pending_review";

    const statusInfo =
        getStatusInformation(status);


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div
            style={styles.page}
        >

            <div
                style={styles.card}
            >

                {/* -------------------------------------------------
                    HEADER
                ------------------------------------------------- */}

                <div
                    style={styles.header}
                >

                    <div
                        style={styles.logo}
                    >
                        V
                    </div>

                    <div>

                        <div
                            style={styles.brand}
                        >
                            VOTARA
                        </div>

                        <div
                            style={styles.brandSubtitle}
                        >
                            Online Voting System
                        </div>

                    </div>

                </div>


                {/* -------------------------------------------------
                    STATUS ICON
                ------------------------------------------------- */}

                <div
                    style={{
                        ...styles.statusIcon,

                        ...(statusInfo.type ===
                            "correction"
                            ? styles.correctionIcon
                            : {}),

                        ...(statusInfo.type ===
                            "approved"
                            ? styles.approvedIcon
                            : {}),

                        ...(statusInfo.type ===
                            "rejected"
                            ? styles.rejectedIcon
                            : {}),
                    }}
                >

                    {statusInfo.icon}

                </div>


                {/* -------------------------------------------------
                    STATUS TITLE
                ------------------------------------------------- */}

                <h1
                    style={styles.title}
                >
                    {statusInfo.title}
                </h1>


                {/* -------------------------------------------------
                    STATUS MESSAGE
                ------------------------------------------------- */}

                <p
                    style={styles.description}
                >
                    {statusInfo.message}
                </p>


                {/* -------------------------------------------------
                    CORRECTION BOX
                ------------------------------------------------- */}

                {status ===
                    "needs_correction" && (

                    <div
                        style={
                            styles.correctionBox
                        }
                    >

                        <div
                            style={
                                styles.correctionHeading
                            }
                        >
                            ⚠️ Electoral Board Message
                        </div>

                        <div
                            style={
                                styles.correctionMessage
                            }
                        >
                            {registration?.correctionMessage ||
                                "Please review your registration requirements and submit the requested corrections."}
                        </div>

                    </div>
                )}


                {/* -------------------------------------------------
                    REJECTION BOX
                ------------------------------------------------- */}

                {status ===
                    "rejected" && (

                    <div
                        style={
                            styles.rejectionBox
                        }
                    >

                        <div
                            style={
                                styles.rejectionHeading
                            }
                        >
                            Rejection Reason
                        </div>

                        <div
                            style={
                                styles.rejectionMessage
                            }
                        >
                            {registration?.rejectionReason ||
                                "No rejection reason was provided."}
                        </div>

                    </div>
                )}


                {/* -------------------------------------------------
                    APPLICATION DETAILS
                ------------------------------------------------- */}

                {registration && (

                    <div
                        style={
                            styles.details
                        }
                    >

                        <div
                            style={
                                styles.detailRow
                            }
                        >

                            <span
                                style={
                                    styles.detailLabel
                                }
                            >
                                Student ID
                            </span>

                            <span
                                style={
                                    styles.detailValue
                                }
                            >
                                {registration.studentId ||
                                    "—"}
                            </span>

                        </div>


                        <div
                            style={
                                styles.detailRow
                            }
                        >

                            <span
                                style={
                                    styles.detailLabel
                                }
                            >
                                Full Name
                            </span>

                            <span
                                style={
                                    styles.detailValue
                                }
                            >
                                {registration.fullName ||
                                    "—"}
                            </span>

                        </div>


                        <div
                            style={
                                styles.detailRow
                            }
                        >

                            <span
                                style={
                                    styles.detailLabel
                                }
                            >
                                Year Level
                            </span>

                            <span
                                style={
                                    styles.detailValue
                                }
                            >
                                {registration.yearLevel ||
                                    "—"}
                            </span>

                        </div>


                        <div
                            style={
                                styles.detailRow
                            }
                        >

                            <span
                                style={
                                    styles.detailLabel
                                }
                            >
                                Status
                            </span>

                            <span
                                style={{
                                    ...styles.statusBadge,

                                    ...(statusInfo.type ===
                                        "correction"
                                        ? styles.badgeCorrection
                                        : {}),

                                    ...(statusInfo.type ===
                                        "approved"
                                        ? styles.badgeApproved
                                        : {}),

                                    ...(statusInfo.type ===
                                        "rejected"
                                        ? styles.badgeRejected
                                        : {}),
                                }}
                            >
                                {status.replace(
                                    /_/g,
                                    " "
                                )}
                            </span>

                        </div>

                    </div>
                )}


                {/* -------------------------------------------------
                    CORRECTION ACTION
                ------------------------------------------------- */}

                {status ===
                    "needs_correction" && (

                    <button
                        type="button"
                        onClick={() => {

                            sessionStorage.setItem(
                                "votara_registration_status",
                                "needs_correction"
                            );

                            sessionStorage.setItem(
                                "votara_correction_message",
                                registration?.correctionMessage ||
                                ""
                            );

                            navigate(
                                "/registration-requirements"
                            );

                        }}
                        style={
                            styles.primaryButton
                        }
                    >
                        Correct Requirements →
                    </button>
                )}


                {/* -------------------------------------------------
                    APPROVED ACTION
                ------------------------------------------------- */}

                {status ===
                    "approved" && (

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/login"
                            )
                        }
                        style={
                            styles.primaryButton
                        }
                    >
                        Continue to Login →
                    </button>
                )}


                {/* -------------------------------------------------
                    FOOTER
                ------------------------------------------------- */}

                <div
                    style={
                        styles.footer
                    }
                >
                    VOTARA • Secure Student Election System
                </div>

            </div>

        </div>
    );
}


// =========================================================
// STYLES
// =========================================================

const styles = {

    page: {
        minHeight:
            "100vh",

        display:
            "flex",

        justifyContent:
            "center",

        alignItems:
            "center",

        padding:
            "24px",

        background:
            "#f5f7fb",

        fontFamily:
            "Inter, Poppins, Arial, sans-serif",
    },


    card: {
        width:
            "100%",

        maxWidth:
            "620px",

        background:
            "#ffffff",

        borderRadius:
            "18px",

        padding:
            "36px",

        boxShadow:
            "0 10px 35px rgba(15, 23, 42, 0.08)",

        textAlign:
            "center",
    },


    header: {
        display:
            "flex",

        alignItems:
            "center",

        justifyContent:
            "center",

        gap:
            "12px",

        marginBottom:
            "28px",
    },


    logo: {
        width:
            "42px",

        height:
            "42px",

        borderRadius:
            "10px",

        display:
            "flex",

        alignItems:
            "center",

        justifyContent:
            "center",

        background:
            "#1E3A8A",

        color:
            "#ffffff",

        fontWeight:
            "800",

        fontSize:
            "21px",
    },


    brand: {
        color:
            "#1E3A8A",

        fontSize:
            "18px",

        fontWeight:
            "800",

        textAlign:
            "left",
    },


    brandSubtitle: {
        color:
            "#718096",

        fontSize:
            "11px",

        textAlign:
            "left",

        marginTop:
            "2px",
    },


    statusIcon: {
        width:
            "74px",

        height:
            "74px",

        borderRadius:
            "50%",

        margin:
            "0 auto 18px",

        display:
            "flex",

        alignItems:
            "center",

        justifyContent:
            "center",

        background:
            "#eef2ff",

        fontSize:
            "34px",
    },


    correctionIcon: {
        background:
            "#fff8e8",
    },


    approvedIcon: {
        background:
            "#ecfdf3",
    },


    rejectedIcon: {
        background:
            "#fef2f2",
    },


    loadingIcon: {
        fontSize:
            "42px",

        marginBottom:
            "12px",
    },


    errorIcon: {
        fontSize:
            "42px",

        marginBottom:
            "12px",
    },


    title: {
        margin:
            "0",

        color:
            "#1f2937",

        fontSize:
            "26px",

        fontWeight:
            "800",
    },


    description: {
        margin:
            "12px auto 0",

        maxWidth:
            "500px",

        color:
            "#667085",

        fontSize:
            "14px",

        lineHeight:
            "1.7",
    },


    correctionBox: {
        marginTop:
            "24px",

        padding:
            "17px",

        textAlign:
            "left",

        borderRadius:
            "12px",

        background:
            "#fff8e8",

        border:
            "1px solid #f4d58d",
    },


    correctionHeading: {
        color:
            "#9a6700",

        fontSize:
            "13px",

        fontWeight:
            "800",

        marginBottom:
            "8px",
    },


    correctionMessage: {
        color:
            "#6b5a2b",

        fontSize:
            "13px",

        lineHeight:
            "1.6",
    },


    rejectionBox: {
        marginTop:
            "24px",

        padding:
            "17px",

        textAlign:
            "left",

        borderRadius:
            "12px",

        background:
            "#fef2f2",

        border:
            "1px solid #fecaca",
    },


    rejectionHeading: {
        color:
            "#b42318",

        fontSize:
            "13px",

        fontWeight:
            "800",

        marginBottom:
            "8px",
    },


    rejectionMessage: {
        color:
            "#7f1d1d",

        fontSize:
            "13px",

        lineHeight:
            "1.6",
    },


    details: {
        marginTop:
            "26px",

        border:
            "1px solid #e5e7eb",

        borderRadius:
            "12px",

        overflow:
            "hidden",

        textAlign:
            "left",
    },


    detailRow: {
        display:
            "flex",

        justifyContent:
            "space-between",

        gap:
            "20px",

        padding:
            "13px 15px",

        borderBottom:
            "1px solid #eef0f3",

        fontSize:
            "13px",
    },


    detailLabel: {
        color:
            "#667085",

        fontWeight:
            "600",
    },


    detailValue: {
        color:
            "#1f2937",

        fontWeight:
            "700",

        textAlign:
            "right",
    },


    statusBadge: {
        display:
            "inline-flex",

        padding:
            "5px 10px",

        borderRadius:
            "999px",

        background:
            "#eef2ff",

        color:
            "#1E3A8A",

        fontSize:
            "11px",

        fontWeight:
            "800",

        textTransform:
            "capitalize",
    },


    badgeCorrection: {
        background:
            "#fff3cd",

        color:
            "#9a6700",
    },


    badgeApproved: {
        background:
            "#dcfce7",

        color:
            "#15803d",
    },


    badgeRejected: {
        background:
            "#fee2e2",

        color:
            "#b91c1c",
    },


    primaryButton: {
        width:
            "100%",

        marginTop:
            "24px",

        padding:
            "13px 18px",

        border:
            "none",

        borderRadius:
            "10px",

        background:
            "#1E3A8A",

        color:
            "#ffffff",

        fontSize:
            "14px",

        fontWeight:
            "700",

        cursor:
            "pointer",
    },


    footer: {
        marginTop:
            "28px",

        color:
            "#98a2b3",

        fontSize:
            "11px",
    },
};


export default RegistrationStatus;