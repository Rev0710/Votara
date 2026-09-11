import React, {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getStudentProfile,
    updateStudentProfile,
} from "../../services/authService";

import "./Settings.css";


const Settings = () => {

    const navigate = useNavigate();

    const token =
        localStorage.getItem(
            "votaraToken"
        );


    // =====================================================
    // PROFILE STATE
    // =====================================================

    const [profile, setProfile] =
        useState({
            firstName: "",
            middleName: "",
            lastName: "",
            birthday: "",
            contactNumber: "",
            email: "",
            province: "",
            barangay: "",
            city: "",
            profilePicture: null,
        });


    const [editing, setEditing] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        const loadProfile = async () => {

            if (!token) {
                navigate("/student-login");
                return;
            }

            try {

                const data =
                    await getStudentProfile(
                        token
                    );

                if (data.student) {

                    setProfile({
                        firstName:
                            data.student.firstName ||
                            "",

                        middleName:
                            data.student.middleName ||
                            "",

                        lastName:
                            data.student.lastName ||
                            "",

                        birthday:
                            data.student.birthday ||
                            "",

                        contactNumber:
                            data.student.contactNumber ||
                            "",

                        email:
                            data.student.email ||
                            "",

                        province:
                            data.student.province ||
                            "",

                        barangay:
                            data.student.barangay ||
                            "",

                        city:
                            data.student.city ||
                            "",

                        profilePicture:
                            data.student.profilePicture ||
                            null,
                    });

                }

            } catch (err) {

                console.error(
                    "❌ Profile loading error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load profile."
                );

            } finally {

                setLoading(false);

            }
        };


        loadProfile();

    }, [token, navigate]);


    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setProfile(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

    };


    // =====================================================
    // EDIT BUTTON
    // =====================================================

    const handleEdit = () => {

        setEditing(true);

        setMessage("");

        setError("");

    };


    // =====================================================
    // DONE BUTTON
    // =====================================================

    const handleDone = async () => {

        if (!token) {
            navigate("/student-login");
            return;
        }

        setSaving(true);

        setMessage("");

        setError("");

        try {

            const data =
                await updateStudentProfile(
                    token,
                    {
                        firstName:
                            profile.firstName,

                        middleName:
                            profile.middleName,

                        lastName:
                            profile.lastName,

                        birthday:
                            profile.birthday,

                        contactNumber:
                            profile.contactNumber,

                        email:
                            profile.email,

                        province:
                            profile.province,

                        barangay:
                            profile.barangay,

                        city:
                            profile.city,
                    }
                );


            if (data.student) {

                setProfile(
                    (previous) => ({
                        ...previous,

                        ...data.student,
                    })
                );

            }


            setEditing(false);

            setMessage(
                "Profile updated successfully."
            );

        } catch (err) {

            console.error(
                "❌ Profile update error:",
                err
            );

            setError(
                err.message ||
                "Unable to update profile."
            );

        } finally {

            setSaving(false);

        }
    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancel = async () => {

        setEditing(false);

        setMessage("");

        setError("");

        try {

            const data =
                await getStudentProfile(
                    token
                );

            if (data.student) {

                setProfile({
                    firstName:
                        data.student.firstName ||
                        "",

                    middleName:
                        data.student.middleName ||
                        "",

                    lastName:
                        data.student.lastName ||
                        "",

                    birthday:
                        data.student.birthday ||
                        "",

                    contactNumber:
                        data.student.contactNumber ||
                        "",

                    email:
                        data.student.email ||
                        "",

                    province:
                        data.student.province ||
                        "",

                    barangay:
                        data.student.barangay ||
                        "",

                    city:
                        data.student.city ||
                        "",

                    profilePicture:
                        data.student.profilePicture ||
                        null,
                });

            }

        } catch (err) {

            console.error(
                "❌ Reload profile error:",
                err
            );

        }
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="settings-loading">
                Loading profile...
            </div>
        );

    }


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="settings-page">

            {/* ==========================================
                TOP BAR
            ========================================== */}

            <header className="settings-topbar">

                <div
                    className="settings-logo"
                    onClick={() =>
                        navigate(
                            "/student-dashboard"
                        )
                    }
                >
                    <span className="logo-icon">
                        ✦
                    </span>

                    Votara
                </div>


                <div className="settings-search">
                    Search
                    <span>⌕</span>
                </div>


                <div className="settings-top-right">

                    <span className="top-icon">
                        ♧
                    </span>

                    <span className="top-icon">
                        ?
                    </span>

                    <span className="top-user">
                        Student
                    </span>

                </div>

            </header>


            {/* ==========================================
                MAIN AREA
            ========================================== */}

            <div className="settings-content">


                {/* ======================================
                    LEFT MENU
                ====================================== */}

                <aside className="settings-sidebar">

                    <h2>
                        Account and Settings
                    </h2>


                    <button
                        className="settings-menu active"
                        onClick={() => {}}
                    >
                        <span>●</span>
                        Edit profile
                        <b>›</b>
                    </button>


                    <button
                        className="settings-menu"
                        onClick={() =>
                            navigate(
                                "/change-password"
                            )
                        }
                    >
                        <span>▣</span>
                        Change password
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>●</span>
                        Report an Issue
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>!</span>
                        About us
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>◉</span>
                        Terms of Service
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>◉</span>
                        Privacy Policy
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>✉</span>
                        Contact us
                        <b>›</b>
                    </button>


                    <button
                        className="settings-logout"
                        onClick={() => {

                            localStorage.removeItem(
                                "votaraToken"
                            );

                            localStorage.removeItem(
                                "votaraStudent"
                            );

                            navigate(
                                "/student-login"
                            );

                        }}
                    >
                        ←
                        <span>
                            Log out
                        </span>
                    </button>

                </aside>


                {/* ======================================
                    PROFILE PANEL
                ====================================== */}

                <main className="profile-panel">


                    {/* ==================================
                        PROFILE PICTURE
                    ================================== */}

                    <section className="profile-picture-section">

                        <div className="profile-picture-wrapper">

                            {profile.profilePicture ? (

                                <img
                                    src={
                                        profile.profilePicture
                                    }
                                    alt="Student"
                                    className="profile-picture"
                                />

                            ) : (

                                <div className="profile-placeholder">
                                    👤
                                </div>

                            )}

                        </div>


                        <div className="profile-picture-buttons">

                            <button
                                className="upload-button"
                                disabled={!editing}
                            >
                                Upload
                            </button>


                            <button
                                className="remove-button"
                                disabled={!editing}
                            >
                                Remove
                            </button>

                        </div>

                    </section>


                    {/* ==================================
                        FORM
                    ================================== */}

                    <section className="profile-form">


                        {/* FIRST NAME */}

                        <div className="form-group">

                            <label>
                                First name
                            </label>

                            <input
                                type="text"
                                name="firstName"
                                value={
                                    profile.firstName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* MIDDLE NAME */}

                        <div className="form-group">

                            <label>
                                Middle name
                            </label>

                            <input
                                type="text"
                                name="middleName"
                                value={
                                    profile.middleName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* LAST NAME */}

                        <div className="form-group">

                            <label>
                                Last name
                            </label>

                            <input
                                type="text"
                                name="lastName"
                                value={
                                    profile.lastName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* BIRTHDAY */}

                        <div className="form-group right-field">

                            <label>
                                Birthday
                            </label>

                            <input
                                type="date"
                                name="birthday"
                                value={
                                    profile.birthday
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* CONTACT NUMBER */}

                        <div className="form-group right-field">

                            <label>
                                Contact Number
                            </label>

                            <input
                                type="text"
                                name="contactNumber"
                                value={
                                    profile.contactNumber
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                                placeholder="+63..."
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="form-group right-field">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    profile.email
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        <h3>
                            Current Address
                        </h3>


                        {/* PROVINCE */}

                        <div className="form-group right-field">

                            <label>
                                Province
                            </label>

                            <input
                                type="text"
                                name="province"
                                value={
                                    profile.province
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* BARANGAY */}

                        <div className="form-group right-field">

                            <label>
                                Barangay
                            </label>

                            <input
                                type="text"
                                name="barangay"
                                value={
                                    profile.barangay
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* CITY */}

                        <div className="form-group right-field">

                            <label>
                                City
                            </label>

                            <input
                                type="text"
                                name="city"
                                value={
                                    profile.city
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>

                    </section>


                    {/* ==================================
                        ACTIONS
                    ================================== */}

                    <div className="profile-actions">

                        {message && (
                            <div className="success-message">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}


                        {!editing ? (

                            <button
                                className="edit-button"
                                onClick={
                                    handleEdit
                                }
                            >
                                ✎ Edit
                            </button>

                        ) : (

                            <div className="editing-buttons">

                                <button
                                    className="cancel-button"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    className="done-button"
                                    onClick={
                                        handleDone
                                    }
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "✓ Done"}
                                </button>

                            </div>

                        )}

                    </div>

                </main>

            </div>

        </div>
    );
};


export default Settings;