// =========================================================
// VOTARA PROFILE SERVICE
// =========================================================
// This service re-exports the existing student profile APIs.
// It does NOT create another Axios instance.
// It keeps the existing studentService/backend logic intact.
// =========================================================

import {
    getStudentProfile,
    updateStudentProfile,
    updateStudentProfilePicture,
    removeStudentProfilePicture,
    changeStudentPassword,
} from "./studentService";

// =========================================================
// GET PROFILE
// =========================================================

export const fetchStudentProfile = async () => {
    return await getStudentProfile();
};

// =========================================================
// UPDATE PROFILE
// =========================================================

export const saveStudentProfile = async (
    profileData
) => {
    return await updateStudentProfile(profileData);
};

// =========================================================
// UPDATE PROFILE PICTURE
// =========================================================

export const saveStudentProfilePicture = async (
    profilePicture
) => {
    return await updateStudentProfilePicture(
        profilePicture
    );
};

// =========================================================
// REMOVE PROFILE PICTURE
// =========================================================

export const deleteStudentProfilePicture = async () => {
    return await removeStudentProfilePicture();
};

// =========================================================
// CHANGE PASSWORD
// =========================================================

export const changeStudentPasswordService = async ({
    currentPassword,
    newPassword,
    confirmPassword,
}) => {
    return await changeStudentPassword({
        currentPassword,
        newPassword,
        confirmPassword,
    });
};

// =========================================================
// DEFAULT EXPORT
// =========================================================

const profileService = {
    fetchStudentProfile,
    saveStudentProfile,
    saveStudentProfilePicture,
    deleteStudentProfilePicture,
    changeStudentPasswordService,
};

export default profileService;