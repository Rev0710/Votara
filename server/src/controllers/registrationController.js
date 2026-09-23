const bcrypt = require("bcryptjs");

const supabase = require("../config/supabase");

const {
    generateOTP,
} = require("../utils/otp");

const {
    sendOTPEmail,
} = require("../services/emailService");


// =========================================================
// CONSTANTS
// =========================================================

const VALID_YEAR_LEVELS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
];

const OTP_EXPIRATION_MINUTES = 5;

const MAX_OTP_ATTEMPTS = 5;


// =========================================================
// YEAR LEVEL HELPER
// =========================================================

const yearLevelToDisplayValue = (
    yearLevel
) => {

    const mapping = {
        "1": "1st Year",
        "2": "2nd Year",
        "3": "3rd Year",
        "4": "4th Year",

        "1st": "1st Year",
        "2nd": "2nd Year",
        "3rd": "3rd Year",
        "4th": "4th Year",

        "1st Year": "1st Year",
        "2nd Year": "2nd Year",
        "3rd Year": "3rd Year",
        "4th Year": "4th Year",
    };

    return (
        mapping[String(yearLevel).trim()] ||
        String(yearLevel).trim()
    );
};


// =========================================================
// EMAIL VALIDATION
// =========================================================

const isValidEmail = (
    email
) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};


// =========================================================
// STUDENT ID VALIDATION
// =========================================================

const isValidStudentId = (
    studentId
) => {

    return /^\d{5}$/.test(
        studentId
    );
};


// =========================================================
// FULL NAME VALIDATION
// FOR LATE ENROLLEE
//
// FORMAT:
// LastName_FirstName_MiddleInitial
// =========================================================

const validateFullName = (
    fullName
) => {

    if (
        !fullName ||
        typeof fullName !== "string"
    ) {

        return {
            valid: false,
            message:
                "Full name is required.",
        };
    }

    const trimmedName =
        fullName.trim();

    const parts =
        trimmedName
            .split("_")
            .map(
                (part) =>
                    part.trim()
            );

    if (
        parts.length !== 3
    ) {

        return {
            valid: false,
            message:
                "Full name must follow this format: LastName_FirstName_MiddleInitial",
        };
    }

    const [
        lastName,
        firstName,
        middleInitial,
    ] = parts;

    if (
        !lastName ||
        !firstName ||
        !middleInitial
    ) {

        return {
            valid: false,
            message:
                "Last name, first name, and middle initial are required.",
        };
    }

    if (
        !/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(
            lastName
        )
    ) {

        return {
            valid: false,
            message:
                "Last name must contain letters only.",
        };
    }

    if (
        !/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(
            firstName
        )
    ) {

        return {
            valid: false,
            message:
                "First name must contain letters only.",
        };
    }

    if (
        !/^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(
            middleInitial
        )
    ) {

        return {
            valid: false,
            message:
                "Middle initial must be one letter, optionally followed by a period.",
        };
    }

    return {
        valid: true,
        message: "",
    };
};


// =========================================================
// SUPABASE OFFICIAL STUDENT LOOKUP
// =========================================================

const findOfficialStudent = async (
    studentId
) => {

    try {

        const {
            data,
            error,
        } = await supabase
            .from("students")
            .select(
                "student_id, full_name, year_level, enrollment_status"
            )
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "❌ Supabase student lookup error:",
                error.message
            );

            throw new Error(
                "Unable to verify student information from the official student roster."
            );
        }

        return data;

    } catch (error) {

        console.error(
            "❌ Official student lookup failed:",
            error.message
        );

        throw error;
    }
};


// =========================================================
// FIND LATEST REGISTRATION
// =========================================================

const findLatestRegistration = async (
    studentId
) => {

    const {
        data,
        error,
    } = await supabase
        .from(
            "registration_applications"
        )
        .select("*")
        .eq(
            "student_id",
            studentId
        )
        .order(
            "created_at",
            {
                ascending: false,
            }
        )
        .limit(1)
        .maybeSingle();

    if (error) {

        console.error(
            "❌ Registration lookup error:",
            error.message
        );

        throw new Error(
            "Unable to check the registration record."
        );
    }

    return data;
};


// =========================================================
// CHECK EMAIL USAGE
//
// PURPOSE:
// Prevent an email address from being used by a different
// student account/registration.
//
// A student may continue their own draft or correction
// registration using the same email.
// =========================================================

const findRegistrationByEmail = async (
    email
) => {

    const {
        data,
        error,
    } = await supabase
        .from(
            "registration_applications"
        )
        .select(`
            id,
            student_id,
            email,
            application_status,
            created_at
        `)
        .eq(
            "email",
            email
        )
        .order(
            "created_at",
            {
                ascending: false,
            }
        );

    if (error) {

        console.error(
            "❌ Email registration lookup error:",
            error.message
        );

        throw new Error(
            "Unable to check whether this email address is already registered."
        );
    }

    return data || [];
};


const findStudentAccountByEmail = async (
    email
) => {

    const {
        data,
        error,
    } = await supabase
        .from(
            "student_accounts"
        )
        .select(`
            id,
            student_id,
            email,
            account_status
        `)
        .eq(
            "email",
            email
        )
        .limit(1)
        .maybeSingle();

    if (error) {

        console.error(
            "❌ Student account email lookup error:",
            error.message
        );

        throw new Error(
            "Unable to check whether this email address is already linked to a student account."
        );
    }

    return data;
};


// =========================================================
// CHECK STUDENT
//
// PURPOSE:
// 1. Check official Supabase roster.
// 2. Return official name/year level.
// 3. Detect late enrollee.
// 4. Check existing registration.
// =========================================================

const checkStudent = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !studentId ||
            !email
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and email are required.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedStudentId =
            String(studentId).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =================================================
        // VALIDATE STUDENT ID
        // =================================================

        if (
            !isValidStudentId(
                normalizedStudentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID must contain exactly 5 digits.",

            });
        }


        // =================================================
        // VALIDATE EMAIL
        // =================================================

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address.",

            });
        }


        // =================================================
        // CHECK OFFICIAL SUPABASE ROSTER
        // =================================================

        const officialStudent =
            await findOfficialStudent(
                normalizedStudentId
            );


        // =================================================
        // LATE ENROLLEE
        // =================================================
        //
        // IMPORTANT:
        // Missing from the roster is NOT a server error.
        //
        // The frontend uses:
        //
        // studentFound: false
        // isLateEnrollee: true
        // registrationType: "late"
        //
        // to show the confirmation popup.
        // =================================================

        if (!officialStudent) {

            return res.status(200).json({

                success: true,

                exists: false,

                studentFound: false,

                isLateEnrollee: true,

                registrationType:
                    "late",

                student: {

                    studentId:
                        normalizedStudentId,

                    email:
                        normalizedEmail,

                },

                message:
                    "Student ID was not found in the current official enrollment roster. You may continue as a late enrollee.",

            });
        }


        // =================================================
        // CHECK ENROLLMENT STATUS
        // =================================================

        if (
            officialStudent.enrollment_status &&
            String(
                officialStudent.enrollment_status
            ).toUpperCase() !==
                "ACTIVE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This student record is not currently active in the official enrollment roster.",

            });
        }


        // =================================================
        // OFFICIAL INFORMATION
        // =================================================

        const officialFullName =
            officialStudent.full_name;

        const officialYearLevel =
            yearLevelToDisplayValue(
                officialStudent.year_level
            );


        // =================================================
        // CHECK EXISTING REGISTRATION
        // =================================================

        const existingRegistration =
            await findLatestRegistration(
                normalizedStudentId
            );


        // =================================================
        // ALREADY APPROVED
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "approved"
        ) {

            return res.status(200).json({

                success: true,

                exists: true,

                studentFound: true,

                alreadyRegistered: true,

                registrationStatus:
                    "approved",

                student: {

                    studentId:
                        normalizedStudentId,

                    fullName:
                        officialFullName,

                    yearLevel:
                        officialYearLevel,

                },

                message:
                    "This student has already been approved for registration.",

            });
        }


        // =================================================
        // ALREADY PENDING REVIEW
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "pending_review"
        ) {

            return res.status(200).json({

                success: true,

                exists: true,

                studentFound: true,

                alreadyRegistered: true,

                registrationStatus:
                    "pending_review",

                student: {

                    studentId:
                        normalizedStudentId,

                    fullName:
                        officialFullName,

                    yearLevel:
                        officialYearLevel,

                },

                message:
                    "This registration is already pending review by the Electoral Board/Admin.",

            });
        }


        // =================================================
        // ALREADY VERIFIED BUT NOT SUBMITTED
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "otp_verified"
        ) {

            return res.status(200).json({

                success: true,

                exists: true,

                studentFound: true,

                alreadyRegistered: false,

                otpVerified: true,

                registrationStatus:
                    "otp_verified",

                registrationType:
                    "normal",

                student: {

                    studentId:
                        normalizedStudentId,

                    fullName:
                        officialFullName,

                    yearLevel:
                        officialYearLevel,

                },

                message:
                    "Your email has already been verified. Please continue your registration.",

            });
        }


        // =================================================
        // NORMAL STUDENT
        // =================================================

        return res.status(200).json({

            success: true,

            exists: true,

            studentFound: true,

            isLateEnrollee: false,

            registrationType:
                "normal",

            student: {

                studentId:
                    normalizedStudentId,

                fullName:
                    officialFullName,

                yearLevel:
                    officialYearLevel,

                email:
                    normalizedEmail,

            },

            message:
                "Student verified against the official enrollment roster.",

        });

    } catch (error) {

        console.error(
            "❌ checkStudent error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to verify student information.",

        });
    }
};


// =========================================================
// CREATE OR UPDATE REGISTRATION APPLICATION
//
// REGISTRATION SOURCE:
// - This controller handles ONLINE registration.
// - Therefore registration_source must be "online".
//
// KIOSK REGISTRATION:
// - KioskController.js handles kiosk registration.
// - KioskController.js must use registration_source = "kiosk".
//
// IMPORTANT:
// Keeping the source explicitly separated prevents a kiosk
// application from accidentally being treated as an online
// registration.
// =========================================================

const createOrUpdateRegistration =
    async ({
        studentId,
        email,
        fullName,
        yearLevel,
        registrationType,
    }) => {

        const existing =
            await findLatestRegistration(
                studentId
            );


        // =================================================
        // DO NOT REPLACE ACTIVE APPLICATION
        // =================================================

        if (
            existing &&
            [
                "pending_review",
                "approved",
            ].includes(
                existing.application_status
            )
        ) {

            return existing;
        }


        // =================================================
        // UPDATE EXISTING DRAFT
        // =================================================

        if (
            existing &&
            [
                "draft",
                "otp_verified",
                "needs_correction",
            ].includes(
                existing.application_status
            )
        ) {

            const {
                data,
                error,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({

                    email:
                        email
                            ? String(
                                email
                            )
                                .trim()
                                .toLowerCase()
                            : null,

                    full_name:
                        fullName,

                    year_level:
                        yearLevel,

                    registration_type:
                        registrationType,

                    // =============================================
                    // ONLINE REGISTRATION
                    // =============================================

                    registration_source:
                        "online",

                    updated_at:
                        new Date().toISOString(),

                })
                .eq(
                    "id",
                    existing.id
                )
                .select()
                .single();


            if (error) {

                console.error(
                    "❌ REGISTRATION UPDATE FAILED"
                );

                console.error(
                    "Code:",
                    error.code
                );

                console.error(
                    "Message:",
                    error.message
                );

                console.error(
                    "Details:",
                    error.details
                );

                console.error(
                    "Hint:",
                    error.hint
                );

                throw new Error(
                    "Unable to update registration application."
                );
            }


            return data;
        }


        // =================================================
        // CREATE NEW APPLICATION
        // =================================================

        const {
            data,
            error,
        } = await supabase
            .from(
                "registration_applications"
            )
            .insert({

                student_id:
                    studentId,

                registration_type:
                    registrationType,

                // =============================================
                // ONLINE REGISTRATION
                // =============================================

                registration_source:
                    "online",

                application_status:
                    "draft",

                email:
                    email
                        ? String(
                            email
                        )
                            .trim()
                            .toLowerCase()
                        : null,

                full_name:
                    fullName || null,

                year_level:
                    yearLevel || null,

            })
            .select()
            .single();


        if (error) {

            console.error(
                "❌ REGISTRATION CREATION FAILED"
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Details:",
                error.details
            );

            console.error(
                "Hint:",
                error.hint
            );

            throw new Error(
                "Unable to create registration application."
            );
        }


        return data;
    };


// =========================================================
// SEND REGISTRATION OTP
// =========================================================

// =========================================================
// SEND REGISTRATION OTP
//
// NORMAL STUDENT:
// - Must exist in the official roster.
// - Receives OTP.
//
// LATE ENROLLEE:
// - Student ID is not found in current roster.
// - Missing roster record is NOT an error.
// - Creates/reuses registration_type = "late".
// - Does NOT send OTP.
// - Frontend receives isLateEnrollee=true.
// =========================================================

const sendRegistrationOTP = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
            fullName,
            yearLevel,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !studentId ||
            !email
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and email are required.",

            });
        }


        // =================================================
        // NORMALIZE INPUT
        // =================================================

        const normalizedStudentId =
            String(studentId).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =================================================
        // VALIDATE STUDENT ID
        // =================================================

        if (
            !isValidStudentId(
                normalizedStudentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID must contain exactly 5 digits.",

            });
        }


        // =================================================
        // VALIDATE EMAIL
        // =================================================

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address.",

            });
        }


        // =================================================
        // CHECK EMAIL IN REGISTRATION APPLICATIONS
        // =================================================

        const registrationsUsingEmail =
            await findRegistrationByEmail(
                normalizedEmail
            );


        const emailUsedByAnotherStudent =
            registrationsUsingEmail.find(
                (registration) =>
                    String(
                        registration.student_id
                    ).trim() !==
                    normalizedStudentId
            );


        if (
            emailUsedByAnotherStudent
        ) {

            return res.status(409).json({

                success: false,

                code:
                    "EMAIL_ALREADY_USED",

                message:
                    "This email address has already been used by another student. Please use a different email address.",

            });
        }


        // =================================================
        // CHECK EMAIL IN STUDENT ACCOUNTS
        // =================================================

        const existingAccountByEmail =
            await findStudentAccountByEmail(
                normalizedEmail
            );


        if (
            existingAccountByEmail &&
            String(
                existingAccountByEmail.student_id
            ).trim() !==
                normalizedStudentId
        ) {

            return res.status(409).json({

                success: false,

                code:
                    "EMAIL_ALREADY_USED",

                message:
                    "This email address is already linked to another student account.",

            });
        }


        // =================================================
        // CHECK OFFICIAL ROSTER
        // =================================================

        const officialStudent =
            await findOfficialStudent(
                normalizedStudentId
            );


        // =================================================
        // =================================================
        // LATE ENROLLEE
        // =================================================
        // =================================================
        //
        // Missing roster record is an expected branch.
        //
        // DO NOT:
        // - return 400
        // - require fullName/yearLevel
        // - send OTP
        //
        // The student will provide their full name and
        // year level in Registration Requirements.
        // =================================================

        if (!officialStudent) {

            const existingRegistration =
                await findLatestRegistration(
                    normalizedStudentId
                );


            // =================================================
            // ALREADY APPROVED
            // =================================================

            if (
                existingRegistration &&
                existingRegistration.application_status ===
                    "approved"
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "ALREADY_APPROVED",

                    message:
                        "This student already has an approved registration.",

                });
            }


            // =================================================
            // ALREADY PENDING
            // =================================================

            if (
                existingRegistration &&
                existingRegistration.application_status ===
                    "pending_review"
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "ALREADY_PENDING",

                    message:
                        "This late enrollee registration is already pending Electoral Board review.",

                });
            }


            // =================================================
            // REUSE EXISTING LATE APPLICATION
            // =================================================

            let lateRegistration =
                existingRegistration &&
                existingRegistration.registration_type ===
                    "late"
                    ? existingRegistration
                    : null;


            // =================================================
            // CREATE LATE APPLICATION
            // =================================================

            if (!lateRegistration) {

                lateRegistration =
                    await createOrUpdateRegistration({

                        studentId:
                            normalizedStudentId,

                        email:
                            normalizedEmail,

                        fullName:
                            fullName
                                ? String(
                                    fullName
                                ).trim()
                                : null,

                        yearLevel:
                            yearLevel
                                ? yearLevelToDisplayValue(
                                    yearLevel
                                )
                                : null,

                        registrationType:
                            "late",

                    });

            } else {

                // =================================================
                // UPDATE EMAIL
                // =================================================

                const {
                    data:
                        updatedLateRegistration,

                    error:
                        lateUpdateError,

                } = await supabase
                    .from(
                        "registration_applications"
                    )
                    .update({

                        email:
                            normalizedEmail,

                        updated_at:
                            new Date().toISOString(),

                    })
                    .eq(
                        "id",
                        lateRegistration.id
                    )
                    .select()
                    .single();


                if (
                    lateUpdateError
                ) {

                    console.error(
                        "❌ Late registration update error:",
                        lateUpdateError.message
                    );

                    throw new Error(
                        "Unable to prepare the late enrollee registration."
                    );
                }


                lateRegistration =
                    updatedLateRegistration;
            }


            // =================================================
            // RETURN LATE ENROLLEE RESPONSE
            //
            // HTTP 200 IS INTENTIONAL.
            // =================================================

            return res.status(200).json({

                success: true,

                exists: false,

                studentFound: false,

                isLateEnrollee: true,

                registrationType:
                    "late",

                registrationId:
                    lateRegistration?.id ||
                    null,

                student: {

                    studentId:
                        normalizedStudentId,

                    email:
                        normalizedEmail,

                    fullName:
                        lateRegistration?.full_name ||
                        "",

                    yearLevel:
                        lateRegistration?.year_level ||
                        "",

                },

                message:
                    "This Student ID was not found in the current official roster. You may continue as a late enrollee.",

            });
        }


        // =================================================
        // =================================================
        // NORMAL STUDENT
        // =================================================
        // =================================================

        if (
            officialStudent.enrollment_status &&
            String(
                officialStudent.enrollment_status
            ).toUpperCase() !==
                "ACTIVE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This student record is not currently active.",

            });
        }


        // =================================================
        // OFFICIAL INFORMATION
        // =================================================

        const finalFullName =
            officialStudent.full_name;


        const finalYearLevel =
            yearLevelToDisplayValue(
                officialStudent.year_level
            );


        // =================================================
        // CHECK EXISTING REGISTRATION
        // =================================================

        const existingRegistration =
            await findLatestRegistration(
                normalizedStudentId
            );


        // =================================================
        // ALREADY APPROVED
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "approved"
        ) {

            return res.status(400).json({

                success: false,

                code:
                    "ALREADY_APPROVED",

                message:
                    "This student has already been approved for registration.",

            });
        }


        // =================================================
        // ALREADY PENDING
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "pending_review"
        ) {

            return res.status(400).json({

                success: false,

                code:
                    "ALREADY_PENDING",

                message:
                    "This registration is already pending review by the Electoral Board/Admin.",

            });
        }


        // =================================================
        // ALREADY OTP VERIFIED
        // =================================================

        if (
            existingRegistration &&
            existingRegistration.application_status ===
                "otp_verified"
        ) {

            return res.status(200).json({

                success: true,

                alreadyVerified: true,

                studentFound: true,

                exists: true,

                isLateEnrollee: false,

                registrationType:
                    "normal",

                registrationId:
                    existingRegistration.id,

                student: {

                    studentId:
                        normalizedStudentId,

                    fullName:
                        finalFullName,

                    yearLevel:
                        finalYearLevel,

                    email:
                        normalizedEmail,

                },

                message:
                    "Your email has already been verified. Please continue your registration.",

            });
        }


        // =================================================
        // CREATE / UPDATE NORMAL APPLICATION
        // =================================================

        const registration =
            await createOrUpdateRegistration({

                studentId:
                    normalizedStudentId,

                email:
                    normalizedEmail,

                fullName:
                    finalFullName,

                yearLevel:
                    finalYearLevel,

                registrationType:
                    "normal",

            });


        // =================================================
        // GENERATE OTP
        // =================================================

        const otp =
            String(
                generateOTP()
            );


        // =================================================
        // HASH OTP
        // =================================================

        const otpHash =
            await bcrypt.hash(
                otp,
                10
            );


        // =================================================
        // INVALIDATE PREVIOUS OTP
        // =================================================

        const {
            error:
                invalidateError,

        } = await supabase
            .from("otp_codes")
            .update({

                verification_status:
                    "invalidated",

            })
            .eq(
                "registration_id",
                registration.id
            )
            .eq(
                "verification_status",
                "active"
            );


        if (
            invalidateError
        ) {

            console.error(
                "❌ Unable to invalidate previous OTP:",
                invalidateError.message
            );

            throw new Error(
                "Unable to prepare the new OTP."
            );
        }


        // =================================================
        // OTP EXPIRATION
        // =================================================

        const expiresAt =
            new Date(
                Date.now() +
                OTP_EXPIRATION_MINUTES *
                60 *
                1000
            );


        // =================================================
        // CREATE OTP
        // =================================================

        const {
            error:
                otpInsertError,

        } = await supabase
            .from("otp_codes")
            .insert({

                registration_id:
                    registration.id,

                student_id:
                    normalizedStudentId,

                email:
                    normalizedEmail,

                otp_hash:
                    otpHash,

                purpose:
                    "registration",

                expires_at:
                    expiresAt.toISOString(),

                attempt_count:
                    0,

                max_attempts:
                    MAX_OTP_ATTEMPTS,

                verification_status:
                    "active",

            });


        if (
            otpInsertError
        ) {

            console.error(
                "❌ OTP database error:",
                otpInsertError.message
            );

            throw new Error(
                "Unable to create the OTP."
            );
        }


        // =================================================
        // SEND OTP EMAIL
        // =================================================

        try {

            await sendOTPEmail(
                normalizedEmail,
                normalizedStudentId,
                otp
            );

        } catch (
            emailError
        ) {

            console.error(
                "❌ OTP email failed:",
                emailError.message
            );


            // Invalidate failed OTP
            await supabase
                .from("otp_codes")
                .update({

                    verification_status:
                        "invalidated",

                })
                .eq(
                    "registration_id",
                    registration.id
                )
                .eq(
                    "otp_hash",
                    otpHash
                );


            throw new Error(
                "Unable to send the OTP email. Please try again."
            );
        }


        // =================================================
        // NORMAL STUDENT SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            exists: true,

            studentFound: true,

            isLateEnrollee: false,

            registrationType:
                "normal",

            registrationId:
                registration.id,

            student: {

                studentId:
                    normalizedStudentId,

                fullName:
                    finalFullName,

                yearLevel:
                    finalYearLevel,

                email:
                    normalizedEmail,

            },

            message:
                "OTP has been sent to your email.",

        });

    } catch (error) {

        console.error(
            "❌ sendRegistrationOTP error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to send registration OTP.",

        });
    }
};

// =========================================================
// VERIFY REGISTRATION OTP
//
// IMPORTANT:
// OTP verification does NOT submit the registration.
//
// Status becomes:
// otp_verified
//
// Student must still complete:
// documents + selfie + submit.
// =========================================================

const verifyRegistrationOTP = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
            otp,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !email ||
            !otp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanOTP =
            String(otp)
                .trim();


        // =================================================
        // FIND ACTIVE OTP
        // =================================================

        let otpQuery =
            supabase
                .from("otp_codes")
                .select("*")
                .eq(
                    "email",
                    normalizedEmail
                )
                .eq(
                    "verification_status",
                    "active"
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


        // If Student ID is supplied,
        // also restrict the lookup.
        if (studentId) {

            otpQuery =
                supabase
                    .from("otp_codes")
                    .select("*")
                    .eq(
                        "student_id",
                        String(
                            studentId
                        ).trim()
                    )
                    .eq(
                        "email",
                        normalizedEmail
                    )
                    .eq(
                        "verification_status",
                        "active"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false,
                        }
                    )
                    .limit(1)
                    .maybeSingle();
        }


        const {
            data: otpRecord,
            error: otpLookupError,
        } = await otpQuery;


        if (otpLookupError) {

            console.error(
                "❌ OTP lookup error:",
                otpLookupError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to verify OTP.",

            });
        }


        // =================================================
        // NO OTP
        // =================================================

        if (!otpRecord) {

            return res.status(400).json({

                success: false,

                message:
                    "No active OTP was found. Please request a new OTP.",

            });
        }


        // =================================================
        // CHECK ATTEMPT LIMIT
        // =================================================

        if (
            otpRecord.attempt_count >=
            otpRecord.max_attempts
        ) {

            await supabase
                .from("otp_codes")
                .update({

                    verification_status:
                        "invalidated",

                })
                .eq(
                    "id",
                    otpRecord.id
                );


            return res.status(400).json({

                success: false,

                message:
                    "Too many incorrect OTP attempts. Please request a new OTP.",

            });
        }


        // =================================================
        // CHECK EXPIRATION
        // =================================================

        if (
            new Date() >
            new Date(
                otpRecord.expires_at
            )
        ) {

            await supabase
                .from("otp_codes")
                .update({

                    verification_status:
                        "expired",

                })
                .eq(
                    "id",
                    otpRecord.id
                );


            return res.status(400).json({

                success: false,

                message:
                    "OTP has expired. Please request a new OTP.",

            });
        }


        // =================================================
        // COMPARE OTP
        // =================================================

        const isOTPValid =
            await bcrypt.compare(
                cleanOTP,
                otpRecord.otp_hash
            );


        // =================================================
        // INVALID OTP
        // =================================================

        if (!isOTPValid) {

            const nextAttempt =
                otpRecord.attempt_count +
                1;


            await supabase
                .from("otp_codes")
                .update({

                    attempt_count:
                        nextAttempt,

                    verification_status:
                        nextAttempt >=
                        otpRecord.max_attempts
                            ? "invalidated"
                            : "active",

                })
                .eq(
                    "id",
                    otpRecord.id
                );


            if (
                nextAttempt >=
                otpRecord.max_attempts
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Too many incorrect OTP attempts. Please request a new OTP.",

                });
            }


            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP.",

            });
        }


        // =================================================
        // OTP VERIFIED
        // =================================================

        const verifiedAt =
            new Date();


        // -------------------------------------------------
        // MARK OTP VERIFIED
        // -------------------------------------------------

        const {
            error:
                otpUpdateError,
        } = await supabase
            .from("otp_codes")
            .update({

                verification_status:
                    "verified",

                verified_at:
                    verifiedAt.toISOString(),

            })
            .eq(
                "id",
                otpRecord.id
            );

        if (otpUpdateError) {

            console.error(
                "❌ OTP update error:",
                otpUpdateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "OTP was verified but could not update the verification record.",

            });
        }


        // =================================================
        // UPDATE REGISTRATION APPLICATION
        //
        // IMPORTANT:
        // DO NOT SET pending_review HERE.
        //
        // The student has not submitted documents
        // and selfie yet.
        // =================================================

        const {
            data:
                updatedRegistration,
            error:
                registrationUpdateError,
        } = await supabase
            .from(
                "registration_applications"
            )
            .update({

                application_status:
                    "otp_verified",

                otp_verified_at:
                    verifiedAt.toISOString(),

                updated_at:
                    verifiedAt.toISOString(),

            })
            .eq(
                "id",
                otpRecord.registration_id
            )
            .select()
            .single();


        if (registrationUpdateError) {

            console.error(
                "❌ Registration status update error:",
                registrationUpdateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "OTP was verified but the registration could not be updated.",

            });
        }


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            alreadyVerified:
                false,

            registrationSubmitted:
                false,

            otpVerified:
                true,

            registrationStatus:
                "otp_verified",

            message:
                "OTP verified successfully. Please continue your registration.",

            student: {

                studentId:
                    updatedRegistration.student_id,

                fullName:
                    updatedRegistration.full_name,

                yearLevel:
                    updatedRegistration.year_level,

                email:
                    updatedRegistration.email,

                registrationType:
                    updatedRegistration.registration_type,

                registrationStatus:
                    updatedRegistration.application_status,

            },

        });

    } catch (error) {

        console.error(
            "❌ verifyRegistrationOTP error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to verify OTP.",

        });
    }
};


// =========================================================
// RESEND REGISTRATION OTP
// =========================================================

const resendRegistrationOTP = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
        } = req.body;


        // =================================================
        // REQUIRED
        // =================================================

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const normalizedStudentId =
            studentId
                ? String(
                    studentId
                ).trim()
                : null;


        // =================================================
        // FIND REGISTRATION
        // =================================================

        let registrationQuery =
            supabase
                .from(
                    "registration_applications"
                )
                .select("*")
                .eq(
                    "email",
                    normalizedEmail
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (
            normalizedStudentId
        ) {

            registrationQuery =
                supabase
                    .from(
                        "registration_applications"
                    )
                    .select("*")
                    .eq(
                        "student_id",
                        normalizedStudentId
                    )
                    .eq(
                        "email",
                        normalizedEmail
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false,
                        }
                    )
                    .limit(1)
                    .maybeSingle();
        }


        const {
            data:
                registration,
            error:
                registrationError,
        } = await registrationQuery;


        if (registrationError) {

            console.error(
                "❌ Registration lookup error:",
                registrationError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to find registration information.",

            });
        }


        if (!registration) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration information not found. Please register again.",

            });
        }


        // =================================================
        // DO NOT RESEND AFTER SUBMISSION
        // =================================================

        if (
            registration.application_status ===
            "pending_review"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This registration has already been submitted and is pending review.",

            });
        }


        // =================================================
        // DO NOT RESEND AFTER APPROVAL
        // =================================================

        if (
            registration.application_status ===
            "approved"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This registration has already been approved.",

            });
        }


        // =================================================
        // ALREADY OTP VERIFIED
        // =================================================

        if (
            registration.application_status ===
            "otp_verified"
        ) {

            return res.status(200).json({

                success: true,

                alreadyVerified:
                    true,

                otpVerified:
                    true,

                message:
                    "Your email has already been verified. Please continue your registration.",

            });
        }


        // =================================================
        // GENERATE NEW OTP
        // =================================================

        const otp =
            String(
                generateOTP()
            );


        // =================================================
        // HASH OTP
        // =================================================

        const otpHash =
            await bcrypt.hash(
                otp,
                10
            );


        // =================================================
        // INVALIDATE PREVIOUS ACTIVE OTP
        // =================================================

        const {
            error:
                invalidateError,
        } = await supabase
            .from("otp_codes")
            .update({

                verification_status:
                    "invalidated",

            })
            .eq(
                "registration_id",
                registration.id
            )
            .eq(
                "verification_status",
                "active"
            );


        if (invalidateError) {

            console.error(
                "❌ Previous OTP invalidation error:",
                invalidateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to prepare a new OTP.",

            });
        }


        // =================================================
        // CREATE NEW OTP
        // =================================================

        const expiresAt =
            new Date(
                Date.now() +
                OTP_EXPIRATION_MINUTES *
                60 *
                1000
            );


        const {
            error:
                otpInsertError,
        } = await supabase
            .from("otp_codes")
            .insert({

                registration_id:
                    registration.id,

                student_id:
                    registration.student_id,

                email:
                    normalizedEmail,

                otp_hash:
                    otpHash,

                purpose:
                    "resend",

                expires_at:
                    expiresAt.toISOString(),

                attempt_count:
                    0,

                max_attempts:
                    MAX_OTP_ATTEMPTS,

                verification_status:
                    "active",

            });


        if (otpInsertError) {

            console.error(
                "❌ New OTP insert error:",
                otpInsertError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create a new OTP.",

            });
        }


        // =================================================
        // SEND EMAIL
        // =================================================

        try {

            await sendOTPEmail(
                normalizedEmail,
                registration.student_id,
                otp
            );

        } catch (emailError) {

            console.error(
                "❌ Resend OTP email failed:",
                emailError.message
            );


            await supabase
                .from("otp_codes")
                .update({

                    verification_status:
                        "invalidated",

                })
                .eq(
                    "registration_id",
                    registration.id
                )
                .eq(
                    "otp_hash",
                    otpHash
                );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to send the new OTP. Please try again.",

            });
        }


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "A new OTP has been sent to your email.",

        });

    } catch (error) {

        console.error(
            "❌ resendRegistrationOTP error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to resend OTP.",

        });
    }
};


// =========================================================
// SUBMIT REGISTRATION
//
// NOTE:
// The route will be connected after this controller.
//
// This endpoint will receive the completed registration
// information and eventually the uploaded documents/selfie.
// =========================================================

// =========================================================
// SUBMIT REGISTRATION
//
// NORMAL STUDENT:
// - OTP must be verified.
//
// LATE ENROLLEE:
// - OTP is NOT required.
// - Full name and year level are collected from the
//   Registration Requirements page.
// - Application remains registration_type = "late".
// - EB reviews the application and documents.
// =========================================================

const submitRegistration = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
            fullName,
            yearLevel,
            birthday,
            contactNumber,
            province,
            barangay,
            city,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !studentId ||
            !email ||
            !birthday ||
            !contactNumber
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID, email, birthday, and contact number are required.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedStudentId =
            String(studentId).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =================================================
        // VALIDATE STUDENT ID
        // =================================================

        if (
            !isValidStudentId(
                normalizedStudentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID must contain exactly 5 digits.",

            });
        }


        // =================================================
        // VALIDATE EMAIL
        // =================================================

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address.",

            });
        }


        // =================================================
        // FIND REGISTRATION
        // =================================================

        const registration =
            await findLatestRegistration(
                normalizedStudentId
            );


        if (!registration) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration application not found.",

            });
        }


        // =================================================
        // EMAIL MUST MATCH
        // =================================================

        if (
            String(
                registration.email || ""
            )
                .trim()
                .toLowerCase() !==
            normalizedEmail
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Registration information does not match.",

            });
        }


        // =================================================
        // DETERMINE REGISTRATION TYPE
        // =================================================

        const isLateEnrollee =
            registration.registration_type ===
            "late";


        // =================================================
        // NORMAL STUDENT
        //
        // OTP IS REQUIRED
        // =================================================

        if (
            !isLateEnrollee &&
            registration.application_status !==
                "otp_verified"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please verify your OTP before submitting the registration.",

            });
        }


        // =================================================
        // PREPARE NAME/YEAR LEVEL
        // =================================================

        let finalFullName =
            registration.full_name || "";

        let finalYearLevel =
            registration.year_level || "";


        // =================================================
        // LATE ENROLLEE
        //
        // NO OTP REQUIRED
        // =================================================

        if (
            isLateEnrollee
        ) {

            // -------------------------------------------------
            // FULL NAME REQUIRED
            // -------------------------------------------------

            if (
                !fullName
            ) {

                return res.status(400).json({

                    success: false,

                    isLateEnrollee: true,

                    registrationType:
                        "late",

                    message:
                        "Full name is required for late enrollee registration.",

                });
            }


            // -------------------------------------------------
            // YEAR LEVEL REQUIRED
            // -------------------------------------------------

            if (
                !yearLevel
            ) {

                return res.status(400).json({

                    success: false,

                    isLateEnrollee: true,

                    registrationType:
                        "late",

                    message:
                        "Year level is required for late enrollee registration.",

                });
            }


            // -------------------------------------------------
            // VALIDATE NAME
            // -------------------------------------------------

            const nameValidation =
                validateFullName(
                    fullName
                );


            if (
                !nameValidation.valid
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        nameValidation.message,

                });
            }


            // -------------------------------------------------
            // VALIDATE YEAR LEVEL
            // -------------------------------------------------

            finalYearLevel =
                yearLevelToDisplayValue(
                    yearLevel
                );


            if (
                !VALID_YEAR_LEVELS.includes(
                    finalYearLevel
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid year level.",

                });
            }


            finalFullName =
                String(
                    fullName
                ).trim();
        }


        // =================================================
        // CONTACT NUMBER
        // =================================================

        const cleanContactNumber =
            String(
                contactNumber
            ).trim();


        if (
            cleanContactNumber.length <
            10
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid contact number.",

            });
        }


        // =================================================
        // PREPARE UPDATE DATA
        // =================================================

        const updateData = {

            birthday,

            contact_number:
                cleanContactNumber,

            province:
                province
                    ? String(
                        province
                    ).trim()
                    : null,

            barangay:
                barangay
                    ? String(
                        barangay
                    ).trim()
                    : null,

            city:
                city
                    ? String(
                        city
                    ).trim()
                    : null,

            application_status:
                "pending_review",

            submitted_at:
                new Date().toISOString(),

            updated_at:
                new Date().toISOString(),

        };


        // =================================================
        // LATE ENROLLEE INFORMATION
        // =================================================

        if (
            isLateEnrollee
        ) {

            updateData.full_name =
                finalFullName;

            updateData.year_level =
                finalYearLevel;

            updateData.registration_type =
                "late";
        }


        // =================================================
        // UPDATE APPLICATION
        // =================================================

        const {
            data:
                updatedRegistration,

            error:
                updateError,

        } = await supabase
            .from(
                "registration_applications"
            )
            .update(
                updateData
            )
            .eq(
                "id",
                registration.id
            )
            .select()
            .single();


        if (
            updateError
        ) {

            console.error(
                "❌ Registration submission error:",
                updateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to submit registration.",

            });
        }


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            registrationSubmitted:
                true,

            isLateEnrollee:
                isLateEnrollee,

            registrationType:
                isLateEnrollee
                    ? "late"
                    : "normal",

            registrationStatus:
                "pending_review",

            message:
                isLateEnrollee
                    ? "Late enrollee registration submitted successfully. Your application is now pending review by the Electoral Board."
                    : "Registration submitted successfully. Your application is now pending review by the Electoral Board/Admin.",

            registration: {

                id:
                    updatedRegistration.id,

                studentId:
                    updatedRegistration.student_id,

                email:
                    updatedRegistration.email,

                fullName:
                    updatedRegistration.full_name,

                yearLevel:
                    updatedRegistration.year_level,

                registrationType:
                    updatedRegistration.registration_type,

                status:
                    updatedRegistration.application_status,

                submittedAt:
                    updatedRegistration.submitted_at,

            },

        });

    } catch (error) {

        console.error(
            "❌ submitRegistration error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to submit registration.",

        });
    }
};

// =========================================================
// STUDENT REGISTRATION STATUS
//
// PURPOSE:
// Return the student's current registration application
// status and the message/reason associated with that status.
//
// IMPORTANT:
// - Does NOT expose uploaded documents.
// - Does NOT expose selfie data.
// - Does NOT expose OTP data.
// - Does NOT expose passwords.
// - Student ID + email must match the same application.
// =========================================================

const getRegistrationStatus = async (
    req,
    res
) => {

    try {

        const {
            studentId,
            email,
        } = req.query;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !studentId ||
            !email
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and email are required.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedStudentId =
            String(studentId).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !isValidStudentId(
                normalizedStudentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID must contain exactly 5 digits.",

            });
        }


        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address.",

            });
        }


        // =================================================
        // FIND LATEST APPLICATION
        //
        // Match BOTH Student ID and email so a status
        // cannot be returned for a different registration.
        // =================================================

        const {
            data:
                registration,
            error:
                registrationError,
        } = await supabase
            .from(
                "registration_applications"
            )
            .select(`
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
                otp_verified_at,
                submitted_at,
                reviewed_at,
                rejection_reason,
                correction_message,
                created_at,
                updated_at
            `)
            .eq(
                "student_id",
                normalizedStudentId
            )
            .eq(
                "email",
                normalizedEmail
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();


        if (registrationError) {

            console.error(
                "❌ Student registration status lookup error:",
                registrationError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve your registration status.",

            });
        }


        // =================================================
        // NOT FOUND
        // =================================================

        if (!registration) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration application not found.",

            });
        }


        // =================================================
        // RETURN SAFE STATUS INFORMATION
        // =================================================

        return res.status(200).json({

            success: true,

            registration: {

                id:
                    registration.id,

                studentId:
                    registration.student_id,

                email:
                    registration.email,

                fullName:
                    registration.full_name,

                yearLevel:
                    registration.year_level,

                registrationType:
                    registration.registration_type,

                status:
                    registration.application_status,

                birthday:
                    registration.birthday,

                contactNumber:
                    registration.contact_number,

                province:
                    registration.province,

                barangay:
                    registration.barangay,

                city:
                    registration.city,

                otpVerifiedAt:
                    registration.otp_verified_at,

                submittedAt:
                    registration.submitted_at,

                reviewedAt:
                    registration.reviewed_at,

                rejectionReason:
                    registration.rejection_reason,

                correctionMessage:
                    registration.correction_message,

                createdAt:
                    registration.created_at,

                updatedAt:
                    registration.updated_at,

            },

        });

    } catch (error) {

        console.error(
            "❌ getRegistrationStatus error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to retrieve registration status.",

        });
    }
};


// =========================================================
// ELECTORAL BOARD AUTHENTICATION
//
// These functions protect EB-only registration endpoints.
// Student authentication is NOT changed.
// =========================================================

const jwt = require("jsonwebtoken");

const authenticateEB = (req) => {

    const authorization =
        req.headers.authorization || "";

    if (
        !authorization.startsWith("Bearer ")
    ) {
        const error = new Error(
            "Electoral Board authentication is required."
        );

        error.statusCode = 401;

        throw error;
    }

    const token =
        authorization.substring(7).trim();

    if (!token) {
        const error = new Error(
            "Electoral Board authentication is required."
        );

        error.statusCode = 401;

        throw error;
    }

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (
            decoded.role !==
            "electoral_board"
        ) {
            const error = new Error(
                "Electoral Board access is required."
            );

            error.statusCode = 403;

            throw error;
        }

        return decoded;

    } catch (error) {

        if (
            error.statusCode
        ) {
            throw error;
        }

        const authError =
            new Error(
                "Invalid or expired Electoral Board session."
            );

        authError.statusCode = 401;

        throw authError;
    }
};


// =========================================================
// GET EB DASHBOARD STATISTICS
// =========================================================

const getEBDashboardStats = async (
    req,
    res
) => {

    try {

        authenticateEB(req);

        // =====================================================
        // REGISTERED STUDENTS
        // =====================================================

        const {
            count: registeredStudents,
            error: studentsError,
        } = await supabase
            .from("students")
            .select("id", {
                count: "exact",
                head: true,
            });

        if (studentsError) {

            console.error(
                "❌ EB registered students count error:",
                studentsError.message
            );

            throw new Error(
                "Unable to retrieve registered student count."
            );
        }


        // =====================================================
        // PENDING REGISTRATION APPLICATIONS
        // =====================================================

        const {
            count: pendingApplications,
            error: pendingError,
        } = await supabase
            .from("registration_applications")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq(
                "application_status",
                "pending_review"
            );

        if (pendingError) {

            console.error(
                "❌ EB pending applications count error:",
                pendingError.message
            );

            throw new Error(
                "Unable to retrieve pending registration count."
            );
        }


        // =====================================================
        // APPROVED STUDENTS
        // =====================================================

        const {
            count: approvedStudents,
            error: approvedError,
        } = await supabase
            .from("registration_applications")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq(
                "application_status",
                "approved"
            );

        if (approvedError) {

            console.error(
                "❌ EB approved students count error:",
                approvedError.message
            );

            throw new Error(
                "Unable to retrieve approved student count."
            );
        }


        // =====================================================
        // FIND CURRENT ELECTION
        // =====================================================

        let currentElection = null;


        // -----------------------------------------------------
        // FIRST: LOOK FOR OPEN + PUBLISHED ELECTION
        // -----------------------------------------------------

        const {
            data: openElection,
            error: openElectionError,
        } = await supabase
            .from("elections")
            .select(`
                id,
                title,
                description,
                election_date,
                start_time,
                end_time,
                status,
                is_published,
                published_at
            `)
            .eq(
                "status",
                "open"
            )
            .eq(
                "is_published",
                true
            )
            .order(
                "election_date",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();

        if (openElectionError) {

            console.error(
                "❌ Open election lookup error:",
                openElectionError.message
            );

            throw new Error(
                "Unable to retrieve the current election."
            );
        }


        if (openElection) {

            currentElection = openElection;

        } else {

            // -------------------------------------------------
            // FALLBACK: LATEST PUBLISHED ELECTION
            // -------------------------------------------------

            const {
                data: latestElection,
                error: latestElectionError,
            } = await supabase
                .from("elections")
                .select(`
                    id,
                    title,
                    description,
                    election_date,
                    start_time,
                    end_time,
                    status,
                    is_published,
                    published_at
                `)
                .eq(
                    "is_published",
                    true
                )
                .order(
                    "election_date",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();

            if (latestElectionError) {

                console.error(
                    "❌ Latest election lookup error:",
                    latestElectionError.message
                );

                throw new Error(
                    "Unable to retrieve the latest election."
                );
            }

            currentElection =
                latestElection || null;
        }


        // =====================================================
        // ACTIVE CANDIDATES
        // =====================================================

        let activeCandidates = 0;


        if (currentElection?.id) {

            const {
                count: candidateCount,
                error: candidateError,
            } = await supabase
                .from("candidates")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "election_id",
                    currentElection.id
                )
                .eq(
                    "is_active",
                    true
                );

            if (candidateError) {

                console.error(
                    "❌ EB active candidates count error:",
                    candidateError.message
                );

                throw new Error(
                    "Unable to retrieve active candidate count."
                );
            }

            activeCandidates =
                candidateCount || 0;
        }


        // =====================================================
        // VOTES CAST
        // =====================================================

        let votesCast = 0;


        if (currentElection?.id) {

            const {
                count: ballotCount,
                error: ballotError,
            } = await supabase
                .from("ballots")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "election_id",
                    currentElection.id
                )
                .eq(
                    "status",
                    "submitted"
                );

            if (ballotError) {

                console.error(
                    "❌ EB submitted ballots count error:",
                    ballotError.message
                );

                throw new Error(
                    "Unable to retrieve votes cast count."
                );
            }

            votesCast =
                ballotCount || 0;
        }


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            statistics: {

                registeredStudents:
                    registeredStudents || 0,

                pendingApplications:
                    pendingApplications || 0,

                approvedStudents:
                    approvedStudents || 0,

                activeCandidates:
                    activeCandidates || 0,

                votesCast:
                    votesCast || 0,
            },

            currentElection:
                currentElection
                    ? {

                        id:
                            currentElection.id,

                        title:
                            currentElection.title,

                        description:
                            currentElection.description,

                        electionDate:
                            currentElection.election_date,

                        startTime:
                            currentElection.start_time,

                        endTime:
                            currentElection.end_time,

                        status:
                            currentElection.status,

                        isPublished:
                            currentElection.is_published,

                        publishedAt:
                            currentElection.published_at,

                    }
                    : null,
        });

    } catch (error) {

        console.error(
            "❌ getEBDashboardStats error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to retrieve Electoral Board dashboard statistics.",
        });
    }
};

// =========================================================
// EB PENDING REGISTRATIONS
//
// Returns ONLY applications waiting for EB review.
// =========================================================

const getEBPendingRegistrations = async (
    req,
    res
) => {

    try {

        authenticateEB(req);

        const {
            data,
            error,
        } = await supabase
            .from(
                "registration_applications"
            )
            .select(`
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
                otp_verified_at,
                submitted_at,
                reviewed_at,
                reviewed_by,
                rejection_reason,
                correction_message,
                created_at,
                updated_at
            `)
            .eq(
                "application_status",
                "pending_review"
            )
            .order(
                "submitted_at",
                {
                    ascending: true,
                }
            );

        if (error) {

            console.error(
                "❌ EB pending registrations error:",
                error.message
            );

            throw new Error(
                "Unable to retrieve pending registration applications."
            );
        }

        return res.status(200).json({

            success: true,

            count:
                data?.length || 0,

            applications:
                data || [],

        });

    } catch (error) {

        console.error(
            "❌ getEBPendingRegistrations error:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to retrieve pending registration applications.",

        });
    }
};


// =========================================================
// EB REGISTRATION DETAILS
//
// Used when EB opens a registration application.
// =========================================================

const getEBRegistrationDetails = async (
    req,
    res
) => {

    try {

        authenticateEB(req);

        const {
            id,
        } = req.params;

        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Registration application ID is required.",

            });
        }

        const {
            data:
                application,
            error,
        } = await supabase
            .from(
                "registration_applications"
            )
            .select(`
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
                otp_verified_at,
                submitted_at,
                reviewed_at,
                reviewed_by,
                rejection_reason,
                correction_message,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

        if (error) {

            console.error(
                "❌ EB registration details error:",
                error.message
            );

            throw new Error(
                "Unable to retrieve registration details."
            );
        }

        if (!application) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration application not found.",

            });
        }

        return res.status(200).json({

            success: true,

            application,

        });

    } catch (error) {

        console.error(
            "❌ getEBRegistrationDetails error:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to retrieve registration details.",

        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    checkStudent,

    sendRegistrationOTP,

    verifyRegistrationOTP,

    resendRegistrationOTP,

    submitRegistration,

    getEBDashboardStats,

    getEBPendingRegistrations,

    getEBRegistrationDetails,

    getRegistrationStatus,

};