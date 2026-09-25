const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const supabase = require("../config/supabase");


// =========================================================
// HELPERS
// =========================================================

const getStudentIdFromRequest = (req) => {
    return (
        req.student?.studentId ||
        req.student?.student_id ||
        null
    );
};


const cleanString = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
};


const buildFullName = ({
    firstName,
    middleName,
    lastName,
}) => {

    return [
        cleanString(firstName),
        cleanString(middleName),
        cleanString(lastName),
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
};


const splitFullName = (fullName) => {

    const parts = cleanString(fullName)
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return {
            firstName: "",
            middleName: "",
            lastName: "",
        };
    }

    if (parts.length === 1) {
        return {
            firstName: parts[0],
            middleName: "",
            lastName: "",
        };
    }

    if (parts.length === 2) {
        return {
            firstName: parts[0],
            middleName: "",
            lastName: parts[1],
        };
    }

    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(" "),
        lastName: parts[parts.length - 1],
    };
};


const normalizeProfile = (
    student,
    account
) => {

    const fallback =
        splitFullName(
            student.full_name
        );

    const firstName =
        student.first_name ||
        fallback.firstName ||
        "";

    const middleName =
        student.middle_name ||
        fallback.middleName ||
        "";

    const lastName =
        student.last_name ||
        fallback.lastName ||
        "";

    return {

        id:
            student.id,

        studentId:
            student.student_id,

        firstName,

        middleName,

        lastName,

        fullName:
            student.full_name ||
            buildFullName({
                firstName,
                middleName,
                lastName,
            }),

        yearLevel:
            student.year_level,

        birthday:
            student.birthday || "",

        contactNumber:
            student.contact_number || "",

        email:
            account?.email || "",

        province:
            student.province || "",

        barangay:
            student.barangay || "",

        city:
            student.city || "",

        profilePicture:
            student.profile_picture || "",

        profilePictureUploadedAt:
            student.profile_picture_uploaded_at ||
            null,

        profileUpdatedAt:
            student.profile_updated_at ||
            null,

        accountStatus:
            account?.account_status ||
            "active",

        mustChangePassword:
            Boolean(
                account?.must_change_password
            ),

        passwordChangedAt:
            account?.password_changed_at ||
            null,
    };
};


// =========================================================
// GET STUDENT PROFILE
// =========================================================

const getStudentProfile = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        // -------------------------------------------------
        // STUDENT
        // -------------------------------------------------

        const {
            data: student,
            error: studentError,
        } = await supabase
            .from("students")
            .select(`
                id,
                student_id,
                full_name,
                year_level,
                first_name,
                middle_name,
                last_name,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                profile_picture,
                profile_picture_uploaded_at,
                profile_updated_at
            `)
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();


        if (studentError) {

            console.error(
                "❌ Student profile query error:",
                studentError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load student profile.",
            });

        }


        if (!student) {

            return res.status(404).json({
                success: false,
                message:
                    "Student profile was not found.",
            });

        }


        // -------------------------------------------------
        // ACCOUNT
        // -------------------------------------------------

        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("student_accounts")
            .select(`
                id,
                student_id,
                email,
                account_status,
                must_change_password,
                password_changed_at,
                deactivated_at,
                deletion_requested_at
            `)
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();


        if (accountError) {

            console.error(
                "❌ Student account query error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load student account information.",
            });

        }


        const profile =
            normalizeProfile(
                student,
                account
            );


        return res.status(200).json({

            success: true,

            student: profile,

            account: {
                id:
                    account?.id || null,

                status:
                    account?.account_status ||
                    "active",

                mustChangePassword:
                    Boolean(
                        account?.must_change_password
                    ),

                passwordChangedAt:
                    account?.password_changed_at ||
                    null,

                deactivatedAt:
                    account?.deactivated_at ||
                    null,

                deletionRequestedAt:
                    account?.deletion_requested_at ||
                    null,
            },

        });

    } catch (error) {

        console.error(
            "❌ Get student profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load student profile.",
        });

    }
};


// =========================================================
// UPDATE STUDENT PROFILE
// =========================================================

const updateStudentProfile = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {

            firstName,
            middleName,
            lastName,

            birthday,
            contactNumber,

            province,
            barangay,
            city,

        } = req.body || {};


        const cleanedFirstName =
            cleanString(firstName);

        const cleanedMiddleName =
            cleanString(middleName);

        const cleanedLastName =
            cleanString(lastName);


        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!cleanedFirstName) {

            return res.status(400).json({
                success: false,
                message:
                    "First name is required.",
            });

        }


        if (!cleanedLastName) {

            return res.status(400).json({
                success: false,
                message:
                    "Last name is required.",
            });

        }


        const fullName =
            buildFullName({
                firstName:
                    cleanedFirstName,

                middleName:
                    cleanedMiddleName,

                lastName:
                    cleanedLastName,
            });


        // -------------------------------------------------
        // UPDATE STUDENT
        // -------------------------------------------------

        const {
            data: updatedStudent,
            error: updateError,
        } = await supabase
            .from("students")
            .update({

                first_name:
                    cleanedFirstName,

                middle_name:
                    cleanedMiddleName,

                last_name:
                    cleanedLastName,

                full_name:
                    fullName,

                birthday:
                    birthday ||
                    null,

                contact_number:
                    cleanString(
                        contactNumber
                    ),

                province:
                    cleanString(
                        province
                    ),

                barangay:
                    cleanString(
                        barangay
                    ),

                city:
                    cleanString(
                        city
                    ),

                profile_updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "student_id",
                studentId
            )
            .select(`
                id,
                student_id,
                full_name,
                year_level,
                first_name,
                middle_name,
                last_name,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                profile_picture,
                profile_picture_uploaded_at,
                profile_updated_at
            `)
            .single();


        if (updateError) {

            console.error(
                "❌ Update student profile error:",
                updateError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update student profile.",
            });

        }


        // -------------------------------------------------
        // RETURN ACCOUNT EMAIL
        // -------------------------------------------------

        const {
            data: account,
        } = await supabase
            .from("student_accounts")
            .select(`
                email,
                account_status,
                must_change_password,
                password_changed_at
            `)
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();


        return res.status(200).json({

            success: true,

            message:
                "Student profile updated successfully.",

            student:
                normalizeProfile(
                    updatedStudent,
                    account
                ),

        });

    } catch (error) {

        console.error(
            "❌ Update student profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update student profile.",
        });

    }
};


// =========================================================
// CHANGE STUDENT PASSWORD
// =========================================================

const changeStudentPassword = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = req.body || {};


        // -------------------------------------------------
        // REQUIRED
        // -------------------------------------------------

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please complete all password fields.",
            });

        }


        // -------------------------------------------------
        // PASSWORD LENGTH RULE
        // Change-password flow allows 8–50 characters.
        // -------------------------------------------------

        const passwordLength =
            String(newPassword).length;

        if (
            passwordLength < 8 ||
            passwordLength > 50
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Your password must contain between 8 and 50 characters.",
            });

        }


        // -------------------------------------------------
        // PASSWORD REQUIREMENTS
        // -------------------------------------------------

        const hasUppercase =
            /[A-Z]/.test(
                newPassword
            );

        const hasLowercase =
            /[a-z]/.test(
                newPassword
            );

        const hasNumber =
            /[0-9]/.test(
                newPassword
            );

        const hasSpecial =
            /[^A-Za-z0-9]/.test(
                newPassword
            );


        if (
            !hasUppercase ||
            !hasLowercase ||
            !hasNumber ||
            !hasSpecial
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain uppercase, lowercase, number, and special character.",
            });

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New password and confirmation password do not match.",
            });

        }


        // -------------------------------------------------
        // LOAD ACCOUNT
        // -------------------------------------------------

        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("student_accounts")
            .select(`
                id,
                student_id,
                password_hash,
                account_status
            `)
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();


        if (accountError) {

            console.error(
                "❌ Password account query error:",
                accountError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify your account.",
            });

        }


        if (!account) {

            return res.status(404).json({
                success: false,
                message:
                    "Student account was not found.",
            });

        }


        // -------------------------------------------------
        // CURRENT PASSWORD
        // -------------------------------------------------

        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                account.password_hash
            );


        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect.",
            });

        }


        // -------------------------------------------------
        // PREVENT SAME PASSWORD
        // -------------------------------------------------

        const samePassword =
            await bcrypt.compare(
                newPassword,
                account.password_hash
            );


        if (samePassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Your new password must be different from your current password.",
            });

        }


        // -------------------------------------------------
        // HASH
        // -------------------------------------------------

        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                12
            );


        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        const {
            error: updatePasswordError,
        } = await supabase
            .from("student_accounts")
            .update({

                password_hash:
                    newPasswordHash,

                must_change_password:
                    false,

                password_changed_at:
                    new Date().toISOString(),

            })
            .eq(
                "id",
                account.id
            );


        if (updatePasswordError) {

            console.error(
                "❌ Password update error:",
                updatePasswordError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update your password.",
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Your password has been changed successfully.",

        });

    } catch (error) {

        console.error(
            "❌ Change student password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to change your password.",
        });

    }
};


// =========================================================
// UPDATE PROFILE PICTURE
// =========================================================

const updateStudentProfilePicture = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {
            profilePicture,
        } = req.body || {};


        if (!profilePicture) {

            return res.status(400).json({
                success: false,
                message:
                    "Profile picture is required.",
            });

        }


        if (
            !String(
                profilePicture
            ).startsWith(
                "data:image/"
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid profile picture format.",
            });

        }


        // -------------------------------------------------
        // BASIC DATA URL SIZE PROTECTION
        // -------------------------------------------------

        if (
            String(
                profilePicture
            ).length >
            2_500_000
        ) {

            return res.status(413).json({
                success: false,
                message:
                    "Profile picture is too large. Please choose a smaller image.",
            });

        }


        const {
            data: updatedStudent,
            error: updateError,
        } = await supabase
            .from("students")
            .update({

                profile_picture:
                    profilePicture,

                profile_picture_uploaded_at:
                    new Date().toISOString(),

                profile_updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "student_id",
                studentId
            )
            .select(`
                id,
                student_id,
                full_name,
                year_level,
                first_name,
                middle_name,
                last_name,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                profile_picture,
                profile_picture_uploaded_at,
                profile_updated_at
            `)
            .single();


        if (updateError) {

            console.error(
                "❌ Profile picture update error:",
                updateError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update profile picture.",
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Profile picture updated successfully.",

            profilePicture:
                updatedStudent.profile_picture,

        });

    } catch (error) {

        console.error(
            "❌ Profile picture controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update profile picture.",
        });

    }
};


// =========================================================
// REMOVE PROFILE PICTURE
// =========================================================

const removeStudentProfilePicture = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {
            error,
        } = await supabase
            .from("students")
            .update({

                profile_picture:
                    "",

                profile_picture_uploaded_at:
                    null,

                profile_updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "student_id",
                studentId
            );


        if (error) {

            console.error(
                "❌ Remove profile picture error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to remove profile picture.",
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Profile picture removed successfully.",

        });

    } catch (error) {

        console.error(
            "❌ Remove profile picture controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to remove profile picture.",
        });

    }
};


// =========================================================
// DEACTIVATE ACCOUNT
// =========================================================

const deactivateStudentAccount = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {
            error,
        } = await supabase
            .from("student_accounts")
            .update({

                account_status:
                    "inactive",

                deactivated_at:
                    new Date().toISOString(),

            })
            .eq(
                "student_id",
                studentId
            );


        if (error) {

            console.error(
                "❌ Account deactivation error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to deactivate your account.",
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Your account has been deactivated.",

        });

    } catch (error) {

        console.error(
            "❌ Deactivate account error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate your account.",
        });

    }
};


// =========================================================
// REQUEST ACCOUNT DELETION
// =========================================================

const requestStudentAccountDeletion = async (
    req,
    res
) => {

    try {

        const studentId =
            getStudentIdFromRequest(req);

        if (!studentId) {

            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });

        }


        const {
            error,
        } = await supabase
            .from("student_accounts")
            .update({

                account_status:
                    "inactive",

                deletion_requested_at:
                    new Date().toISOString(),

                deactivated_at:
                    new Date().toISOString(),

            })
            .eq(
                "student_id",
                studentId
            );


        if (error) {

            console.error(
                "❌ Account deletion request error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to process account deletion.",
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Your account deletion request has been processed. You have been signed out.",

        });

    } catch (error) {

        console.error(
            "❌ Account deletion error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process account deletion.",
        });

    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    getStudentProfile,

    updateStudentProfile,

    changeStudentPassword,

    updateStudentProfilePicture,

    removeStudentProfilePicture,

    deactivateStudentAccount,

    requestStudentAccountDeletion,

};