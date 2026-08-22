import api from "./api";

// =====================================================
// STUDENT LOGIN
// =====================================================

export const studentLogin = async (
    studentId,
    password
) => {
    try {

        const response = await api.post(
            "/auth/student-login",
            {
                studentId,
                password,
            }
        );

        // =============================================
        // CHECK RESPONSE
        // =============================================

        if (!response.data) {
            throw new Error(
                "No response received from the server."
            );
        }

        if (
            response.data.success === false
        ) {
            throw new Error(
                response.data.message ||
                "Unable to login."
            );
        }

        return response.data;

    } catch (error) {

        console.error(
            "❌ Student login API error:",
            error
        );

        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Unable to login. Please try again."
        );
    }
};


// =====================================================
// CHANGE TEMPORARY PASSWORD
// =====================================================

export const changeTemporaryPassword = async (
    newPassword,
    confirmPassword
) => {

    // =============================================
    // GET JWT TOKEN
    // =============================================

    const token =
        localStorage.getItem("votaraToken");

    if (!token) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }

    try {

        console.log(
            "🔐 Sending change-password request..."
        );

        const response = await api.post(
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

        console.log(
            "✅ Change password response:",
            response.data
        );

        if (
            response.data.success === false
        ) {
            throw new Error(
                response.data.message ||
                "Unable to change password."
            );
        }

        return response.data;

    } catch (error) {

        console.error(
            "❌ Change password API error:",
            error
        );

        // =============================================
        // JWT EXPIRED / INVALID
        // =============================================

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem(
                "votaraToken"
            );

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Unable to change password."
        );
    }
};


// =====================================================
// UPLOAD PROFILE PICTURE
// =====================================================

export const uploadProfilePicture = async (
    profilePicture
) => {

    // =============================================
    // GET JWT TOKEN
    // =============================================

    const token =
        localStorage.getItem("votaraToken");

    if (!token) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }

    try {

        console.log(
            "📸 Sending profile picture..."
        );

        const response = await api.post(
            "/auth/upload-profile-picture",
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

        console.log(
            "✅ Profile picture response:",
            response.data
        );

        if (
            response.data.success === false
        ) {
            throw new Error(
                response.data.message ||
                "Unable to upload profile picture."
            );
        }

        return response.data;

    } catch (error) {

        console.error(
            "❌ Profile picture API error:",
            error
        );

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem(
                "votaraToken"
            );

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Unable to upload profile picture."
        );
    }
};


// =====================================================
// GET CURRENT STUDENT
// =====================================================

export const getCurrentStudent = async () => {

    const token =
        localStorage.getItem("votaraToken");

    if (!token) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }

    try {

        const response = await api.get(
            "/auth/student/me",
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
            "❌ Get current student error:",
            error
        );

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem(
                "votaraToken"
            );

            localStorage.removeItem(
                "votaraStudent"
            );

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        throw new Error(
            error.response?.data?.message ||
            "Unable to get student information."
        );
    }
};


// =====================================================
// LOGOUT
// =====================================================

export const studentLogout = () => {

    localStorage.removeItem(
        "votaraToken"
    );

    localStorage.removeItem(
        "votaraStudent"
    );
};