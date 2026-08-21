import React from "react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {

    const navigate =
        useNavigate();

    const studentData =
        localStorage.getItem(
            "votaraStudent"
        );

    const student =
        studentData
            ? JSON.parse(studentData)
            : null;


    const handleLogout = () => {

        localStorage.removeItem(
            "votaraToken"
        );

        localStorage.removeItem(
            "votaraStudent"
        );

        navigate(
            "/student-login"
        );
    };


    return (
        <div
            style={{
                minHeight:
                    "100vh",
                background:
                    "#f4f7ff",
                fontFamily:
                    "Poppins, sans-serif",
            }}
        >

            <header
                style={{
                    background:
                        "white",
                    padding:
                        "20px 40px",
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "center",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.05)",
                }}
            >

                <h2
                    style={{
                        color:
                            "#1455ff",
                    }}
                >
                    Votara
                </h2>


                <button
                    onClick={
                        handleLogout
                    }
                >
                    Logout
                </button>

            </header>


            <main
                style={{
                    padding:
                        "50px",
                }}
            >

                <h1>
                    Welcome,{" "}
                    {student?.fullName ||
                        "Student"}!
                </h1>


                <div
                    style={{
                        marginTop:
                            "30px",
                        background:
                            "white",
                        padding:
                            "30px",
                        borderRadius:
                            "15px",
                        maxWidth:
                            "600px",
                    }}
                >

                    <h2>
                        Student Information
                    </h2>

                    <p>
                        <strong>
                            Student ID:
                        </strong>{" "}
                        {student?.studentId}
                    </p>

                    <p>
                        <strong>
                            Name:
                        </strong>{" "}
                        {student?.fullName}
                    </p>

                    <p>
                        <strong>
                            Year Level:
                        </strong>{" "}
                        {student?.yearLevel}
                    </p>

                    <p>
                        <strong>
                            Email:
                        </strong>{" "}
                        {student?.email ||
                            "Not provided"}
                    </p>

                </div>


                <div
                    style={{
                        marginTop:
                            "30px",
                        background:
                            "white",
                        padding:
                            "30px",
                        borderRadius:
                            "15px",
                        maxWidth:
                            "600px",
                    }}
                >

                    <h2>
                        Election Status
                    </h2>

                    <p>
                        You are logged in
                        successfully.
                    </p>

                    <button
                        style={{
                            background:
                                "#1455ff",
                            color:
                                "white",
                            border:
                                "none",
                            padding:
                                "12px 30px",
                            borderRadius:
                                "8px",
                        }}
                    >
                        Vote Now
                    </button>

                </div>

            </main>

        </div>
    );
};

export default StudentDashboard;