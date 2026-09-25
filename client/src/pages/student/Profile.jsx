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
    onProfileUpdated,
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
    // SYNCHRONIZE PROFILE WITH DASHBOARD
    // =====================================================

    const syncProfile = (updatedStudent) => {

        if (!updatedStudent) {
            return;
        }

        try {

            const storedStudent =
                localStorage.getItem(
                    "votaraStudent"
                );

            const parsedStudent =
                storedStudent
                    ? JSON.parse(storedStudent)
                    : {};

            localStorage.setItem(
                "votaraStudent",
                JSON.stringify({
                    ...parsedStudent,
                    ...updatedStudent,
                })
            );

        } catch (storageError) {

            console.warn(
                "Unable to synchronize student profile cache:",
                storageError
            );
        }

        if (typeof onProfileUpdated === "function") {
            onProfileUpdated(updatedStudent);
        }
    };


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
            syncProfile(student);

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

            const updatedStudent =
                data?.student
                    ? {
                        ...profile,
                        ...data.student,
                    }
                    : {
                        ...profile,
                        ...form,
                    };

            setProfile(updatedStudent);
            syncProfile(updatedStudent);

            setEditing(false);

            setMessage(
                "Your profile has been updated successfully."
            );

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

                    const updatedProfile = {
                        ...profile,
                        profilePicture:
                            data?.profilePicture ||
                            data?.student?.profilePicture ||
                            data?.student?.profile_picture ||
                            base64Image,
                    };

                    setProfile(updatedProfile);
                    syncProfile(updatedProfile);

                    setMessage(
                        "Profile picture updated successfully."
                    );

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

            const updatedProfile = {
                ...profile,
                profilePicture: "",
            };

            setProfile(updatedProfile);
            syncProfile(updatedProfile);

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


    const passwordStatus = {
        length:
            passwordForm.newPassword.length >= 8 &&
            passwordForm.newPassword.length <= 50,

        uppercase:
            /[A-Z]/.test(
                passwordForm.newPassword
            ),

        lowercase:
            /[a-z]/.test(
                passwordForm.newPassword
            ),

        number:
            /[0-9]/.test(
                passwordForm.newPassword
            ),

        special:
            /[^A-Za-z0-9]/.test(
                passwordForm.newPassword
            ),

        match:
            passwordForm.confirmPassword.length > 0 &&
            passwordForm.newPassword ===
                passwordForm.confirmPassword,
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
            newPassword.length < 8 ||
            newPassword.length > 50
        ) {

            setError(
                "Your new password must contain between 8 and 50 characters."
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
                                autoComplete="current-password"
                                maxLength={50}
                                value={
                                    passwordForm.currentPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
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
                                autoComplete="new-password"
                                maxLength={50}
                                minLength={8}
                                className={
                                    passwordForm.newPassword
                                        ? passwordStatus.length
                                            ? "password-input-valid"
                                            : "password-input-invalid"
                                        : ""
                                }
                                value={
                                    passwordForm.newPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                required
                            />

                            <div className="password-status-panel">

                                <div className="password-status-header">
                                    <small>
                                        Password requirements
                                    </small>

                                    <span
                                        className={
                                            passwordStatus.length
                                                ? "password-character-count valid"
                                                : "password-character-count"
                                        }
                                    >
                                        {passwordForm.newPassword.length}/50
                                    </span>
                                </div>

                                <div className="password-status-grid">

                                    <div
                                        className={
                                            passwordStatus.length
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.length ? "✓" : "!"}
                                        </span>

                                        <span>
                                            At least 8 characters
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            passwordStatus.uppercase
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.uppercase ? "✓" : "!"}
                                        </span>

                                        <span>
                                            Uppercase letter
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            passwordStatus.lowercase
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.lowercase ? "✓" : "!"}
                                        </span>

                                        <span>
                                            Lowercase letter
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            passwordStatus.number
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.number ? "✓" : "!"}
                                        </span>

                                        <span>
                                            Number
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            passwordStatus.special
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.special ? "✓" : "!"}
                                        </span>

                                        <span>
                                            Special character
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            passwordStatus.match
                                                ? "password-status-item valid"
                                                : "password-status-item warning"
                                        }
                                    >
                                        <span className="password-status-icon">
                                            {passwordStatus.match ? "✓" : "!"}
                                        </span>

                                        <span>
                                            Passwords match
                                        </span>
                                    </div>

                                </div>
                            </div>
                        </label>


                        <label>
                            <span>
                                Confirm New Password
                            </span>

                            <input
                                type="password"
                                name="confirmPassword"
                                autoComplete="new-password"
                                maxLength={50}
                                minLength={8}
                                className={
                                    passwordForm.confirmPassword
                                        ? passwordStatus.match
                                            ? "password-input-valid"
                                            : "password-input-invalid"
                                        : ""
                                }
                                value={
                                    passwordForm.confirmPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
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