import api from "./api";

// =========================================================
// VOTARA STUDENT SERVICE
// =========================================================
//
// Handles student profile and account settings.
//
// Existing authentication is preserved through api.js.
// We are NOT creating another Axios instance.
//
// =========================================================


// =========================================================
// GET STUDENT PROFILE
// =========================================================

export const getStudentProfile = async () => {
    const response = await api.get(
        "/students/profile"
    );

    return response.data;
};


// =========================================================
// UPDATE STUDENT PROFILE
// =========================================================

export const updateStudentProfile = async (
    profileData
) => {

    const response = await api.patch(
        "/students/profile",
        profileData
    );

    return response.data;
};


// =========================================================
// CHANGE STUDENT PASSWORD
// =========================================================

export const changeStudentPassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
}) => {

    const response = await api.patch(
        "/students/password",
        {
            currentPassword,
            newPassword,
            confirmPassword,
        }
    );

    return response.data;
};


// =========================================================
// UPDATE PROFILE PICTURE
// =========================================================

export const updateStudentProfilePicture = async (
    profilePicture
) => {

    const response = await api.patch(
        "/students/profile-picture",
        {
            profilePicture,
        }
    );

    return response.data;
};


// =========================================================
// REMOVE PROFILE PICTURE
// =========================================================

export const removeStudentProfilePicture = async () => {

    const response = await api.delete(
        "/students/profile-picture"
    );

    return response.data;
};


// =========================================================
// DEACTIVATE ACCOUNT
// =========================================================

export const deactivateStudentAccount = async () => {

    const response = await api.post(
        "/students/deactivate"
    );

    return response.data;
};


// =========================================================
// DELETE ACCOUNT
// =========================================================

export const deleteStudentAccount = async () => {

    const response = await api.delete(
        "/students/account"
    );

    return response.data;
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