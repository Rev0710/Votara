const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    sendRegistrationApprovalEmail,
} = require("../services/emailService");

// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {
    const authHeader =
        req.headers.authorization || "";

    if (
        !authHeader.startsWith("Bearer ")
    ) {
        const error = new Error(
            "Authentication token is required."
        );

        error.statusCode = 401;

        throw error;
    }

    const token =
        authHeader
            .substring(7)
            .trim();

    if (!token) {
        const error = new Error(
            "Authentication token is missing."
        );

        error.statusCode = 401;

        throw error;
    }

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        const authError = new Error(
            "Invalid or expired Electoral Board session."
        );

        authError.statusCode = 401;

        throw authError;
    }

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        const error = new Error(
            "Electoral Board access is required."
        );

        error.statusCode = 403;

        throw error;
    }

    if (!decoded.userId) {
        const error = new Error(
            "Invalid Electoral Board account."
        );

        error.statusCode = 401;

        throw error;
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
        const authError = new Error(
            "Electoral Board account was not found."
        );

        authError.statusCode = 401;

        throw authError;
    }

    if (staff.is_active !== true) {
        const authError = new Error(
            "This Electoral Board account is inactive."
        );

        authError.statusCode = 401;

        throw authError;
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

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to load student registration applications.",

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


        // =================================================
        // LOAD APPLICATION
        // =================================================

        const {
            data: application,
            error,
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

            throw new Error(
                `Unable to load registration application: ${error.message}`
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
        // LOAD REGISTRATION DOCUMENTS
        // =================================================

        const {
            data: registrationDocuments,
            error: documentsError,
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

            throw new Error(
                `Unable to load registration documents: ${documentsError.message}`
            );
        }


        // =================================================
        // CREATE SIGNED DOCUMENT URLS
        // =================================================

        const documentsWithSignedUrls =
            await Promise.all(

                (
                    registrationDocuments ||
                    []
                ).map(
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

            throw new Error(
                `Unable to load identity verification: ${identityError.message}`
            );
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


        // =================================================
        // RESPONSE
        // =================================================

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

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
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
            .slice(0, 10);

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
        .from(
            "notifications"
        )
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

    let ebAccount = null;

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
        // ONLY PENDING APPLICATIONS
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
        // DETERMINE EMAIL AVAILABILITY
        // =================================================
        //
        // Email availability controls whether email OTP
        // is required and whether the temporary password
        // is sent by email.
        //
        // Registration source (online/kiosk) does NOT
        // change this rule.
        // =================================================

        const studentEmail =
            String(
                application.email ||
                ""
            )
                .trim()
                .toLowerCase();

        const hasEmail =
            studentEmail.length > 0;


        // =================================================
        // VERIFY EMAIL OTP WHEN EMAIL IS PROVIDED
        // =================================================

        if (
            hasEmail &&
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
        //
        // IMPORTANT:
        // The students table contains the official roster.
        //
        // DO NOT request registration-specific columns
        // from students.
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
                full_name,
                year_level,
                enrollment_status
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
                officialStudent.enrollment_status ||
                ""
            )
                .trim()
                .toUpperCase() !==
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
            )
                .trim()
                .toLowerCase() !==
            String(
                officialStudent.full_name
            )
                .trim()
                .toLowerCase()
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
            )
                .trim()
                .toLowerCase() !==
            String(
                officialStudent.year_level
            )
                .trim()
                .toLowerCase()
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "The student's submitted year level does not match the official enrollment record. Request correction instead.",

            });
        }


        // =================================================
        // LOAD REGISTRATION DOCUMENTS
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
        // REQUIRED STUDENT ID DOCUMENTS
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


        // =================================================
        // APPROVAL REQUIRES BOTH SIDES
        // =================================================

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
                verified_at
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


        // =================================================
        // SELFIE REQUIRED FOR APPROVAL
        // =================================================

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

        const {
            data:
                existingAccount,
            error:
                existingAccountError,
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
            .or(
                `student_id.eq.${application.student_id},email.eq.${studentEmail}`
            )
            .limit(1)
            .maybeSingle();


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
        // HASH TEMPORARY PASSWORD
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
                    hasEmail
                        ? studentEmail
                        : null,

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
        // UPDATE APPLICATION
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

            console.error(
                "❌ Registration approval update failed:",
                approvalUpdateError.message
            );


            // -------------------------------------------------
            // ROLLBACK ACCOUNT CREATION
            // -------------------------------------------------

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

            // -------------------------------------------------
            // APPLICATION CHANGED BEFORE APPROVAL
            // -------------------------------------------------

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
        // SEND DEFAULT PASSWORD BY EMAIL WHEN EMAIL EXISTS
        // =================================================

        let approvalEmailSent = false;

        if (hasEmail) {

            try {

                console.log(
                    "================================="
                );

                console.log(
                    "📧 SENDING VOTARA APPROVAL EMAIL"
                );

                console.log(
                    "================================="
                );

                console.log(
                    "To:",
                    studentEmail
                );


                await sendRegistrationApprovalEmail(
                    studentEmail,
                    application.student_id,
                    officialStudent.full_name,
                    officialStudent.year_level,
                    temporaryPassword
                );


                approvalEmailSent = true;


                console.log(
                    "================================="
                );

                console.log(
                    "✅ VOTARA APPROVAL EMAIL SENT SUCCESSFULLY"
                );

                console.log(
                    "================================="
                );

            } catch (emailError) {

                approvalEmailSent = false;

                console.error(
                    "================================="
                );

                console.error(
                    "❌ VOTARA APPROVAL EMAIL FAILED"
                );

                console.error(
                    "================================="
                );

                console.error(
                    "Email:",
                    studentEmail
                );

                console.error(
                    "Error:",
                    emailError.message
                );
            }

        } else {

            console.log(
                "================================="
            );

            console.log(
                "ℹ️ NO EMAIL PROVIDED"
            );

            console.log(
                "ℹ️ APPROVAL EMAIL NOT SENT"
            );

            console.log(
                "ℹ️ STUDENT WILL CONTINUE NO-EMAIL ACTIVATION"
            );

            console.log(
                "================================="
            );
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
                hasEmail
                    ? (
                        approvalEmailSent
                            ? "Your VOTARA registration has been approved. Your temporary password has been sent to your registered email address. You will be required to change it after signing in."
                            : "Your VOTARA registration has been approved. Your temporary password was generated, but the email could not be delivered."
                    )
                    : "Your VOTARA registration has been approved. No email was provided, so please continue through the no-email activation process.",

        });


        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            decision:
                "approved",

            status:
                "approved",

            message:
                hasEmail
                    ? (
                        approvalEmailSent
                            ? "Student registration approved, account created, and the default password was sent successfully to the student's email."
                            : "Student registration approved and account created, but the default password email could not be sent."
                    )
                    : "Student registration approved successfully. No email was provided, so the student will continue through the no-email activation process.",

            student: {

                studentId:
                    application.student_id,

                fullName:
                    officialStudent.full_name,

                yearLevel:
                    officialStudent.year_level,

                email:
                    studentEmail ||
                    null,

            },

            account: {

                id:
                    createdAccount.id,

                accountStatus:
                    createdAccount.account_status,

                mustChangePassword:
                    createdAccount.must_change_password,

            },

            temporaryPassword:
                hasEmail
                    ? temporaryPassword
                    : null,

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
            error.statusCode === 401 ||
            error.statusCode === 403 ||
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError"
        ) {

            return res.status(
                error.statusCode ||
                401
            ).json({

                success: false,

                message:
                    error.message ||
                    "Electoral Board authentication failed.",

            });
        }


        // =================================================
        // VALIDATION / CONFLICT ERRORS
        // =================================================

        if (
            error.message.includes(
                "cannot be approved"
            ) ||
            error.message.includes(
                "does not exist"
            ) ||
            error.message.includes(
                "does not match"
            ) ||
            error.message.includes(
                "Approval is blocked"
            ) ||
            error.message.includes(
                "not currently marked as ACTIVE"
            ) ||
            error.message.includes(
                "already exists"
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