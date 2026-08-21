import { Link } from "react-router-dom";

const RegistrationConfirmation = () => {
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
                        lineHeight: "1.6",
                    }}
                >
                    Your registration is pending
                    <br />
                    for approval by the Electoral Board.
                </p>


                {/* =================================
                    WHAT'S NEXT
                ================================= */}

                <div
                    style={{
                        marginTop: "30px",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.15)",
                        textAlign: "left",
                    }}
                >

                    <strong>
                        What's Next?
                    </strong>

                    <ul
                        style={{
                            marginTop: "10px",
                            paddingLeft: "20px",
                            fontSize: "14px",
                            lineHeight: "1.8",
                        }}
                    >
                        <li>
                            Wait for approval
                        </li>

                        <li>
                            Check your Temporary password
                        </li>

                        <li>
                            Login and change your password
                        </li>
                    </ul>

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