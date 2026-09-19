import api from "./api";


// =====================================================
// STUDENT LOGIN
// =====================================================

export const studentLogin = async (
    studentId,
    password
) => {

    try {

        const response =
            await api.post(
                "/auth/student-login",
                {
                    studentId,
                    password,
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Student login error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to login."
        );

    }

};


// =====================================================
// CHANGE TEMPORARY PASSWORD
// =====================================================

export const changeTemporaryPassword = async (
    token,
    newPassword,
    confirmPassword
) => {

    try {

        const response =
            await api.post(
                "/auth/change-password",
                {
                    newPassword,
                    confirmPassword,
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Change temporary password error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to change password."
        );

    }

};


// =====================================================
// UPLOAD PROFILE PICTURE
// =====================================================

export const uploadProfilePicture = async (
    token,
    profilePicture
) => {

    try {

        const response =
            await api.post(
                "/auth/profile-picture",
                {
                    profilePicture,
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Upload profile picture error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to upload profile picture."
        );

    }

};


// =====================================================
// GET CURRENT STUDENT
// =====================================================

export const getCurrentStudent = async (
    token
) => {

    try {

        const response =
            await api.get(
                "/auth/me",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Get current student error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to get student information."
        );

    }

};


// =====================================================
// LOGOUT
// =====================================================

export const logoutStudent = () => {

    localStorage.removeItem(
        "votaraToken"
    );

    localStorage.removeItem(
        "votaraStudent"
    );

};


// =====================================================
// GET STUDENT PROFILE
// =====================================================

export const getStudentProfile = async (
    token
) => {

    try {

        const response =
            await api.get(
                "/profile",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Get student profile error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to load profile."
        );

    }

};


// =====================================================
// UPDATE STUDENT PROFILE
// =====================================================

export const updateStudentProfile = async (
    token,
    profileData
) => {

    try {

        const response =
            await api.put(
                "/profile",
                profileData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        return response.data;

    } catch (error) {

        console.error(
            "Update student profile error:",
            error
        );


        throw new Error(
            error.response?.data?.message ||
            "Unable to update profile."
        );

    }

};