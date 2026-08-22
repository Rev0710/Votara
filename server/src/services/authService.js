const API_URL =
    "http://localhost:5000/api/auth";


// =====================================================
// STUDENT LOGIN
// =====================================================

export const studentLogin = async (
    studentId,
    password
) => {

    const response =
        await fetch(
            `${API_URL}/student-login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    studentId,
                    password,
                }),
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Unable to login."
        );
    }

    return data;
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changeTemporaryPassword =
    async (
        token,
        newPassword,
        confirmPassword
    ) => {

        const response =
            await fetch(
                `${API_URL}/change-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        newPassword,
                        confirmPassword,
                    }),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to change password."
            );
        }

        return data;
    };


// =====================================================
// UPLOAD PROFILE PICTURE
// =====================================================

export const uploadProfilePicture =
    async (
        token,
        profilePicture
    ) => {

        const response =
            await fetch(
                `${API_URL}/profile-picture`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        profilePicture,
                    }),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to upload profile picture."
            );
        }

        return data;
    };


// =====================================================
// GET CURRENT STUDENT
// =====================================================

export const getCurrentStudent =
    async (token) => {

        const response =
            await fetch(
                `${API_URL}/me`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to get student information."
            );
        }

        return data;
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