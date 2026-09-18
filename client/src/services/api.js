import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "https://votara-api-olij.onrender.com",

    headers: {
        "Content-Type": "application/json",
    },
});

// =====================================================
// AUTHENTICATION INTERCEPTOR
// =====================================================

api.interceptors.request.use(
    (config) => {
        // =================================================
        // GET AUTHENTICATION TOKENS
        // =================================================

        const staffToken =
            localStorage.getItem("votaraStaffToken");

        const ebToken =
            localStorage.getItem("votaraEBToken");

        const studentToken =
            localStorage.getItem("votaraToken");

        // =================================================
        // SELECT TOKEN
        // =================================================
        // Priority:
        // 1. Electoral Board token
        // 2. Staff/Admin token
        // 3. Student token
        //
        // This allows EB requests such as:
        // /api/eb/registrations
        // to correctly send the EB JWT.
        // =================================================

        const token =
            ebToken ||
            staffToken ||
            studentToken;

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        if (error.response) {
            console.error(
                "API Error:",
                error.response.status,
                error.response.data
            );
        } else {
            console.error(
                "API Network Error:",
                error.message
            );
        }

        return Promise.reject(error);
    }
);

export default api;