import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    getStudentProfile,
    updateStudentProfile,
    updateStudentProfilePicture,
    removeStudentProfilePicture,
    changeStudentPassword,
} from "../../services/studentService";

import "./Profile.css";


const Profile = ({
    onClose,
}) => {

    const fileInputRef =
        useRef(null);

    const [
        profile,
        setProfile,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        uploadingPhoto,
        setUploadingPhoto,
    ] = useState(false);

    const [
        editing,
        setEditing,
    ] = useState(false);

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        message,
        setMessage,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        form,
        setForm,
    ] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        birthday: "",
        contactNumber: "",
        province: "",
        barangay: "",
        city: "",
    });

    const [
        passwordForm,
        setPasswordForm,
    ] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    const loadProfile = async () => {

        try {

            setLoading(true);
            setError("");

            const data =
                await getStudentProfile();

            const student =
                data?.student;

            if (!student) {
                throw new Error(
                    "Student profile was not found."
                );
            }

            setProfile(student);

            setForm({
                firstName:
                    student.firstName || "",

                middleName:
                    student.middleName || "",

                lastName:
                    student.lastName || "",

                birthday:
                    student.birthday || "",

                contactNumber:
                    student.contactNumber || "",

                province:
                    student.province || "",

                barangay:
                    student.barangay || "",

                city:
                    student.city || "",
            });

        } catch (err) {

            console.error(
                "Unable to load student profile:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load your profile."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadProfile();
    }, []);


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =====================================================
    // SAVE PROFILE
    // =====================================================

    const handleSaveProfile = async (
        event
    ) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");
            setMessage("");

            const data =
                await updateStudentProfile(
                    form
                );

            if (data?.student) {

                setProfile(
                    data.student
                );
            }

            setEditing(false);

            setMessage(
                "Your profile has been updated successfully."
            );

            // Keep local student information synchronized.
            const storedStudent =
                localStorage.getItem(
                    "votaraStudent"
                );

            if (storedStudent) {

                try {

                    const parsed =
                        JSON.parse(
                            storedStudent
                        );

                    localStorage.setItem(
                        "votaraStudent",
                        JSON.stringify({
                            ...parsed,
                            ...(data?.student || {}),
                        })
                    );

                } catch {
                    // Ignore local storage parsing errors.
                }
            }

        } catch (err) {

            console.error(
                "Unable to update profile:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to update your profile."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // PROFILE PHOTO
    // =====================================================

    const handleSelectPhoto = () => {

        fileInputRef.current?.click();
    };


    const handlePhotoChange = async (
        event
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setMessage("");

        // -----------------------------------------------
        // FILE TYPE
        // -----------------------------------------------

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            setError(
                "Please select a valid image file."
            );

            event.target.value = "";
            return;
        }


        // -----------------------------------------------
        // FILE SIZE
        // -----------------------------------------------

        if (
            file.size >
            1_500_000
        ) {

            setError(
                "Please choose an image smaller than 1.5 MB."
            );

            event.target.value = "";
            return;
        }


        try {

            setUploadingPhoto(true);

            const reader =
                new FileReader();

            reader.onload = async () => {

                try {

                    const base64Image =
                        reader.result;

                    const data =
                        await updateStudentProfilePicture(
                            base64Image
                        );

                    setProfile(
                        (previous) => ({
                            ...previous,
                            profilePicture:
                                data.profilePicture ||
                                base64Image,
                        })
                    );

                    setMessage(
                        "Profile picture updated successfully."
                    );

                    // Synchronize dashboard cache.
                    const storedStudent =
                        localStorage.getItem(
                            "votaraStudent"
                        );

                    if (storedStudent) {

                        try {

                            const parsed =
                                JSON.parse(
                                    storedStudent
                                );

                            localStorage.setItem(
                                "votaraStudent",
                                JSON.stringify({
                                    ...parsed,
                                    profilePicture:
                                        data.profilePicture ||
                                        base64Image,
                                })
                            );

                        } catch {
                            // Ignore local storage errors.
                        }
                    }

                } catch (err) {

                    console.error(
                        "Unable to update profile picture:",
                        err
                    );

                    setError(
                        err?.response?.data?.message ||
                        "Unable to update your profile picture."
                    );

                } finally {

                    setUploadingPhoto(false);
                    event.target.value = "";
                }
            };

            reader.onerror = () => {

                setUploadingPhoto(false);

                setError(
                    "Unable to read the selected image."
                );

                event.target.value = "";
            };

            reader.readAsDataURL(file);

        } catch (err) {

            setUploadingPhoto(false);

            setError(
                "Unable to process the selected image."
            );

            event.target.value = "";
        }
    };


    // =====================================================
    // REMOVE PHOTO
    // =====================================================

    const handleRemovePhoto = async () => {

        const confirmed =
            window.confirm(
                "Remove your current profile picture?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setUploadingPhoto(true);
            setError("");
            setMessage("");

            await removeStudentProfilePicture();

            setProfile(
                (previous) => ({
                    ...previous,
                    profilePicture: "",
                })
            );

            setMessage(
                "Profile picture removed successfully."
            );

        } catch (err) {

            console.error(
                "Unable to remove profile picture:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to remove your profile picture."
            );

        } finally {

            setUploadingPhoto(false);
        }
    };


    // =====================================================
    // PASSWORD CHANGE
    // =====================================================

    const handlePasswordChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;

        setPasswordForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };


    const handleChangePassword = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setMessage("");


        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = passwordForm;


        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            setError(
                "Please complete all password fields."
            );

            return;
        }


        if (
            newPassword.length !== 8
        ) {

            setError(
                "Your new password must contain exactly 8 characters."
            );

            return;
        }


        const requirements = {

            uppercase:
                /[A-Z]/.test(
                    newPassword
                ),

            lowercase:
                /[a-z]/.test(
                    newPassword
                ),

            number:
                /[0-9]/.test(
                    newPassword
                ),

            special:
                /[^A-Za-z0-9]/.test(
                    newPassword
                ),
        };


        if (
            !requirements.uppercase ||
            !requirements.lowercase ||
            !requirements.number ||
            !requirements.special
        ) {

            setError(
                "Password must contain uppercase, lowercase, number, and special character."
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            setError(
                "New password and confirmation password do not match."
            );

            return;
        }


        try {

            setSaving(true);

            const data =
                await changeStudentPassword(
                    passwordForm
                );

            setMessage(
                data?.message ||
                "Your password has been changed successfully."
            );

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setShowPassword(false);

        } catch (err) {

            console.error(
                "Unable to change password:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to change your password."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // PROFILE INITIALS
    // =====================================================

    const getInitials = () => {

        if (!profile) {
            return "ST";
        }

        const first =
            profile.firstName
                ?.charAt(0)
                ?.toUpperCase() || "";

        const last =
            profile.lastName
                ?.charAt(0)
                ?.toUpperCase() || "";

        return (
            `${first}${last}` ||
            "ST"
        );
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="votara-profile-page">

                <div className="profile-loading">

                    <div className="profile-spinner" />

                    <p>
                        Loading your profile...
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (
        !profile
    ) {

        return (
            <div className="votara-profile-page">

                <div className="profile-error-card">

                    <div className="profile-error-icon">
                        !
                    </div>

                    <h2>
                        Unable to Load Profile
                    </h2>

                    <p>
                        {error ||
                            "Your student profile could not be loaded."}
                    </p>

                    <button
                        type="button"
                        className="profile-primary-btn"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            className="profile-secondary-btn"
                            onClick={onClose}
                        >
                            Back
                        </button>
                    )}

                </div>

            </div>
        );
    }


    return (
        <div className="votara-profile-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="profile-header">

                <div>

                    <span className="profile-eyebrow">
                        STUDENT ACCOUNT
                    </span>

                    <h1>
                        My Profile
                    </h1>

                    <p>
                        View and manage your personal
                        Votara account information.
                    </p>

                </div>

                {onClose && (
                    <button
                        type="button"
                        className="profile-back-btn"
                        onClick={onClose}
                    >
                        ← Back
                    </button>
                )}

            </div>


            {/* =================================================
                ALERTS
            ================================================= */}

            {message && (
                <div className="profile-success-alert">
                    <span>✓</span>
                    {message}
                </div>
            )}

            {error && (
                <div className="profile-error-alert">
                    <span>!</span>
                    {error}
                </div>
            )}


            {/* =================================================
                PROFILE HERO
            ================================================= */}

            <section className="profile-card profile-hero-card">

                <div className="profile-photo-section">

                    <div className="profile-photo-wrapper">

                        {profile.profilePicture ? (

                            <img
                                src={
                                    profile.profilePicture
                                }
                                alt={
                                    profile.fullName ||
                                    "Student profile"
                                }
                                className="profile-photo"
                            />

                        ) : (

                            <div className="profile-photo-placeholder">
                                {getInitials()}
                            </div>

                        )}

                    </div>


                    <div className="profile-photo-actions">

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={
                                handlePhotoChange
                            }
                            hidden
                        />

                        <button
                            type="button"
                            className="profile-primary-btn"
                            onClick={
                                handleSelectPhoto
                            }
                            disabled={
                                uploadingPhoto
                            }
                        >
                            {uploadingPhoto
                                ? "Uploading..."
                                : "Change Photo"}
                        </button>

                        {profile.profilePicture && (
                            <button
                                type="button"
                                className="profile-link-btn"
                                onClick={
                                    handleRemovePhoto
                                }
                                disabled={
                                    uploadingPhoto
                                }
                            >
                                Remove Photo
                            </button>
                        )}

                        <small>
                            JPG, PNG or WEBP ·
                            Max 1.5 MB
                        </small>

                    </div>

                </div>


                <div className="profile-identity">

                    <span className="profile-status-badge">
                        <span className="status-dot" />
                        Active Student
                    </span>

                    <h2>
                        {profile.fullName}
                    </h2>

                    <p>
                        Student ID:{" "}
                        <strong>
                            {profile.studentId}
                        </strong>
                    </p>

                    <p>
                        Year Level:{" "}
                        <strong>
                            {profile.yearLevel}
                        </strong>
                    </p>

                </div>

            </section>


            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <section className="profile-card">

                <div className="profile-section-header">

                    <div>

                        <span>
                            PERSONAL INFORMATION
                        </span>

                        <h2>
                            Student Information
                        </h2>

                    </div>

                    {!editing && (
                        <button
                            type="button"
                            className="profile-outline-btn"
                            onClick={() =>
                                setEditing(true)
                            }
                        >
                            Edit Profile
                        </button>
                    )}

                </div>


                {editing ? (

                    <form
                        className="profile-form"
                        onSubmit={
                            handleSaveProfile
                        }
                    >

                        <div className="profile-form-grid">

                            <label>
                                <span>
                                    First Name
                                </span>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={
                                        form.firstName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </label>


                            <label>
                                <span>
                                    Middle Name
                                </span>

                                <input
                                    type="text"
                                    name="middleName"
                                    value={
                                        form.middleName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>


                            <label>
                                <span>
                                    Last Name
                                </span>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={
                                        form.lastName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </label>


                            <label>
                                <span>
                                    Birthday
                                </span>

                                <input
                                    type="date"
                                    name="birthday"
                                    value={
                                        form.birthday
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>


                            <label>
                                <span>
                                    Contact Number
                                </span>

                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={
                                        form.contactNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>


                            <label>
                                <span>
                                    Province
                                </span>

                                <input
                                    type="text"
                                    name="province"
                                    value={
                                        form.province
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>


                            <label>
                                <span>
                                    City / Municipality
                                </span>

                                <input
                                    type="text"
                                    name="city"
                                    value={
                                        form.city
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>


                            <label>
                                <span>
                                    Barangay
                                </span>

                                <input
                                    type="text"
                                    name="barangay"
                                    value={
                                        form.barangay
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </label>

                        </div>


                        <div className="profile-form-actions">

                            <button
                                type="button"
                                className="profile-secondary-btn"
                                onClick={() =>
                                    setEditing(false)
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="profile-primary-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </form>

                ) : (

                    <div className="profile-info-grid">

                        <div className="profile-info-item">
                            <span>
                                Full Name
                            </span>

                            <strong>
                                {profile.fullName ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Student ID
                            </span>

                            <strong>
                                {profile.studentId ||
                                    "Not available"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Year Level
                            </span>

                            <strong>
                                {profile.yearLevel ||
                                    "Not available"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Email Address
                            </span>

                            <strong>
                                {profile.email ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Contact Number
                            </span>

                            <strong>
                                {profile.contactNumber ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Birthday
                            </span>

                            <strong>
                                {profile.birthday ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Province
                            </span>

                            <strong>
                                {profile.province ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                City / Municipality
                            </span>

                            <strong>
                                {profile.city ||
                                    "Not provided"}
                            </strong>
                        </div>


                        <div className="profile-info-item">
                            <span>
                                Barangay
                            </span>

                            <strong>
                                {profile.barangay ||
                                    "Not provided"}
                            </strong>
                        </div>

                    </div>
                )}

            </section>


            {/* =================================================
                SECURITY
            ================================================= */}

            <section className="profile-card">

                <div className="profile-section-header">

                    <div>

                        <span>
                            ACCOUNT SECURITY
                        </span>

                        <h2>
                            Password
                        </h2>

                    </div>

                    <button
                        type="button"
                        className="profile-outline-btn"
                        onClick={() =>
                            setShowPassword(
                                (previous) =>
                                    !previous
                            )
                        }
                    >
                        {showPassword
                            ? "Close"
                            : "Change Password"}
                    </button>

                </div>


                {!showPassword ? (

                    <div className="security-summary">

                        <div className="security-icon">
                            🔐
                        </div>

                        <div>

                            <strong>
                                Password protected
                            </strong>

                            <p>
                                Change your password
                                regularly to keep your
                                account secure.
                            </p>

                        </div>

                    </div>

                ) : (

                    <form
                        className="password-form"
                        onSubmit={
                            handleChangePassword
                        }
                    >

                        <label>
                            <span>
                                Current Password
                            </span>

                            <input
                                type="password"
                                name="currentPassword"
                                value={
                                    passwordForm.currentPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                maxLength={8}
                                required
                            />
                        </label>


                        <label>
                            <span>
                                New Password
                            </span>

                            <input
                                type="password"
                                name="newPassword"
                                value={
                                    passwordForm.newPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                maxLength={8}
                                required
                            />

                            <small>
                                Exactly 8 characters:
                                uppercase, lowercase,
                                number and special character.
                            </small>
                        </label>


                        <label>
                            <span>
                                Confirm New Password
                            </span>

                            <input
                                type="password"
                                name="confirmPassword"
                                value={
                                    passwordForm.confirmPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                maxLength={8}
                                required
                            />
                        </label>


                        <div className="profile-form-actions">

                            <button
                                type="button"
                                className="profile-secondary-btn"
                                onClick={() =>
                                    setShowPassword(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="profile-primary-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Updating..."
                                    : "Update Password"}
                            </button>

                        </div>

                    </form>
                )}

            </section>

        </div>
    );
};


export default Profile;