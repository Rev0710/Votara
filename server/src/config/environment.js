const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "../../.env"),
});

const environment = {
    port: process.env.PORT || 5000,

    
    mongoUri: process.env.MONGO_URI || "",

    
    jwtSecret: process.env.JWT_SECRET || "",

    emailHost: process.env.EMAIL_HOST || "",
    emailPort: process.env.EMAIL_PORT || "",
    emailUser: process.env.EMAIL_USER || "",
    emailPass: process.env.EMAIL_PASS || "",

    defaultStudentPassword:
        process.env.DEFAULT_STUDENT_PASSWORD || "",

    
    supabaseUrl:
        process.env.SUPABASE_URL || "",

    supabaseSecretKey:
        process.env.SUPABASE_SECRET_KEY || "",
};

const validateEnvironment = () => {
    const requiredVariables = [];

    if (!environment.jwtSecret) {
        requiredVariables.push("JWT_SECRET");
    }

    if (!environment.supabaseUrl) {
        requiredVariables.push("SUPABASE_URL");
    }

    if (!environment.supabaseSecretKey) {
        requiredVariables.push("SUPABASE_SECRET_KEY");
    }

    if (requiredVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${requiredVariables.join(", ")}`
        );
    }
};

module.exports = {
    environment,
    validateEnvironment,
};