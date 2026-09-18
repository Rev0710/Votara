const supabase = require("../config/supabase");


// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_BUCKET = "student-verification";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_DOCUMENT_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];


// =========================================================
// DATA URL PARSER
// =========================================================

const parseDataUrl = (dataUrl) => {

    if (typeof dataUrl !== "string") {
        return null;
    }

    const match = dataUrl.match(
        /^data:([^;]+);base64,(.+)$/
    );

    if (!match) {
        return null;
    }

    return {
        mimeType: match[1],
        base64: match[2],
    };
};


// =========================================================
// VALIDATE DOCUMENT FILE
// =========================================================

const validateFile = (file, fieldName) => {

    if (!file) {

        return {
            valid: false,
            message: `${fieldName} is required.`,
        };
    }

    const parsed = parseDataUrl(file.data);

    if (!parsed) {

        return {
            valid: false,
            message: `${fieldName} has an invalid file format.`,
        };
    }

    if (
        !ALLOWED_DOCUMENT_TYPES.includes(
            parsed.mimeType
        )
    ) {

        return {
            valid: false,
            message:
                `${fieldName} must be a JPG, PNG, or PDF file.`,
        };
    }

    const buffer = Buffer.from(
        parsed.base64,
        "base64"
    );

    if (buffer.length > MAX_FILE_SIZE) {

        return {
            valid: false,
            message:
                `${fieldName} must be 5MB or smaller.`,
        };
    }

    return {
        valid: true,
        mimeType: parsed.mimeType,
        buffer,
    };
};


// =========================================================
// VALIDATE SELFIE
// =========================================================

const validateSelfie = (selfie) => {

    if (!selfie) {

        return {
            valid: false,
            message:
                "Real-time selfie is required.",
        };
    }

    const parsed = parseDataUrl(selfie);

    if (!parsed) {

        return {
            valid: false,
            message:
                "Invalid selfie image.",
        };
    }

    if (
        ![
            "image/jpeg",
            "image/png",
        ].includes(parsed.mimeType)
    ) {

        return {
            valid: false,
            message:
                "Selfie must be a JPG or PNG image.",
        };
    }

    const buffer = Buffer.from(
        parsed.base64,
        "base64"
    );

    if (buffer.length > MAX_FILE_SIZE) {

        return {
            valid: false,
            message:
                "Selfie must be 5MB or smaller.",
        };
    }

    return {
        valid: true,
        mimeType: parsed.mimeType,
        buffer,
    };
};


// =========================================================
// FILE EXTENSION
// =========================================================

const getExtension = (mimeType) => {

    if (mimeType === "image/jpeg") {
        return "jpg";
    }

    if (mimeType === "image/png") {
        return "png";
    }

    if (mimeType === "application/pdf") {
        return "pdf";
    }

    return "bin";
};


// =========================================================
// UPLOAD TO SUPABASE STORAGE
// =========================================================

const uploadToStorage = async ({
    buffer,
    mimeType,
    path,
}) => {

    const { error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(
            path,
            buffer,
            {
                contentType: mimeType,
                upsert: true,
            }
        );

    if (error) {

        throw new Error(
            `Storage upload failed: ${error.message}`
        );
    }

    return path;
};


// =========================================================
// UPLOAD REGISTRATION REQUIREMENTS
// =========================================================

const uploadRegistrationRequirements = async (
    req,
    res
) => {

    try {

        // =====================================================
        // REQUEST DATA
        // =====================================================

        const {
            studentId,
            email,

            // IMPORTANT:
            // These are required for late enrollees.
            fullName,
            yearLevel,

            studentIdFront,
            studentIdBack,

            enrollmentProof,
            supportingDocument,

            selfie,
        } = req.body;


        // =====================================================
        // BASIC VALIDATION
        // =====================================================

        if (!studentId || !email) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and email are required.",
            });
        }


        const normalizedStudentId =
            String(studentId).trim();


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =====================================================
        // FIND LATEST REGISTRATION APPLICATION
        // =====================================================

        const {
            data: registration,
            error: registrationError,
        } = await supabase
            .from("registration_applications")
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


        if (registrationError) {

            console.error(
                "❌ Registration lookup error:",
                registrationError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to find registration application.",
            });
        }


        if (!registration) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration application not found.",
            });
        }


        // =====================================================
        // DETERMINE REGISTRATION TYPE
        // =====================================================

        const isLateEnrollee =
            registration.registration_type ===
            "late";


        const isNormalStudent =
            registration.registration_type ===
            "normal";


        // =====================================================
        // DETERMINE SUBMISSION STATUS
        // =====================================================

        /*
            NORMAL STUDENT:

            otp_verified
                ↓
            requirements
                ↓
            pending_review


            LATE ENROLLEE:

            draft
                ↓
            requirements
                ↓
            pending_review


            CORRECTION:

            needs_correction
                ↓
            corrected requirements
                ↓
            pending_review
        */


        const isInitialSubmission =
            registration.application_status ===
                "otp_verified"

            ||

            (
                isLateEnrollee &&
                registration.application_status ===
                    "draft"
            );


        const isCorrectionResubmission =
            registration.application_status ===
            "needs_correction";


        // =====================================================
        // INVALID SUBMISSION STATUS
        // =====================================================

        if (
            !isInitialSubmission &&
            !isCorrectionResubmission
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This registration is not currently available for requirements submission or correction.",
            });
        }


        // =====================================================
        // LATE ENROLLEE INFORMATION
        // =====================================================

        /*
            Late enrollees are not found in the original
            student roster.

            Therefore:

            - Full name is collected from the student.
            - Year level is collected from the student.
            - EB will verify these details.
            - They are NOT automatically trusted.
        */

        if (
            isInitialSubmission &&
            isLateEnrollee
        ) {

            const cleanedFullName =
                String(
                    fullName || ""
                ).trim();


            const cleanedYearLevel =
                String(
                    yearLevel || ""
                ).trim();


            if (!cleanedFullName) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Full name is required for late enrollee registration.",
                });
            }


            if (!cleanedYearLevel) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Year level is required for late enrollee registration.",
                });
            }


            // -------------------------------------------------
            // Validate year level
            // -------------------------------------------------

            const allowedYearLevels = [
                "1st Year",
                "2nd Year",
                "3rd Year",
                "4th Year",
            ];


            if (
                !allowedYearLevels.includes(
                    cleanedYearLevel
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid year level.",
                });
            }


            // -------------------------------------------------
            // Save late enrollee information
            // -------------------------------------------------

            const {
                error: lateInfoError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({

                    full_name:
                        cleanedFullName,

                    year_level:
                        cleanedYearLevel,

                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    registration.id
                );


            if (lateInfoError) {

                console.error(
                    "❌ Late enrollee information update error:",
                    lateInfoError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to save late enrollee information.",
                });
            }


            // Update local object so the response uses
            // the latest information.

            registration.full_name =
                cleanedFullName;

            registration.year_level =
                cleanedYearLevel;
        }


        // =====================================================
        // INITIAL SUBMISSION
        // =====================================================

        if (isInitialSubmission) {


            // =================================================
            // STUDENT ID FRONT
            // =================================================

            const frontValidation =
                validateFile(
                    studentIdFront,
                    "Student ID Front"
                );


            if (!frontValidation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        frontValidation.message,
                });
            }


            // =================================================
            // STUDENT ID BACK
            // =================================================

            const backValidation =
                validateFile(
                    studentIdBack,
                    "Student ID Back"
                );


            if (!backValidation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        backValidation.message,
                });
            }


            // =================================================
            // SELFIE
            // =================================================

            const selfieValidation =
                validateSelfie(selfie);


            if (!selfieValidation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        selfieValidation.message,
                });
            }


            // =================================================
            // LATE ENROLLEE REGISTRATION FORM
            // =================================================

            /*
                For late enrollees, enrollmentProof is treated
                as the required Registration Form / enrollment
                proof.
            */

            if (
                isLateEnrollee &&
                !enrollmentProof
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Registration Form / enrollment proof is required for late enrollee registration.",
                });
            }


            // =================================================
            // ENROLLMENT PROOF VALIDATION
            // =================================================

            let enrollmentValidation = null;


            if (enrollmentProof) {

                enrollmentValidation =
                    validateFile(
                        enrollmentProof,
                        isLateEnrollee
                            ? "Registration Form / Enrollment Proof"
                            : "Enrollment Proof"
                    );


                if (
                    !enrollmentValidation.valid
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            enrollmentValidation.message,
                    });
                }
            }


            // =================================================
            // SUPPORTING DOCUMENT
            // =================================================

            let supportingValidation = null;


            if (supportingDocument) {

                supportingValidation =
                    validateFile(
                        supportingDocument,
                        "Supporting Document"
                    );


                if (
                    !supportingValidation.valid
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            supportingValidation.message,
                    });
                }
            }


            // =================================================
            // STORAGE PREFIX
            // =================================================

            const registrationId =
                registration.id;


            const storagePrefix =
                `registrations/${registrationId}`;


            const uploadedDocuments = [];


            // =================================================
            // STUDENT ID FRONT UPLOAD
            // =================================================

            const frontExtension =
                getExtension(
                    frontValidation.mimeType
                );


            const frontPath =
                `${storagePrefix}/student-id-front.${frontExtension}`;


            await uploadToStorage({

                buffer:
                    frontValidation.buffer,

                mimeType:
                    frontValidation.mimeType,

                path:
                    frontPath,
            });


            uploadedDocuments.push({

                documentType:
                    "student_id_front",

                storagePath:
                    frontPath,

                originalFileName:
                    studentIdFront.name ||
                    `student-id-front.${frontExtension}`,

                fileType:
                    frontValidation.mimeType,

                fileSize:
                    frontValidation.buffer.length,
            });


            // =================================================
            // STUDENT ID BACK UPLOAD
            // =================================================

            const backExtension =
                getExtension(
                    backValidation.mimeType
                );


            const backPath =
                `${storagePrefix}/student-id-back.${backExtension}`;


            await uploadToStorage({

                buffer:
                    backValidation.buffer,

                mimeType:
                    backValidation.mimeType,

                path:
                    backPath,
            });


            uploadedDocuments.push({

                documentType:
                    "student_id_back",

                storagePath:
                    backPath,

                originalFileName:
                    studentIdBack.name ||
                    `student-id-back.${backExtension}`,

                fileType:
                    backValidation.mimeType,

                fileSize:
                    backValidation.buffer.length,
            });


            // =================================================
            // REGISTRATION FORM / ENROLLMENT PROOF
            // =================================================

            if (enrollmentValidation) {

                const extension =
                    getExtension(
                        enrollmentValidation.mimeType
                    );


                const path =
                    `${storagePrefix}/enrollment-proof.${extension}`;


                await uploadToStorage({

                    buffer:
                        enrollmentValidation.buffer,

                    mimeType:
                        enrollmentValidation.mimeType,

                    path,
                });


                uploadedDocuments.push({

                    documentType:
                        "enrollment_proof",

                    storagePath:
                        path,

                    originalFileName:
                        enrollmentProof.name ||
                        `enrollment-proof.${extension}`,

                    fileType:
                        enrollmentValidation.mimeType,

                    fileSize:
                        enrollmentValidation.buffer.length,
                });
            }


            // =================================================
            // SUPPORTING DOCUMENT
            // =================================================

            if (supportingValidation) {

                const extension =
                    getExtension(
                        supportingValidation.mimeType
                    );


                const path =
                    `${storagePrefix}/supporting-document.${extension}`;


                await uploadToStorage({

                    buffer:
                        supportingValidation.buffer,

                    mimeType:
                        supportingValidation.mimeType,

                    path,
                });


                uploadedDocuments.push({

                    documentType:
                        "other",

                    storagePath:
                        path,

                    originalFileName:
                        supportingDocument.name ||
                        `supporting-document.${extension}`,

                    fileType:
                        supportingValidation.mimeType,

                    fileSize:
                        supportingValidation.buffer.length,
                });
            }


            // =================================================
            // SAVE DOCUMENT METADATA
            // =================================================

            const documentRows =
                uploadedDocuments.map(
                    (document) => ({

                        registration_id:
                            registration.id,

                        student_id:
                            registration.student_id,

                        document_type:
                            document.documentType,

                        storage_path:
                            document.storagePath,

                        original_file_name:
                            document.originalFileName,

                        file_type:
                            document.fileType,

                        file_size:
                            document.fileSize,

                        verification_status:
                            "pending",
                    })
                );


            const {
                data: savedDocuments,
                error: documentError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .insert(
                    documentRows
                )
                .select();


            if (documentError) {

                console.error(
                    "❌ Document metadata error:",
                    documentError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Documents were uploaded but their verification records could not be saved.",
                });
            }


            // =================================================
            // SELFIE UPLOAD
            // =================================================

            const selfieExtension =
                getExtension(
                    selfieValidation.mimeType
                );


            const selfiePath =
                `${storagePrefix}/selfie.${selfieExtension}`;


            await uploadToStorage({

                buffer:
                    selfieValidation.buffer,

                mimeType:
                    selfieValidation.mimeType,

                path:
                    selfiePath,
            });


            // =================================================
            // IDENTITY VERIFICATION RECORD
            // =================================================

            const identityData = {

                registration_id:
                    registration.id,

                selfie_storage_path:
                    selfiePath,

                verification_method:
                    "online",

                verification_status:
                    "pending",
            };


            /*
                Only attach student_id when the registration
                already belongs to a student record.

                A late enrollee may not exist in the official
                students roster yet.
            */

            if (
                registration.student_id
            ) {

                identityData.student_id =
                    registration.student_id;
            }


            const {
                data: identityVerification,
                error: identityError,
            } = await supabase
                .from(
                    "identity_verifications"
                )
                .insert(
                    identityData
                )
                .select()
                .single();


            if (identityError) {

                console.error(
                    "❌ Identity verification error:",
                    identityError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Selfie was uploaded but its verification record could not be saved.",
                });
            }


            // =================================================
            // CHANGE APPLICATION STATUS
            // =================================================

            const {
                data: updatedRegistration,
                error: updateError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({

                    application_status:
                        "pending_review",

                    submitted_at:
                        new Date().toISOString(),

                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    registration.id
                )
                .select()
                .single();


            if (updateError) {

                console.error(
                    "❌ Registration status update error:",
                    updateError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Requirements were uploaded but the registration status could not be updated.",
                });
            }


            // =================================================
            // SUCCESS
            // =================================================

            return res.status(200).json({

                success: true,

                registrationSubmitted:
                    true,

                registrationStatus:
                    "pending_review",

                submissionType:
                    "initial",

                isLateEnrollee:
                    isLateEnrollee,

                message:
                    isLateEnrollee
                        ? "Late enrollee registration requirements submitted successfully. Your application is now pending Electoral Board review."
                        : "Registration requirements submitted successfully. Your application is now pending review.",

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

                documents:
                    savedDocuments,

                identityVerification: {

                    id:
                        identityVerification.id,

                    status:
                        identityVerification.verification_status,
                },
            });
        }


        // =====================================================
        // CORRECTION RESUBMISSION
        // =====================================================

        const suppliedDocuments = [];


        // =====================================================
        // CORRECTED STUDENT ID FRONT
        // =====================================================

        if (studentIdFront) {

            const validation =
                validateFile(
                    studentIdFront,
                    "Student ID Front"
                );


            if (!validation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        validation.message,
                });
            }


            suppliedDocuments.push({

                documentType:
                    "student_id_front",

                file:
                    studentIdFront,

                validation,

                baseName:
                    "student-id-front",
            });
        }


        // =====================================================
        // CORRECTED STUDENT ID BACK
        // =====================================================

        if (studentIdBack) {

            const validation =
                validateFile(
                    studentIdBack,
                    "Student ID Back"
                );


            if (!validation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        validation.message,
                });
            }


            suppliedDocuments.push({

                documentType:
                    "student_id_back",

                file:
                    studentIdBack,

                validation,

                baseName:
                    "student-id-back",
            });
        }


        // =====================================================
        // CORRECTED ENROLLMENT PROOF
        // =====================================================

        if (enrollmentProof) {

            const validation =
                validateFile(
                    enrollmentProof,
                    "Enrollment Proof"
                );


            if (!validation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        validation.message,
                });
            }


            suppliedDocuments.push({

                documentType:
                    "enrollment_proof",

                file:
                    enrollmentProof,

                validation,

                baseName:
                    "enrollment-proof",
            });
        }


        // =====================================================
        // CORRECTED SUPPORTING DOCUMENT
        // =====================================================

        if (supportingDocument) {

            const validation =
                validateFile(
                    supportingDocument,
                    "Supporting Document"
                );


            if (!validation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        validation.message,
                });
            }


            suppliedDocuments.push({

                documentType:
                    "other",

                file:
                    supportingDocument,

                validation,

                baseName:
                    "supporting-document",
            });
        }


        // =====================================================
        // CORRECTED SELFIE
        // =====================================================

        const hasSelfie =
            Boolean(selfie);


        let selfieValidation =
            null;


        if (hasSelfie) {

            selfieValidation =
                validateSelfie(selfie);


            if (!selfieValidation.valid) {

                return res.status(400).json({

                    success: false,

                    message:
                        selfieValidation.message,
                });
            }
        }


        // =====================================================
        // NOTHING PROVIDED
        // =====================================================

        if (
            suppliedDocuments.length === 0 &&
            !hasSelfie
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please submit at least one corrected document or a new selfie.",
            });
        }


        // =====================================================
        // STORAGE PREFIX
        // =====================================================

        const registrationId =
            registration.id;


        const storagePrefix =
            `registrations/${registrationId}`;


        const replacedDocuments = [];


        // =====================================================
        // REPLACE CORRECTED DOCUMENTS
        // =====================================================

        for (
            const document
            of suppliedDocuments
        ) {

            const extension =
                getExtension(
                    document.validation.mimeType
                );


            const path =
                `${storagePrefix}/${document.baseName}.${extension}`;


            // -------------------------------------------------
            // Replace storage object
            // -------------------------------------------------

            const {
                error: storageError,
            } = await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .upload(
                    path,
                    document.validation.buffer,
                    {
                        contentType:
                            document.validation.mimeType,

                        upsert:
                            true,
                    }
                );


            if (storageError) {

                throw new Error(
                    `Storage upload failed: ${storageError.message}`
                );
            }


            // -------------------------------------------------
            // Remove old metadata
            // -------------------------------------------------

            const {
                error:
                    deleteMetadataError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .delete()
                .eq(
                    "registration_id",
                    registration.id
                )
                .eq(
                    "document_type",
                    document.documentType
                );


            if (deleteMetadataError) {

                throw new Error(
                    `Unable to replace ${document.documentType} verification record: ${deleteMetadataError.message}`
                );
            }


            // -------------------------------------------------
            // Save new metadata
            // -------------------------------------------------

            const {
                data:
                    insertedDocument,

                error:
                    insertMetadataError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .insert({

                    registration_id:
                        registration.id,

                    student_id:
                        registration.student_id,

                    document_type:
                        document.documentType,

                    storage_path:
                        path,

                    original_file_name:
                        document.file.name ||
                        `${document.baseName}.${extension}`,

                    file_type:
                        document.validation.mimeType,

                    file_size:
                        document.validation.buffer.length,

                    verification_status:
                        "pending",

                })
                .select()
                .single();


            if (insertMetadataError) {

                throw new Error(
                    `Unable to save corrected ${document.documentType} record: ${insertMetadataError.message}`
                );
            }


            replacedDocuments.push(
                insertedDocument
            );
        }


        // =====================================================
        // REPLACE SELFIE
        // =====================================================

        let identityVerification =
            null;


        if (hasSelfie) {

            const extension =
                getExtension(
                    selfieValidation.mimeType
                );


            const selfiePath =
                `${storagePrefix}/selfie.${extension}`;


            // -------------------------------------------------
            // Upload selfie
            // -------------------------------------------------

            const {
                error:
                    selfieStorageError,
            } = await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .upload(
                    selfiePath,
                    selfieValidation.buffer,
                    {
                        contentType:
                            selfieValidation.mimeType,

                        upsert:
                            true,
                    }
                );


            if (selfieStorageError) {

                throw new Error(
                    `Selfie storage upload failed: ${selfieStorageError.message}`
                );
            }


            // -------------------------------------------------
            // Find previous verification
            // -------------------------------------------------

            const {
                data:
                    existingIdentity,

                error:
                    existingIdentityError,
            } = await supabase
                .from(
                    "identity_verifications"
                )
                .select("id")
                .eq(
                    "registration_id",
                    registration.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


            if (existingIdentityError) {

                throw new Error(
                    `Unable to find existing identity verification: ${existingIdentityError.message}`
                );
            }


            // -------------------------------------------------
            // Update existing verification
            // -------------------------------------------------

            if (existingIdentity) {

                const {
                    data:
                        updatedIdentity,

                    error:
                        identityUpdateError,
                } = await supabase
                    .from(
                        "identity_verifications"
                    )
                    .update({

                        selfie_storage_path:
                            selfiePath,

                        verification_method:
                            "online",

                        verification_status:
                            "pending",

                        verified_by:
                            null,

                        verified_at:
                            null,

                    })
                    .eq(
                        "id",
                        existingIdentity.id
                    )
                    .select()
                    .single();


                if (identityUpdateError) {

                    throw new Error(
                        `Unable to update identity verification: ${identityUpdateError.message}`
                    );
                }


                identityVerification =
                    updatedIdentity;

            } else {

                // -------------------------------------------------
                // Create new verification
                // -------------------------------------------------

                const identityData = {

                    registration_id:
                        registration.id,

                    selfie_storage_path:
                        selfiePath,

                    verification_method:
                        "online",

                    verification_status:
                        "pending",
                };


                if (
                    registration.student_id
                ) {

                    identityData.student_id =
                        registration.student_id;
                }


                const {
                    data:
                        insertedIdentity,

                    error:
                        identityInsertError,
                } = await supabase
                    .from(
                        "identity_verifications"
                    )
                    .insert(
                        identityData
                    )
                    .select()
                    .single();


                if (identityInsertError) {

                    throw new Error(
                        `Unable to save identity verification: ${identityInsertError.message}`
                    );
                }


                identityVerification =
                    insertedIdentity;
            }
        }


        // =====================================================
        // RETURN TO PENDING REVIEW
        // =====================================================

        const {
            data:
                updatedRegistration,

            error:
                updateError,
        } = await supabase
            .from(
                "registration_applications"
            )
            .update({

                application_status:
                    "pending_review",

                submitted_at:
                    new Date().toISOString(),

                updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "id",
                registration.id
            )
            .eq(
                "application_status",
                "needs_correction"
            )
            .select()
            .single();


        if (updateError) {

            console.error(
                "❌ Correction status update error:",
                updateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Corrected requirements were processed but the registration could not be returned to pending review.",
            });
        }


        // =====================================================
        // CORRECTION SUCCESS
        // =====================================================

        return res.status(200).json({

            success: true,

            registrationSubmitted:
                true,

            registrationStatus:
                "pending_review",

            submissionType:
                "correction",

            isLateEnrollee:
                isLateEnrollee,

            message:
                "Your corrected requirements were submitted successfully. Your application is now pending review again.",

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

            documents:
                replacedDocuments,

            identityVerification:
                identityVerification
                    ? {

                        id:
                            identityVerification.id,

                        status:
                            identityVerification.verification_status,

                    }
                    : null,
        });


    } catch (error) {

        console.error(
            "❌ Registration requirements upload error:"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to upload registration requirements.",
        });
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    uploadRegistrationRequirements,
};