import { Link } from "react-router-dom";

const RegistrationConfirmation = () => {

    // Read-only values saved by the existing registration / OTP flow.
    const studentName =
        sessionStorage.getItem(
            "votara_full_name"
        ) || "Not available";

    const studentId =
        sessionStorage.getItem(
            "votara_student_id"
        ) || "Not available";

    const email =
        sessionStorage.getItem(
            "votara_email"
        ) || "Not available";

    const yearLevel =
        sessionStorage.getItem(
            "votara_year_level"
        ) || "Not available";

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily:
                    "Poppins, Arial, sans-serif",
                paddingTop: "35px",
            }}
        >

            {/* =====================================
                PROGRESS BAR
            ===================================== */}

            <div
                style={{
                    width: "50%",
                    maxWidth: "560px",
                    minWidth: "320px",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        height: "3px",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            background: "#1450ff",
                        }}
                    />
                </div>

                <div
                    style={{
                        textAlign: "right",
                        fontSize: "12px",
                        marginTop: "7px",
                    }}
                >
                    3 of 3 steps
                </div>

            </div>


            {/* =====================================
                CONFIRMATION
            ===================================== */}

            <div
                style={{
                    textAlign: "center",
                    marginTop: "100px",
                    width: "90%",
                    maxWidth: "550px",
                }}
            >

                {/* CHECKMARK */}

                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "#1450ff",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "42px",
                        margin: "0 auto 25px",
                    }}
                >
                    ✓
                </div>


                <h1
                    style={{
                        fontSize: "22px",
                        marginBottom: "10px",
                    }}
                >
                    Registration Submitted!
                </h1>


                <p
                    style={{
                        fontSize: "14px",
                        lineHeight: "1.7",
                        color: "#526078",
                        marginBottom: "22px",
                    }}
                >
                    Your registration has been successfully submitted
                    and is now waiting for review by the Electoral Board.
                    Please keep the information below for your reference.
                </p>


                {/* =================================
                    SUBMITTED INFORMATION
                ================================= */}

                <div
                    style={{
                        marginTop: "25px",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #dbe4f2",
                        background: "#f9fbff",
                        textAlign: "left",
                    }}
                >

                    <div
                        style={{
                            fontSize: "15px",
                            fontWeight: "800",
                            color: "#172033",
                            marginBottom: "15px",
                        }}
                    >
                        Registration Information
                    </div>

                    {[
                        ["Name", studentName],
                        ["ID", studentId],
                        ["EMAIL", email],
                        ["Year Level", yearLevel],
                    ].map(
                        ([
                            label,
                            value,
                        ]) => (

                            <div
                                key={label}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "20px",
                                    padding: "9px 0",
                                    borderBottom: "1px solid #e7edf5",
                                    fontSize: "13px",
                                }}
                            >

                                <span
                                    style={{
                                        color: "#718096",
                                        fontWeight: "700",
                                        minWidth: "90px",
                                    }}
                                >
                                    {label}
                                </span>

                                <span
                                    style={{
                                        color: "#172033",
                                        fontWeight: "700",
                                        textAlign: "right",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {value}
                                </span>

                            </div>

                        )
                    )}

                </div>


                {/* =================================
                    WHAT'S NEXT
                ================================= */}

                <div
                    style={{
                        marginTop: "20px",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #cfe0ff",
                        background: "#eef5ff",
                        textAlign: "left",
                    }}
                >

                    <div
                        style={{
                            fontSize: "15px",
                            fontWeight: "800",
                            color: "#1554d1",
                            marginBottom: "10px",
                        }}
                    >
                        📧 What Happens Next?
                    </div>

                    <div
                        style={{
                            fontSize: "13px",
                            lineHeight: "1.7",
                            color: "#526078",
                        }}
                    >
                        Please wait while the Electoral Board reviews your
                        registration. VOTARA will send an official email to
                        the email address you provided once your registration
                        has been approved.
                    </div>

                    <div
                        style={{
                            marginTop: "12px",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "#ffffff",
                            border: "1px solid #dbe4f2",
                            fontSize: "12px",
                            lineHeight: "1.6",
                            color: "#526078",
                        }}
                    >
                        <strong style={{ color: "#172033" }}>
                            Expected review time:
                        </strong>{" "}
                        Please allow up to <strong>1 hour</strong> for the
                        Electoral Board to complete the review. Keep checking
                        your inbox, including your Spam or Junk folder.
                    </div>

                    <div
                        style={{
                            marginTop: "12px",
                            fontSize: "12px",
                            lineHeight: "1.6",
                            color: "#718096",
                        }}
                    >
                        If approved, your VOTARA email will contain your
                        account instructions and temporary password for your
                        first login. You will be required to change your
                        password after signing in.
                    </div>

                </div>


                {/* =================================
                    LOGIN
                ================================= */}

                <Link
                    to="/student-login"
                    style={{
                        display: "inline-block",
                        marginTop: "30px",
                        padding: "12px 55px",
                        background: "#1450ff",
                        color: "#ffffff",
                        borderRadius: "7px",
                        textDecoration: "none",
                        fontWeight: "600",
                    }}
                >
                    Go to Login
                </Link>

            </div>

        </div>
    );
};

export default RegistrationConfirmation;