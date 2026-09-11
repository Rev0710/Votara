const supabase = require("../config/supabase");


// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_BUCKET =
    "student-verification";

const MAX_FILE_SIZE =
    5 * 1024 * 1024; // 5 MB


const ALLOWED_DOCUMENT_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];


// =========================================================
// DATA URL PARSER
// =========================================================

const parseDataUrl = (dataUrl) => {

    if (
        typeof dataUrl !== "string"
    ) {
        return null;
    }


    const match =
        dataUrl.match(
            /^data:([^;]+);base64,(.+)$/
        );


    if (!match) {
        return null;
    }


    return {
        mimeType:
            match[1],

        base64:
            match[2],
    };
};


// =========================================================
// VALIDATE FILE
// =========================================================

const validateFile = (
    file,
    fieldName
) => {

    if (!file) {

        return {
            valid: false,

            message:
                `${fieldName} is required.`,
        };
    }


    const parsed =
        parseDataUrl(file.data);


    if (!parsed) {

        return {
            valid: false,

            message:
                `${fieldName} has an invalid file format.`,
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


    const buffer =
        Buffer.from(
            parsed.base64,
            "base64"
        );


    if (
        buffer.length >
        MAX_FILE_SIZE
    ) {

        return {
            valid: false,

            message:
                `${fieldName} must be 5MB or smaller.`,
        };
    }


    return {
        valid: true,

        mimeType:
            parsed.mimeType,

        buffer,
    };
};


// =========================================================
// SELFIE VALIDATION
// =========================================================

const validateSelfie = (
    selfie
) => {

    if (!selfie) {

        return {
            valid: false,

            message:
                "Real-time selfie is required.",
        };
    }


    const parsed =
        parseDataUrl(selfie);


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
        ].includes(
            parsed.mimeType
        )
    ) {

        return {
            valid: false,

            message:
                "Selfie must be a JPG or PNG image.",
        };
    }


    const buffer =
        Buffer.from(
            parsed.base64,
            "base64"
        );


    if (
        buffer.length >
        MAX_FILE_SIZE
    ) {

        return {
            valid: false,

            message:
                "Selfie must be 5MB or smaller.",
        };
    }


    return {
        valid: true,

        mimeType:
            parsed.mimeType,

        buffer,
    };
};


// =========================================================
// FILE EXTENSION
// =========================================================

const getExtension = (
    mimeType
) => {

    if (
        mimeType ===
        "image/jpeg"
    ) {
        return "jpg";
    }


    if (
        mimeType ===
        "image/png"
    ) {
        return "png";
    }


    if (
        mimeType ===
        "application/pdf"
    ) {
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

    const {
        error,
    } = await supabase
        .storage
        .from(
            STORAGE_BUCKET
        )
        .upload(
            path,
            buffer,
            {
                contentType:
                    mimeType,

                upsert:
                    false,
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

const uploadRegistrationRequirements =
    async (
        req,
        res
    ) => {

        try {

            const {
                studentId,
                email,

                studentIdFront,
                studentIdBack,

                enrollmentProof,
                supportingDocument,

                selfie,
            } = req.body;


            // =================================================
            // BASIC VALIDATION
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


            const normalizedStudentId =
                String(
                    studentId
                ).trim();


            const normalizedEmail =
                String(
                    email
                )
                    .trim()
                    .toLowerCase();


            // =================================================
            // FIND REGISTRATION
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


            if (
                registrationError
            ) {

                console.error(
                    "Registration lookup error:",
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


            // =================================================
            // OTP MUST BE VERIFIED
            // =================================================

            if (
                registration.application_status !==
                "otp_verified"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your email must be verified before submitting registration requirements.",
                });
            }


            // =================================================
            // VALIDATE REQUIRED DOCUMENTS
            // =================================================

            const frontValidation =
                validateFile(
                    studentIdFront,
                    "Student ID Front"
                );


            if (
                !frontValidation.valid
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        frontValidation.message,
                });
            }


            const backValidation =
                validateFile(
                    studentIdBack,
                    "Student ID Back"
                );


            if (
                !backValidation.valid
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        backValidation.message,
                });
            }


            // =================================================
            // VALIDATE SELFIE
            // =================================================

            const selfieValidation =
                validateSelfie(
                    selfie
                );


            if (
                !selfieValidation.valid
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        selfieValidation.message,
                });
            }


            // =================================================
            // VALIDATE OPTIONAL FILES
            // =================================================

            let enrollmentValidation =
                null;


            if (
                enrollmentProof
            ) {

                enrollmentValidation =
                    validateFile(
                        enrollmentProof,
                        "Enrollment Proof"
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


            let supportingValidation =
                null;


            if (
                supportingDocument
            ) {

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
            // UNIQUE STORAGE PREFIX
            // =================================================

            const registrationId =
                registration.id;


            const storagePrefix =
                `registrations/${registrationId}`;


            const uploadedDocuments =
                [];


            // =================================================
            // UPLOAD STUDENT ID FRONT
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
            // UPLOAD STUDENT ID BACK
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
            // OPTIONAL ENROLLMENT PROOF
            // =================================================

            if (
                enrollmentValidation
            ) {

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
            // OPTIONAL SUPPORTING DOCUMENT
            // =================================================

            if (
                supportingValidation
            ) {

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
                        "supporting_document",

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
                data:
                    savedDocuments,
                error:
                    documentError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .insert(
                    documentRows
                )
                .select();


            if (
                documentError
            ) {

                console.error(
                    "Document metadata error:",
                    documentError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Documents were uploaded but their verification records could not be saved.",
                });
            }


            // =================================================
            // UPLOAD SELFIE
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
            // SAVE IDENTITY VERIFICATION
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
                .insert({

                    registration_id:
                        registration.id,

                    student_id:
                        registration.student_id,

                    selfie_storage_path:
                        selfiePath,

                    verification_method:
                        "online",

                    verification_status:
                        "pending",

                })
                .select()
                .single();


            if (
                identityError
            ) {

                console.error(
                    "Identity verification error:",
                    identityError.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Selfie was uploaded but its verification record could not be saved.",
                });
            }


            // =================================================
            // UPDATE APPLICATION STATUS
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


            if (
                updateError
            ) {

                console.error(
                    "Registration status update error:",
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

                message:
                    "Registration requirements submitted successfully. Your application is now pending review.",

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

        } catch (error) {

            console.error(
                "❌ Registration requirements upload error:"
            );

            console.error(
                error
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