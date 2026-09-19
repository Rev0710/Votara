const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    sendRegistrationApprovalEmail
} = require("../services/emailService");


// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {

    const authHeader =
        req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        throw new Error(
            "Authentication token is required."
        );
    }

    const token =
        authHeader.split(" ")[1];

    if (!token) {
        throw new Error(
            "Authentication token is missing."
        );
    }

    const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        throw new Error(
            "Electoral Board access is required."
        );
    }

    if (!decoded.userId) {
        throw new Error(
            "Invalid Electoral Board account."
        );
    }

    // -----------------------------------------------------
    // VERIFY EB ACCOUNT IS STILL ACTIVE
    // -----------------------------------------------------

    const {
        data: staff,
        error,
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active
        `)
        .eq(
            "id",
            decoded.userId
        )
        .eq(
            "role",
            "electoral_board"
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `Unable to verify Electoral Board account: ${error.message}`
        );
    }

    if (!staff) {
        throw new Error(
            "Electoral Board account was not found."
        );
    }

    if (staff.is_active !== true) {
        throw new Error(
            "This Electoral Board account is inactive."
        );
    }

    return {
        token: decoded,
        staff,
    };
};


// =========================================================
// GET STUDENT REGISTRATION APPLICATIONS
// =========================================================

const getStudentRegistrations = async (
    req,
    res
) => {

    try {

        await authenticateEB(req);

        const {
            data: applications,
            error,
        } = await supabase
            .from("registration_applications")
            .select(`
                id,
                student_id,
                registration_type,
                registration_source,
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
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (error) {
            throw new Error(
                `Unable to load registration applications: ${error.message}`
            );
        }

        return res.status(200).json({

            success: true,

            applications:
                applications || [],

            count:
                applications?.length || 0,

        });

    } catch (error) {

        console.error(
            "❌ EB registration loading error:",
            error
        );

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.message.includes(
                "Electoral Board"
            ) ||
            error.message.includes(
                "Authentication token"
            ) ||
            error.message.includes(
                "inactive"
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message ||
                    "Electoral Board authentication failed.",

            });

        }

        return res.status(500).json({

            success: false,

            message:
                "Unable to load student registration applications.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,

        });

    }
};


// =========================================================
// GET SINGLE STUDENT REGISTRATION APPLICATION
// =========================================================

const getStudentRegistrationById = async (
    req,
    res
) => {

    try {

        await authenticateEB(req);

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
            data: application,
            error,
        } = await supabase
            .from("registration_applications")
            .select(`
                id,
                student_id,
                registration_type,
                registration_source,
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
                "❌ Student registration lookup error:",
                error.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load the student registration application.",

            });

        }

        if (!application) {

            return res.status(404).json({

                success: false,

                message:
                    "Student registration application not found.",

            });

        }

        // =================================================
        // LOAD REGISTRATION DOCUMENTS
        // =================================================

        const {
            data: registrationDocuments,
            error: documentsError,
        } = await supabase
            .from("registration_documents")
            .select(`
                id,
                registration_id,
                student_id,
                document_type,
                storage_path,
                original_file_name,
                file_type,
                file_size,
                verification_status,
                uploaded_at,
                verified_at,
                verified_by
            `)
            .eq(
                "registration_id",
                application.id
            )
            .order(
                "uploaded_at",
                {
                    ascending: true,
                }
            );

        if (documentsError) {

            console.error(
                "❌ Registration documents lookup error:",
                documentsError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load the student's submitted documents.",

            });

        }

        // =================================================
        // CREATE SIGNED URLS
        // =================================================

        const documentsWithSignedUrls =
            await Promise.all(

                (registrationDocuments || [])
                    .map(
                        async (document) => {

                            let signedUrl = null;

                            if (
                                document.storage_path
                            ) {

                                const {
                                    data:
                                        signedUrlData,
                                    error:
                                        signedUrlError,
                                } = await supabase
                                    .storage
                                    .from(
                                        "student-verification"
                                    )
                                    .createSignedUrl(
                                        document.storage_path,
                                        10 * 60
                                    );

                                if (
                                    signedUrlError
                                ) {

                                    console.error(
                                        `⚠️ Unable to create signed URL for ${document.document_type}:`,
                                        signedUrlError.message
                                    );

                                } else {

                                    signedUrl =
                                        signedUrlData?.signedUrl ||
                                        null;

                                }

                            }

                            return {

                                ...document,

                                signed_url:
                                    signedUrl,

                            };

                        }
                    )
            );

        // =================================================
        // LOAD IDENTITY VERIFICATION
        // =================================================

        const {
            data:
                identityVerification,
            error:
                identityError,
        } = await supabase
            .from(
                "identity_verifications"
            )
            .select(`
                id,
                registration_id,
                student_id,
                selfie_storage_path,
                verification_method,
                verification_status,
                verified_by,
                verified_at,
                created_at
            `)
            .eq(
                "registration_id",
                application.id
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();

        if (identityError) {

            console.error(
                "❌ Identity verification lookup error:",
                identityError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load the student's identity verification.",

            });

        }

        // =================================================
        // CREATE SELFIE SIGNED URL
        // =================================================

        let selfieSignedUrl = null;

        if (
            identityVerification &&
            identityVerification.selfie_storage_path
        ) {

            const {
                data:
                    selfieUrlData,
                error:
                    selfieUrlError,
            } = await supabase
                .storage
                .from(
                    "student-verification"
                )
                .createSignedUrl(
                    identityVerification.selfie_storage_path,
                    10 * 60
                );

            if (selfieUrlError) {

                console.error(
                    "⚠️ Unable to create selfie signed URL:",
                    selfieUrlError.message
                );

            } else {

                selfieSignedUrl =
                    selfieUrlData?.signedUrl ||
                    null;

            }

        }

        return res.status(200).json({

            success: true,

            application: {

                ...application,

                registration_documents:
                    documentsWithSignedUrls,

                identity_verification:
                    identityVerification
                        ? {

                            ...identityVerification,

                            selfie_signed_url:
                                selfieSignedUrl,

                            selfie_url:
                                selfieSignedUrl,

                        }
                        : null,

            },

        });

    } catch (error) {

        console.error(
            "❌ EB single registration error:",
            error
        );

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.message.includes(
                "Electoral Board"
            ) ||
            error.message.includes(
                "Authentication token"
            ) ||
            error.message.includes(
                "inactive"
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message ||
                    "Electoral Board authentication failed.",

            });

        }

        return res.status(500).json({

            success: false,

            message:
                "Unable to load the student registration application.",

        });

    }
};


// =========================================================
// GENERATE SECURE TEMPORARY PASSWORD
// =========================================================

const generateTemporaryPassword = () => {

    const randomPart =
        crypto
            .randomBytes(9)
            .toString("base64")
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(
                0,
                10
            );

    return `Votara@${randomPart}9`;
};


// =========================================================
// CREATE STUDENT NOTIFICATION
// =========================================================

const createStudentNotification = async ({
    studentId,
    registrationId,
    notificationType,
    title,
    message,
}) => {

    const {
        error,
    } = await supabase
        .from("notifications")
        .insert({

            student_id:
                studentId,

            registration_id:
                registrationId,

            notification_type:
                notificationType,

            title,

            message,

            is_read:
                false,

            sent_at:
                new Date().toISOString(),

        });

    if (error) {

        console.error(
            "⚠️ Student notification could not be created:",
            error.message
        );

        return false;
    }

    return true;
};


// =========================================================
// REVIEW STUDENT REGISTRATION
// =========================================================

const reviewStudentRegistration = async (
    req,
    res
) => {

    let ebAccount;

    let approvalEmailSent = false;

    try {

        // =================================================
        // VERIFY EB
        // =================================================

        const authResult =
            await authenticateEB(req);

        ebAccount =
            authResult.staff;

        // =================================================
        // GET APPLICATION ID
        // =================================================

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

        // =================================================
        // REQUEST DATA
        // =================================================

        const {
            decision,
            reason,
        } = req.body;

        const cleanDecision =
            String(
                decision || ""
            )
                .trim()
                .toLowerCase();

        const cleanReason =
            typeof reason === "string"
                ? reason.trim()
                : "";

        // =================================================
        // VALID DECISIONS
        // =================================================

        const allowedDecisions = [

            "approve",
            "approved",

            "reject",
            "rejected",

            "request_correction",
            "needs_correction",
            "correction",

        ];

        if (
            !allowedDecisions.includes(
                cleanDecision
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid review decision. Use approve, reject, or request_correction.",

            });

        }

        // =================================================
        // NORMALIZE DECISION
        // =================================================

        let normalizedDecision;

        if (
            cleanDecision === "approve" ||
            cleanDecision === "approved"
        ) {

            normalizedDecision =
                "approved";

        } else if (
            cleanDecision === "reject" ||
            cleanDecision === "rejected"
        ) {

            normalizedDecision =
                "rejected";

        } else {

            normalizedDecision =
                "needs_correction";

        }

        // =================================================
        // REASON REQUIRED
        // =================================================

        if (
            (
                normalizedDecision ===
                    "rejected" ||
                normalizedDecision ===
                    "needs_correction"
            ) &&
            !cleanReason
        ) {

            return res.status(400).json({

                success: false,

                message:
                    normalizedDecision ===
                    "rejected"
                        ? "A rejection reason is required."
                        : "A correction reason is required.",

            });

        }

        // =================================================
        // LOAD APPLICATION
        // =================================================

        const {
            data:
                application,
            error:
                applicationError,
        } = await supabase
            .from(
                "registration_applications"
            )
            .select(`
                id,
                student_id,
                registration_type,
                registration_source,
                application_status,
                email,
                full_name,
                year_level,
                otp_verified_at,
                submitted_at
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

        if (applicationError) {

            throw new Error(
                `Unable to load registration application: ${applicationError.message}`
            );

        }

        if (!application) {

            return res.status(404).json({

                success: false,

                message:
                    "Student registration application not found.",

            });

        }

        // =================================================
        // ONLY PENDING REVIEW
        // =================================================

        if (
            application.application_status !==
            "pending_review"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    `This application cannot be reviewed because its current status is "${application.application_status}".`,

            });

        }

        // =================================================
        // DETERMINE REGISTRATION SOURCE
        // =================================================
        //
        // ONLINE:
        // Email OTP is required.
        //
        // KIOSK:
        // Email/phone is not required.
        // EB verifies the student using the kiosk
        // registration process, documents, enrollment
        // proof, and real-time selfie.
        // =================================================

        const isKioskRegistration =
            String(
                application.registration_source || ""
            )
                .trim()
                .toLowerCase() ===
            "kiosk";

        // =================================================
        // VERIFY EMAIL OTP
        // =================================================

        if (
            !isKioskRegistration &&
            !application.otp_verified_at
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This application cannot be approved because the student's email OTP has not been verified.",

            });

        }

        // =================================================
        // VERIFY OFFICIAL STUDENT
        // =================================================

        const {
            data:
                officialStudent,
            error:
                officialStudentError,
        } = await supabase
            .from(
                "students"
            )
            .select(`
                id,
                student_id,
                registration_type,
                registration_source,
                application_status,
                email,
                full_name,
                year_level,
                enrollment_status,
                otp_verified_at,
                submitted_at
            `)
            .eq(
                "student_id",
                application.student_id
            )
            .maybeSingle();

        if (officialStudentError) {

            throw new Error(
                `Unable to verify official student record: ${officialStudentError.message}`
            );

        }

        if (!officialStudent) {

            return res.status(409).json({

                success: false,

                message:
                    "This student does not exist in the official enrollment records.",

            });

        }

        // =================================================
        // VERIFY ACTIVE ENROLLMENT
        // =================================================

        if (
            String(
                officialStudent.enrollment_status
            ).toUpperCase() !==
            "ACTIVE"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This student is not currently marked as ACTIVE in the official enrollment records.",

            });

        }

        // =================================================
        // VERIFY NAME
        // =================================================

        if (
            application.full_name &&
            String(
                application.full_name
            ).trim() !==
            String(
                officialStudent.full_name
            ).trim()
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "The student's submitted name does not match the official enrollment record. Request correction instead.",

            });

        }

        // =================================================
        // VERIFY YEAR LEVEL
        // =================================================

        if (
            application.year_level &&
            String(
                application.year_level
            ).trim() !==
            String(
                officialStudent.year_level
            ).trim()
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "The student's submitted year level does not match the official enrollment record. Request correction instead.",

            });

        }

        // =================================================
        // LOAD DOCUMENTS
        // =================================================

        const {
            data:
                documents,
            error:
                documentsError,
        } = await supabase
            .from(
                "registration_documents"
            )
            .select(`
                id,
                registration_id,
                student_id,
                document_type,
                storage_path,
                verification_status
            `)
            .eq(
                "registration_id",
                application.id
            );

        if (documentsError) {

            throw new Error(
                `Unable to verify registration documents: ${documentsError.message}`
            );

        }

        const documentList =
            documents || [];

        // =================================================
        // REQUIRED ID DOCUMENTS
        // =================================================

        const hasStudentIdFront =
            documentList.some(
                (document) =>
                    document.document_type ===
                    "student_id_front"
            );

        const hasStudentIdBack =
            documentList.some(
                (document) =>
                    document.document_type ===
                    "student_id_back"
            );

        if (
            normalizedDecision ===
                "approved" &&
            (
                !hasStudentIdFront ||
                !hasStudentIdBack
            )
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Approval is blocked because the required Student ID front and back documents are incomplete.",

            });

        }

        // =================================================
        // IDENTITY / SELFIE
        // =================================================

        const {
            data:
                identityVerification,
            error:
                identityError,
        } = await supabase
            .from(
                "identity_verifications"
            )
            .select(`
                id,
                registration_id,
                student_id,
                selfie_storage_path,
                verification_method,
                verification_status
            `)
            .eq(
                "registration_id",
                application.id
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();

        if (identityError) {

            throw new Error(
                `Unable to verify identity record: ${identityError.message}`
            );

        }

        if (
            normalizedDecision ===
                "approved" &&
            (
                !identityVerification ||
                !identityVerification.selfie_storage_path
            )
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Approval is blocked because the student's selfie/identity verification record is missing.",

            });

        }

        // =================================================
        // REJECT
        // =================================================

        if (
            normalizedDecision ===
            "rejected"
        ) {

            const {
                error:
                    rejectError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({

                    application_status:
                        "rejected",

                    rejection_reason:
                        cleanReason,

                    correction_message:
                        null,

                    reviewed_at:
                        new Date().toISOString(),

                    reviewed_by:
                        ebAccount.id,

                    updated_at:
                        new Date().toISOString(),

                })
                .eq(
                    "id",
                    application.id
                )
                .eq(
                    "application_status",
                    "pending_review"
                );

            if (rejectError) {

                throw new Error(
                    `Unable to reject registration: ${rejectError.message}`
                );

            }

            await createStudentNotification({

                studentId:
                    application.student_id,

                registrationId:
                    application.id,

                notificationType:
                    "registration_rejected",

                title:
                    "Registration Application Rejected",

                message:
                    `Your VOTARA registration application was rejected. Reason: ${cleanReason}`,

            });

            return res.status(200).json({

                success: true,

                decision:
                    "rejected",

                status:
                    "rejected",

                message:
                    "Registration application rejected successfully.",

                rejectionReason:
                    cleanReason,

            });

        }

        // =================================================
        // REQUEST CORRECTION
        // =================================================

        if (
            normalizedDecision ===
            "needs_correction"
        ) {

            const {
                error:
                    correctionError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({

                    application_status:
                        "needs_correction",

                    correction_message:
                        cleanReason,

                    rejection_reason:
                        null,

                    reviewed_at:
                        new Date().toISOString(),

                    reviewed_by:
                        ebAccount.id,

                    updated_at:
                        new Date().toISOString(),

                })
                .eq(
                    "id",
                    application.id
                )
                .eq(
                    "application_status",
                    "pending_review"
                );

            if (correctionError) {

                throw new Error(
                    `Unable to request registration correction: ${correctionError.message}`
                );

            }

            await createStudentNotification({

                studentId:
                    application.student_id,

                registrationId:
                    application.id,

                notificationType:
                    "registration_correction",

                title:
                    "Registration Correction Required",

                message:
                    `Your VOTARA registration requires correction. Please review the following: ${cleanReason}`,

            });

            return res.status(200).json({

                success: true,

                decision:
                    "needs_correction",

                status:
                    "needs_correction",

                message:
                    "Correction request sent successfully.",

                correctionMessage:
                    cleanReason,

            });

        }

        // =================================================
        // APPROVAL
        // =================================================

        // -------------------------------------------------
        // CHECK EXISTING STUDENT ACCOUNT
        // -------------------------------------------------

        const emailValue =
            application.email
                ? String(
                    application.email
                ).trim()
                : null;

        let existingAccountQuery =
            supabase
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
                    "student_id",
                    application.student_id
                );

        if (emailValue) {

            existingAccountQuery =
                supabase
                    .from(
                        "student_accounts"
                    )
                    .select(`
                        id,
                        student_id,
                        email,
                        account_status
                    `)
                    .or(
                        `student_id.eq.${application.student_id},email.eq.${emailValue}`
                    )
                    .limit(1)
                    .maybeSingle();

        } else {

            existingAccountQuery =
                existingAccountQuery
                    .limit(1)
                    .maybeSingle();

        }

        const {
            data:
                existingAccount,
            error:
                existingAccountError,
        } =
            await existingAccountQuery;

        if (existingAccountError) {

            throw new Error(
                `Unable to check existing student account: ${existingAccountError.message}`
            );

        }

        if (existingAccount) {

            return res.status(409).json({

                success: false,

                message:
                    "A student account already exists for this Student ID or email address.",

            });

        }

        // =================================================
        // GENERATE TEMPORARY PASSWORD
        // =================================================

        const temporaryPassword =
            generateTemporaryPassword();

        // =================================================
        // HASH PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // =================================================
        // CREATE STUDENT ACCOUNT
        // =================================================

        const {
            data:
                createdAccount,
            error:
                accountError,
        } = await supabase
            .from(
                "student_accounts"
            )
            .insert({

                student_id:
                    application.student_id,

                registration_id:
                    application.id,

                email:
                    emailValue,

                password_hash:
                    passwordHash,

                must_change_password:
                    true,

            })
            .select(`
                id,
                student_id,
                registration_id,
                email,
                must_change_password,
                account_status,
                created_at
            `)
            .single();

        if (accountError) {

            console.error(
                "❌ Student account creation error:",
                accountError
            );

            if (
                accountError.code ===
                "23505"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "A student account already exists for this Student ID or email address.",

                });

            }

            throw new Error(
                `Unable to create student account: ${accountError.message}`
            );

        }

        // =================================================
        // UPDATE APPLICATION TO APPROVED
        // =================================================

        const {
            data:
                updatedApplication,
            error:
                approvalUpdateError,
        } = await supabase
            .from(
                "registration_applications"
            )
            .update({

                application_status:
                    "approved",

                rejection_reason:
                    null,

                correction_message:
                    null,

                reviewed_at:
                    new Date().toISOString(),

                reviewed_by:
                    ebAccount.id,

                updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "id",
                application.id
            )
            .eq(
                "application_status",
                "pending_review"
            )
            .select(`
                id,
                student_id,
                application_status,
                reviewed_at,
                reviewed_by
            `)
            .maybeSingle();

        if (approvalUpdateError) {

            await supabase
                .from(
                    "student_accounts"
                )
                .delete()
                .eq(
                    "id",
                    createdAccount.id
                );

            throw new Error(
                `Unable to finalize registration approval: ${approvalUpdateError.message}`
            );

        }

        if (!updatedApplication) {

            await supabase
                .from(
                    "student_accounts"
                )
                .delete()
                .eq(
                    "id",
                    createdAccount.id
                );

            return res.status(409).json({

                success: false,

                message:
                    "This application changed before approval could be completed. Please refresh the application list and review it again.",

            });

        }

        // =================================================
        // CREATE APPROVAL NOTIFICATION
        // =================================================

        await createStudentNotification({

            studentId:
                application.student_id,

            registrationId:
                application.id,

            notificationType:
                "registration_approved",

            title:
                "VOTARA Registration Approved",

            message:
                "Your VOTARA registration has been approved. A temporary password has been generated for your first login. You will be required to change it after signing in.",

        });

        // =================================================
        // SEND APPROVAL EMAIL
        // =================================================
        //
        // Kiosk students may not have an email.
        // Therefore email failure does NOT undo approval.
        // =================================================

        if (emailValue) {

            try {

                await sendRegistrationApprovalEmail(

                    emailValue,

                    application.student_id,

                    officialStudent.full_name,

                    officialStudent.year_level,

                    temporaryPassword

                );

                approvalEmailSent = true;

                console.log(
                    "✅ VOTARA approval email sent."
                );

            } catch (emailError) {

                approvalEmailSent = false;

                console.error(
                    "⚠️ VOTARA approval email could not be sent."
                );

                console.error(
                    "Email:",
                    emailValue
                );

                console.error(
                    "Error:",
                    emailError.message
                );

            }

        } else {

            console.log(
                "ℹ️ Kiosk registration has no email. Approval email skipped."
            );

        }

        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            decision:
                "approved",

            status:
                "approved",

            message:
                emailValue && approvalEmailSent
                    ? "Student registration approved, student account created, and approval email sent successfully."
                    : "Student registration approved and student account created successfully.",

            student: {

                studentId:
                    application.student_id,

                fullName:
                    officialStudent.full_name,

                yearLevel:
                    officialStudent.year_level,

                email:
                    emailValue,

            },

            account: {

                id:
                    createdAccount.id,

                accountStatus:
                    createdAccount.account_status,

                mustChangePassword:
                    createdAccount.must_change_password,

            },

            temporaryPassword,

            approvalEmailSent,

        });

    } catch (error) {

        console.error(
            "❌ EB registration review error:",
            error
        );

        // =================================================
        // AUTHENTICATION ERRORS
        // =================================================

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Electoral Board"
            ) ||
            error.message.includes(
                "Authentication token"
            ) ||
            error.message.includes(
                "inactive"
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message ||
                    "Electoral Board authentication failed.",

            });

        }

        // =================================================
        // CLIENT / VALIDATION ERRORS
        // =================================================

        if (
            error.message.includes(
                "cannot be approved"
            ) ||
            error.message.includes(
                "Unable to verify"
            )
        ) {

            return res.status(409).json({

                success: false,

                message:
                    error.message,

            });

        }

        // =================================================
        // SERVER ERROR
        // =================================================

        return res.status(500).json({

            success: false,

            message:
                "Unable to process the registration review.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,

        });

    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getStudentRegistrations,

    getStudentRegistrationById,

    reviewStudentRegistration,

};