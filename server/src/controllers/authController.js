// ============================================================
// VOTARA - STUDENT AUTHENTICATION CONTROLLER
// Supabase + bcrypt + JWT
// ============================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const supabase = require("../config/supabase");

// ============================================================
// CONFIGURATION
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is not configured in server/.env");
}

// Existing VOTARA private bucket
const PROFILE_BUCKET = "student-verification";

// ============================================================
// HELPERS
// ============================================================

function normalizeStudentId(value) {
    return String(value || "").trim();
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

// ------------------------------------------------------------
// Password validation
// ------------------------------------------------------------

function validatePassword(password) {
    const value = String(password || "");

    if (value.length < 8) {
        return "Password must be at least 8 characters long.";
    }

    if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(value)) {
        return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
        return "Password must contain at least one special character.";
    }

    return null;
}

// ------------------------------------------------------------
// JWT creation
// ------------------------------------------------------------

function createStudentToken(student) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            id: student.id,
            studentId: student.student_id,
            role: "student",
        },
        JWT_SECRET,
        {
            expiresIn: "8h",
        }
    );
}

// ------------------------------------------------------------
// Get complete student information
// ------------------------------------------------------------

async function getStudentData(studentId) {
    const normalizedStudentId = normalizeStudentId(studentId);

    // --------------------------------------------------------
    // Official enrollment record
    // --------------------------------------------------------

    const { data: rosterStudent, error: rosterError } =
        await supabase
            .from("students")
            .select(
                `
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
                `
            )
            .eq("student_id", normalizedStudentId)
            .maybeSingle();

    if (rosterError) {
        throw new Error(
            `Failed to retrieve student roster record: ${rosterError.message}`
        );
    }

    if (!rosterStudent) {
        return null;
    }

    // --------------------------------------------------------
    // Student account
    // --------------------------------------------------------

    const { data: account, error: accountError } =
        await supabase
            .from("student_accounts")
            .select(
                `
                id,
                student_id,
                registration_id,
                email,
                must_change_password,
                account_status,
                profile_photo_storage_path,
                last_login_at,
                created_at,
                updated_at
                `
            )
            .eq("student_id", normalizedStudentId)
            .maybeSingle();

    if (accountError) {
        throw new Error(
            `Failed to retrieve student account: ${accountError.message}`
        );
    }

    // --------------------------------------------------------
    // Latest registration application
    // --------------------------------------------------------

    const { data: registration, error: registrationError } =
        await supabase
            .from("registration_applications")
            .select(
                `
                id,
                student_id,
                registration_type,
                application_status,
                email,
                full_name,
                year_level,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                submitted_at,
                reviewed_at,
                rejection_reason,
                correction_message
                `
            )
            .eq("student_id", normalizedStudentId)
            .order("created_at", {
                ascending: false,
            })
            .limit(1)
            .maybeSingle();

    if (registrationError) {
        throw new Error(
            `Failed to retrieve registration application: ${registrationError.message}`
        );
    }

    return {
        rosterStudent,
        account,
        registration,
    };
}

// ============================================================
// STUDENT LOGIN
// ============================================================

const studentLogin = async (req, res) => {
    try {
        const studentId = normalizeStudentId(req.body.studentId);
        const password = String(req.body.password || "");

        if (!studentId || !password) {
            return res.status(400).json({
                success: false,
                message: "Student ID and password are required.",
            });
        }

        // ----------------------------------------------------
        // 1. Find official student
        // ----------------------------------------------------

        const { data: rosterStudent, error: rosterError } =
            await supabase
                .from("students")
                .select(
                    `
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (rosterError) {
            console.error(
                "Student roster lookup error:",
                rosterError
            );

            return res.status(500).json({
                success: false,
                message: "Unable to verify student information.",
            });
        }

        if (!rosterStudent) {
            return res.status(401).json({
                success: false,
                message:
                    "Student ID was not found in the official enrollment record.",
            });
        }

        // ----------------------------------------------------
        // 2. Verify active enrollment
        // ----------------------------------------------------

        if (
            String(rosterStudent.enrollment_status || "")
                .toUpperCase() !== "ACTIVE"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This student account is not currently eligible for voting.",
            });
        }

        // ----------------------------------------------------
        // 3. Find student account
        // ----------------------------------------------------

        const { data: account, error: accountError } =
            await supabase
                .from("student_accounts")
                .select(
                    `
                    id,
                    student_id,
                    registration_id,
                    email,
                    password_hash,
                    must_change_password,
                    account_status,
                    profile_photo_storage_path,
                    last_login_at,
                    created_at,
                    updated_at
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (accountError) {
            console.error(
                "Student account lookup error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve student account.",
            });
        }

        // ----------------------------------------------------
        // 4. Account does not exist
        // ----------------------------------------------------

        if (!account) {
            return res.status(403).json({
                success: false,
                message:
                    "Your student account has not been activated yet. Please wait for Electoral Board approval.",
            });
        }

        // ----------------------------------------------------
        // 5. Check account status
        // ----------------------------------------------------

        if (account.account_status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Your student account is currently disabled. Please contact the Electoral Board.",
            });
        }

        // ----------------------------------------------------
        // 6. Verify password
        // ----------------------------------------------------

        if (!account.password_hash) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account does not have a valid password yet. Please contact the Electoral Board.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            account.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid Student ID or password.",
            });
        }

        // ----------------------------------------------------
        // 7. Update last login
        // ----------------------------------------------------

        const { error: loginUpdateError } =
            await supabase
                .from("student_accounts")
                .update({
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", account.id);

        if (loginUpdateError) {
            console.warn(
                "⚠️ Could not update last_login_at:",
                loginUpdateError.message
            );
        }

        // ----------------------------------------------------
        // 8. Create JWT
        // ----------------------------------------------------

        const token = createStudentToken(rosterStudent);

        // ----------------------------------------------------
        // 9. Determine next step
        // ----------------------------------------------------

        const mustChangePassword =
            account.must_change_password === true;

        const needsProfilePicture =
            !account.profile_photo_storage_path;

        let nextStep = "dashboard";

        if (mustChangePassword) {
            nextStep = "change_password";
        } else if (needsProfilePicture) {
            nextStep = "upload_profile_picture";
        }

        // ----------------------------------------------------
        // 10. Voting status
        //
        // IMPORTANT:
        // The current students table does not contain has_voted.
        // We therefore do not invent a database field here.
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            message: mustChangePassword
                ? "Login successful. Please change your temporary password."
                : "Login successful.",

            token,

            student: {
                id: rosterStudent.id,
                studentId: rosterStudent.student_id,
                fullName: rosterStudent.full_name,
                yearLevel: rosterStudent.year_level,

                email: account.email,

                registrationStatus:
                    account.registration_id
                        ? "approved"
                        : "not_registered",

                registrationId: account.registration_id,

                mustChangePassword,

                needsProfilePicture,

                profilePicture:
                    account.profile_photo_storage_path || null,

                hasVoted: false,

                nextStep,
            },
        });
    } catch (error) {
        console.error("❌ Student login error:", error);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during login.",
        });
    }
};

// ============================================================
// CHANGE TEMPORARY PASSWORD
// ============================================================

const changeTemporaryPassword = async (req, res) => {
    try {
        const studentId = normalizeStudentId(
            req.student?.studentId ||
                req.body.studentId
        );

        const newPassword = String(
            req.body.newPassword ||
                req.body.password ||
                ""
        );

        const confirmPassword = String(
            req.body.confirmPassword ||
                ""
        );

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is required.",
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password is required.",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        // ----------------------------------------------------
        // Find account
        // ----------------------------------------------------

        const { data: account, error: accountError } =
            await supabase
                .from("student_accounts")
                .select(
                    `
                    id,
                    student_id,
                    email,
                    account_status,
                    must_change_password
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (accountError) {
            console.error(
                "Password account lookup error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve student account.",
            });
        }

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Student account was not found.",
            });
        }

        if (account.account_status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your student account is disabled.",
            });
        }

        // ----------------------------------------------------
        // Hash new password
        // ----------------------------------------------------

        const passwordHash = await bcrypt.hash(
            newPassword,
            12
        );

        // ----------------------------------------------------
        // Update account
        // ----------------------------------------------------

        const { data: updatedAccount, error: updateError } =
            await supabase
                .from("student_accounts")
                .update({
                    password_hash: passwordHash,
                    must_change_password: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", account.id)
                .select(
                    `
                    id,
                    student_id,
                    email,
                    must_change_password,
                    account_status,
                    profile_photo_storage_path
                    `
                )
                .single();

        if (updateError) {
            console.error(
                "Password update error:",
                updateError
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update your password.",
            });
        }

        // ----------------------------------------------------
        // Get official student record
        // ----------------------------------------------------

        const { data: rosterStudent, error: rosterError } =
            await supabase
                .from("students")
                .select(
                    `
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (rosterError || !rosterStudent) {
            return res.status(500).json({
                success: false,
                message:
                    "Password was updated, but student information could not be retrieved.",
            });
        }

        // ----------------------------------------------------
        // Create fresh JWT
        // ----------------------------------------------------

        const token = createStudentToken(rosterStudent);

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully.",

            token,

            student: {
                id: rosterStudent.id,
                studentId: rosterStudent.student_id,
                fullName: rosterStudent.full_name,
                yearLevel: rosterStudent.year_level,
                email: updatedAccount.email,

                mustChangePassword: false,

                needsProfilePicture:
                    !updatedAccount.profile_photo_storage_path,

                profilePicture:
                    updatedAccount.profile_photo_storage_path ||
                    null,

                nextStep:
                    updatedAccount.profile_photo_storage_path
                        ? "dashboard"
                        : "upload_profile_picture",
            },
        });
    } catch (error) {
        console.error(
            "❌ Change temporary password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "An unexpected error occurred while changing your password.",
        });
    }
};

// ============================================================
// UPLOAD PROFILE PICTURE
// ============================================================

const uploadProfilePicture = async (req, res) => {
    try {
        const studentId = normalizeStudentId(
            req.student?.studentId ||
                req.body.studentId
        );

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is required.",
            });
        }

        // ----------------------------------------------------
        // Accept the existing frontend's profilePicture field.
        //
        // Supports:
        // data:image/jpeg;base64,...
        // data:image/png;base64,...
        // ----------------------------------------------------

        const profilePicture =
            req.body.profilePicture ||
            req.body.photo ||
            req.body.image;

        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message: "Profile picture is required.",
            });
        }

        if (
            typeof profilePicture !== "string" ||
            !profilePicture.startsWith("data:image/")
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid profile picture format. Please upload an image.",
            });
        }

        // ----------------------------------------------------
        // Parse data URL
        // ----------------------------------------------------

        const match = profilePicture.match(
            /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i
        );

        if (!match) {
            return res.status(400).json({
                success: false,
                message:
                    "Only JPEG, PNG, and WebP profile pictures are supported.",
            });
        }

        const contentType = match[1].toLowerCase();
        const base64Data = match[2];

        const imageBuffer = Buffer.from(
            base64Data,
            "base64"
        );

        // ----------------------------------------------------
        // Limit profile picture to 5 MB
        // ----------------------------------------------------

        const MAX_SIZE = 5 * 1024 * 1024;

        if (imageBuffer.length > MAX_SIZE) {
            return res.status(400).json({
                success: false,
                message:
                    "Profile picture must not exceed 5 MB.",
            });
        }

        // ----------------------------------------------------
        // Find student account
        // ----------------------------------------------------

        const { data: account, error: accountError } =
            await supabase
                .from("student_accounts")
                .select(
                    `
                    id,
                    student_id,
                    must_change_password,
                    account_status,
                    profile_photo_storage_path
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (accountError) {
            console.error(
                "Profile account lookup error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve your student account.",
            });
        }

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Student account was not found.",
            });
        }

        if (account.account_status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Your student account is disabled.",
            });
        }

        if (account.must_change_password) {
            return res.status(403).json({
                success: false,
                message:
                    "Please change your password before uploading your profile picture.",
            });
        }

        // ----------------------------------------------------
        // Determine extension
        // ----------------------------------------------------

        let extension = "jpg";

        if (contentType === "image/png") {
            extension = "png";
        } else if (contentType === "image/webp") {
            extension = "webp";
        }

        // ----------------------------------------------------
        // Generate unique storage path
        // ----------------------------------------------------

        const uniqueName = crypto
            .randomBytes(16)
            .toString("hex");

        const storagePath =
            `student-profiles/${studentId}/profile-${uniqueName}.${extension}`;

        // ----------------------------------------------------
        // Upload to private Supabase Storage bucket
        // ----------------------------------------------------

        const { error: uploadError } =
            await supabase.storage
                .from(PROFILE_BUCKET)
                .upload(
                    storagePath,
                    imageBuffer,
                    {
                        contentType,
                        upsert: false,
                    }
                );

        if (uploadError) {
            console.error(
                "Profile picture upload error:",
                uploadError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to upload your profile picture.",
            });
        }

        // ----------------------------------------------------
        // Delete previous profile picture if one exists
        // ----------------------------------------------------

        if (account.profile_photo_storage_path) {
            const { error: deleteError } =
                await supabase.storage
                    .from(PROFILE_BUCKET)
                    .remove([
                        account.profile_photo_storage_path,
                    ]);

            if (deleteError) {
                console.warn(
                    "⚠️ Previous profile picture could not be deleted:",
                    deleteError.message
                );
            }
        }

        // ----------------------------------------------------
        // Save storage path
        // ----------------------------------------------------

        const { data: updatedAccount, error: updateError } =
            await supabase
                .from("student_accounts")
                .update({
                    profile_photo_storage_path:
                        storagePath,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", account.id)
                .select(
                    `
                    id,
                    student_id,
                    email,
                    must_change_password,
                    account_status,
                    profile_photo_storage_path
                    `
                )
                .single();

        if (updateError) {
            console.error(
                "Profile account update error:",
                updateError
            );

            // Try to remove newly uploaded file if DB update failed
            await supabase.storage
                .from(PROFILE_BUCKET)
                .remove([storagePath]);

            return res.status(500).json({
                success: false,
                message:
                    "Profile picture was uploaded but could not be saved to your account.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Profile picture uploaded successfully.",

            profilePicture:
                updatedAccount.profile_photo_storage_path,

            student: {
                studentId:
                    updatedAccount.student_id,

                email:
                    updatedAccount.email,

                needsProfilePicture: false,

                profilePicture:
                    updatedAccount.profile_photo_storage_path,

                nextStep: "dashboard",
            },
        });
    } catch (error) {
        console.error(
            "❌ Upload profile picture error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "An unexpected error occurred while uploading your profile picture.",
        });
    }
};

// ============================================================
// GET CURRENT STUDENT
// ============================================================

const getCurrentStudent = async (req, res) => {
    try {
        const studentId = normalizeStudentId(
            req.student?.studentId
        );

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is required.",
            });
        }

        // ----------------------------------------------------
        // Official student record
        // ----------------------------------------------------

        const { data: rosterStudent, error: rosterError } =
            await supabase
                .from("students")
                .select(
                    `
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (rosterError) {
            console.error(
                "Current student roster error:",
                rosterError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve student information.",
            });
        }

        if (!rosterStudent) {
            return res.status(404).json({
                success: false,
                message:
                    "Student record was not found.",
            });
        }

        // ----------------------------------------------------
        // Verify active enrollment
        // ----------------------------------------------------

        if (
            String(rosterStudent.enrollment_status || "")
                .toUpperCase() !== "ACTIVE"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This student is not currently active.",
            });
        }

        // ----------------------------------------------------
        // Student account
        // ----------------------------------------------------

        const { data: account, error: accountError } =
            await supabase
                .from("student_accounts")
                .select(
                    `
                    id,
                    student_id,
                    registration_id,
                    email,
                    must_change_password,
                    account_status,
                    profile_photo_storage_path,
                    last_login_at
                    `
                )
                .eq("student_id", studentId)
                .maybeSingle();

        if (accountError) {
            console.error(
                "Current student account error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve student account.",
            });
        }

        if (!account) {
            return res.status(404).json({
                success: false,
                message:
                    "Student account was not found.",
            });
        }

        if (account.account_status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Your student account is disabled.",
            });
        }

        // ----------------------------------------------------
        // Registration application
        // ----------------------------------------------------

        let registration = null;

        if (account.registration_id) {
            const {
                data,
                error,
            } = await supabase
                .from("registration_applications")
                .select(
                    `
                    id,
                    student_id,
                    registration_type,
                    application_status,
                    email,
                    full_name,
                    year_level,
                    birthday,
                    contact_number,
                    province,
                    barangay,
                    city,
                    submitted_at,
                    reviewed_at
                    `
                )
                .eq("id", account.registration_id)
                .maybeSingle();

            if (error) {
                console.warn(
                    "⚠️ Registration lookup failed:",
                    error.message
                );
            } else {
                registration = data;
            }
        }

        return res.status(200).json({
            success: true,

            student: {
                id: rosterStudent.id,

                studentId:
                    rosterStudent.student_id,

                fullName:
                    rosterStudent.full_name,

                yearLevel:
                    rosterStudent.year_level,

                email:
                    account.email,

                registrationStatus:
                    registration?.application_status ||
                    "approved",

                registrationType:
                    registration?.registration_type ||
                    "normal",

                registrationId:
                    account.registration_id,

                birthday:
                    registration?.birthday || "",

                contactNumber:
                    registration?.contact_number || "",

                province:
                    registration?.province || "",

                barangay:
                    registration?.barangay || "",

                city:
                    registration?.city || "",

                mustChangePassword:
                    account.must_change_password,

                needsProfilePicture:
                    !account.profile_photo_storage_path,

                profilePicture:
                    account.profile_photo_storage_path ||
                    null,

                hasVoted: false,

                lastLoginAt:
                    account.last_login_at,

                nextStep:
                    account.must_change_password
                        ? "change_password"
                        : !account.profile_photo_storage_path
                        ? "upload_profile_picture"
                        : "dashboard",
            },
        });
    } catch (error) {
        console.error(
            "❌ Get current student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "An unexpected error occurred while retrieving your account.",
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    studentLogin,
    changeTemporaryPassword,
    uploadProfilePicture,
    getCurrentStudent,
};