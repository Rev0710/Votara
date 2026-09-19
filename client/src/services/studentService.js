import api from "./api";

// =========================================================
// STUDENT PROFILE SERVICE
// =========================================================
//
// All requests use the existing api.js instance so the
// student's existing JWT authentication is preserved.
//
// Base API:
// /api/students
//
// =========================================================


// =========================================================
// GET STUDENT PROFILE
// =========================================================

export const getStudentProfile = async () => {
    try {
        const response = await api.get(
            "/students/profile"
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to load student profile:",
            error
        );

        throw error;
    }
};


// =========================================================
// UPDATE STUDENT PROFILE
// =========================================================

export const updateStudentProfile = async (
    profileData
) => {
    try {

        const response = await api.patch(
            "/students/profile",
            profileData
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to update student profile:",
            error
        );

        throw error;
    }
};


// =========================================================
// CHANGE STUDENT PASSWORD
// =========================================================

export const changeStudentPassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
}) => {

    try {

        const response = await api.patch(
            "/students/password",
            {
                currentPassword,
                newPassword,
                confirmPassword,
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to change student password:",
            error
        );

        throw error;
    }
};


// =========================================================
// UPDATE PROFILE PICTURE
// =========================================================

export const updateStudentProfilePicture = async (
    profilePicture
) => {

    try {

        const response = await api.patch(
            "/students/profile-picture",
            {
                profilePicture,
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to update profile picture:",
            error
        );

        throw error;
    }
};


// =========================================================
// REMOVE PROFILE PICTURE
// =========================================================

export const removeStudentProfilePicture = async () => {

    try {

        const response = await api.delete(
            "/students/profile-picture"
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to remove profile picture:",
            error
        );

        throw error;
    }
};


// =========================================================
// DEACTIVATE STUDENT ACCOUNT
// =========================================================

export const deactivateStudentAccount = async () => {

    try {

        const response = await api.post(
            "/students/deactivate"
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to deactivate student account:",
            error
        );

        throw error;
    }
};


// =========================================================
// DELETE / REQUEST STUDENT ACCOUNT DELETION
// =========================================================

export const deleteStudentAccount = async () => {

    try {

        const response = await api.delete(
            "/students/account"
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Unable to delete student account:",
            error
        );

        throw error;
    }
};


// =========================================================
// DEFAULT EXPORT
// =========================================================

const studentService = {

    getStudentProfile,

    updateStudentProfile,

    changeStudentPassword,

    updateStudentProfilePicture,

    removeStudentProfilePicture,

    deactivateStudentAccount,

    deleteStudentAccount,

};

export default studentService;