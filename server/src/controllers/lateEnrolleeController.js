const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

const {
    sendRegistrationApprovalEmail,
} = require("../services/emailService");

const LATE_REGISTRATION_TYPES = [
    "late_enrollee",
    "late",
];

const ALLOWED_YEAR_LEVELS = [
    "2nd Year",
    "3rd Year",
    "4th Year",
];

const DOCUMENT_BUCKET =
    "student-verification";

const SELFIE_BUCKET =
    "student-verification";

const LEGACY_DOCUMENT_BUCKET =
    "registration-documents";

const SIGNED_URL_EXPIRATION =
    60 * 60;


// ============================================================
// BASIC HELPERS
// ============================================================

const clean = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
};


// ============================================================
// YEAR LEVEL
// ============================================================

const normalizeYearLevel = (value) => {
    const cleaned = clean(value);

    const aliases = {
        "1": "1st Year",
        "1st": "1st Year",
        "1st year": "1st Year",

        "2": "2nd Year",
        "2nd": "2nd Year",
        "2nd year": "2nd Year",

        "3": "3rd Year",
        "3rd": "3rd Year",
        "3rd year": "3rd Year",

        "4": "4th Year",
        "4th": "4th Year",
        "4th year": "4th Year",
    };

    return (
        aliases[cleaned.toLowerCase()] ||
        cleaned
    );
};


// ============================================================
// EMAIL VALIDATION
// ============================================================

const isValidEmail = (email) => {
    const value = clean(email);

    if (!value) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};


// ============================================================
// REGISTRATION SOURCE
// ============================================================

const getRegistrationSource = (
    application
) => {
    const source = clean(
        application?.registration_source
    ).toLowerCase();

    const email = clean(
        application?.email
    ).toLowerCase();

    if (
        source === "kiosk"
    ) {
        return "kiosk";
    }

    if (!email) {
        return "kiosk";
    }

    if (
        source === "online"
    ) {
        return "online";
    }

    return "online";
};


// ============================================================
// ELECTORAL BOARD AUTHENTICATION
// ============================================================

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

    const decoded = jwt.verify(
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

    if (!staff.is_active) {
        throw new Error(
            "Electoral Board account is inactive."
        );
    }

    return staff;
};


// ============================================================
// FIND STUDENT
// ============================================================

const findStudent = async (
    studentId
) => {
    const normalizedStudentId =
        clean(studentId);

    if (!normalizedStudentId) {
        return null;
    }

    const {
        data,
        error,
    } = await supabase
        .from("students")
        .select(`
            id,
            student_id,
            full_name,
            year_level,
            enrollment_status,
            created_at,
            updated_at
        `)
        .eq(
            "student_id",
            normalizedStudentId
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `Unable to check student record: ${error.message}`
        );
    }

    return data || null;
};


// ============================================================
// FIND LATE APPLICATION
// ============================================================

const findLateApplication =
    async (id) => {
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
            .in(
                "registration_type",
                LATE_REGISTRATION_TYPES
            )
            .maybeSingle();

        if (error) {
            throw new Error(
                `Unable to load late enrollee application: ${error.message}`
            );
        }

        return data || null;
    };


// ============================================================
// FIND IDENTITY VERIFICATION
// ============================================================

const findIdentityVerification =
    async (registrationId) => {
        const {
            data,
            error,
        } = await supabase
            .from(
                "identity_verifications"
            )
            .select("*")
            .eq(
                "registration_id",
                registrationId
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
            throw new Error(
                `Unable to load identity verification: ${error.message}`
            );
        }

        return data || null;
    };


// ============================================================
// STORAGE HELPERS
// ============================================================

const isUrl = (value) => {
    const valueString =
        clean(value);

    return (
        valueString.startsWith(
            "http://"
        ) ||
        valueString.startsWith(
            "https://"
        )
    );
};


const normalizeStoragePath = (
    value,
    bucketName
) => {
    let path =
        clean(value);

    if (!path) {
        return "";
    }

    if (isUrl(path)) {
        return path;
    }

    path =
        path.replace(
            /^\/+/,
            ""
        );

    if (bucketName) {
        path =
            path.replace(
                new RegExp(
                    `^${bucketName}/`
                ),
                ""
            );
    }

    path =
        path.replace(
            new RegExp(
                `^${DOCUMENT_BUCKET}/`
            ),
            ""
        );

    path =
        path.replace(
            new RegExp(
                `^${SELFIE_BUCKET}/`
            ),
            ""
        );

    path =
        path.replace(
            new RegExp(
                `^${LEGACY_DOCUMENT_BUCKET}/`
            ),
            ""
        );

    path =
        path.replace(
            /^storage\/v1\/object\/public\/[^/]+\//,
            ""
        );

    path =
        path.replace(
            /^storage\/v1\/object\/sign\/[^/]+\//,
            ""
        );

    return path;
};


const createSignedUrl = async (
    bucket,
    storagePath
) => {
    const original =
        clean(storagePath);

    if (!original) {
        return "";
    }

    if (isUrl(original)) {
        return original;
    }

    const normalizedPath =
        normalizeStoragePath(
            original,
            bucket
        );

    if (!normalizedPath) {
        return "";
    }

    const {
        data,
        error,
    } =
        await supabase.storage
            .from(bucket)
            .createSignedUrl(
                normalizedPath,
                SIGNED_URL_EXPIRATION
            );

    if (
        !error &&
        data?.signedUrl
    ) {
        return data.signedUrl;
    }

    return "";
};


// ============================================================
// CREATE DOCUMENT SIGNED URL
// ============================================================

const createDocumentSignedUrl =
    async (document) => {
        if (!document) {
            return "";
        }

        const possibleValues = [
            document.storage_path,
            document.storagePath,
            document.file_path,
            document.filePath,
            document.file_url,
            document.fileUrl,
            document.url,
            document.public_url,
            document.publicUrl,
        ];

        for (
            const value of possibleValues
        ) {
            const path =
                clean(value);

            if (!path) {
                continue;
            }

            if (isUrl(path)) {
                return path;
            }

            const currentBucketUrl =
                await createSignedUrl(
                    DOCUMENT_BUCKET,
                    path
                );

            if (currentBucketUrl) {
                return currentBucketUrl;
            }

            const legacyBucketUrl =
                await createSignedUrl(
                    LEGACY_DOCUMENT_BUCKET,
                    path
                );

            if (legacyBucketUrl) {
                return legacyBucketUrl;
            }
        }

        return "";
    };


// ============================================================
// SELFIE HELPERS
// ============================================================

const findStoredSelfieValue = (
    identityVerification
) => {
    if (!identityVerification) {
        return "";
    }

    const fields = [
        "selfie_url",
        "selfieUrl",
        "selfie_signed_url",
        "selfieSignedUrl",
        "selfie_path",
        "selfiePath",
        "selfie_storage_path",
        "selfieStoragePath",
        "selfie_file_path",
        "selfieFilePath",
        "file_url",
        "fileUrl",
        "storage_path",
        "storagePath",
        "file_path",
        "filePath",
    ];

    for (
        const field of fields
    ) {
        const value =
            clean(
                identityVerification[field]
            );

        if (value) {
            return value;
        }
    }

    return "";
};


const createSelfieUrlFromPath =
    async (storagePath) => {
        const value =
            clean(storagePath);

        if (!value) {
            return "";
        }

        if (isUrl(value)) {
            return value;
        }

        const currentBucketUrl =
            await createSignedUrl(
                SELFIE_BUCKET,
                value
            );

        if (currentBucketUrl) {
            return currentBucketUrl;
        }

        const legacyBucketUrl =
            await createSignedUrl(
                LEGACY_DOCUMENT_BUCKET,
                value
            );

        if (legacyBucketUrl) {
            return legacyBucketUrl;
        }

        return "";
    };


const findSelfieFromDocuments =
    async (registrationId) => {
        const {
            data,
            error,
        } =
            await supabase
                .from(
                    "registration_documents"
                )
                .select("*")
                .eq(
                    "registration_id",
                    registrationId
                )
                .eq(
                    "document_type",
                    "selfie"
                )
                .order(
                    "uploaded_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();

        if (error) {
            console.warn(
                "Selfie document lookup warning:",
                error.message
            );

            return "";
        }

        if (!data) {
            return "";
        }

        return await createSelfieUrlFromPath(
            data.storage_path ||
            data.storagePath ||
            data.file_path ||
            data.filePath ||
            data.file_url ||
            data.fileUrl ||
            data.url
        );
    };


const findSelfieFromStorage =
    async (registrationId) => {
        if (!registrationId) {
            return "";
        }

        const folder =
            `registrations/${registrationId}`;

        const {
            data: files,
            error,
        } =
            await supabase.storage
                .from(
                    SELFIE_BUCKET
                )
                .list(
                    folder,
                    {
                        limit: 100,
                        offset: 0,
                        sortBy: {
                            column: "created_at",
                            order: "desc",
                        },
                    }
                );

        if (error) {
            console.warn(
                "Unable to list selfie storage:",
                error.message
            );

            return "";
        }

        if (
            !files ||
            files.length === 0
        ) {
            return "";
        }

        const selfieFile =
            files.find(
                (file) => {
                    const name =
                        clean(
                            file.name
                        ).toLowerCase();

                    return (
                        name.includes("selfie") ||
                        name === "selfie.jpg" ||
                        name === "selfie.jpeg" ||
                        name === "selfie.png" ||
                        name === "selfie.webp"
                    );
                }
            );

        if (!selfieFile) {
            return "";
        }

        return await createSelfieUrlFromPath(
            `${folder}/${selfieFile.name}`
        );
    };


const getSelfieUrl =
    async (
        identityVerification,
        registrationId
    ) => {
        const identityValue =
            findStoredSelfieValue(
                identityVerification
            );

        if (identityValue) {
            const url =
                await createSelfieUrlFromPath(
                    identityValue
                );

            if (url) {
                return url;
            }
        }

        const documentUrl =
            await findSelfieFromDocuments(
                registrationId
            );

        if (documentUrl) {
            return documentUrl;
        }

        const storageUrl =
            await findSelfieFromStorage(
                registrationId
            );

        if (storageUrl) {
            return storageUrl;
        }

        return "";
    };


// ============================================================
// ENSURE IDENTITY VERIFICATION
// ============================================================
//
// This fixes the situation where the selfie exists in
// registration_documents/storage but the corresponding
// identity_verifications row was not created.
//
// ============================================================

const ensureIdentityVerification =
    async (
        registrationId,
        studentUuid,
        registrationSource
    ) => {
        let identityVerification =
            await findIdentityVerification(
                registrationId
            );

        if (identityVerification) {
            if (
                studentUuid &&
                !identityVerification.student_id
            ) {
                const {
                    data: updatedIdentity,
                    error: updateIdentityError,
                } =
                    await supabase
                        .from(
                            "identity_verifications"
                        )
                        .update({
                            student_id:
                                studentUuid,
                        })
                        .eq(
                            "id",
                            identityVerification.id
                        )
                        .select("*")
                        .single();

                if (updateIdentityError) {
                    throw new Error(
                        `Unable to update identity verification: ${updateIdentityError.message}`
                    );
                }

                identityVerification =
                    updatedIdentity;
            }

            return identityVerification;
        }

        // ----------------------------------------------------
        // FIRST: FIND SELFIE IN REGISTRATION DOCUMENTS
        // ----------------------------------------------------

        const {
            data: selfieDocument,
            error: selfieDocumentError,
        } =
            await supabase
                .from(
                    "registration_documents"
                )
                .select(`
                    id,
                    registration_id,
                    student_id,
                    document_type,
                    storage_path
                `)
                .eq(
                    "registration_id",
                    registrationId
                )
                .eq(
                    "document_type",
                    "selfie"
                )
                .order(
                    "uploaded_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();

        if (selfieDocumentError) {
            console.warn(
                "Unable to find selfie document while repairing identity verification:",
                selfieDocumentError.message
            );
        }

        let selfieStoragePath =
            clean(
                selfieDocument?.storage_path
            );

        // ----------------------------------------------------
        // SECOND: STORAGE FALLBACK
        // ----------------------------------------------------

        if (!selfieStoragePath) {
            const folder =
                `registrations/${registrationId}`;

            const {
                data: files,
                error: storageError,
            } =
                await supabase.storage
                    .from(
                        SELFIE_BUCKET
                    )
                    .list(
                        folder,
                        {
                            limit: 100,
                            offset: 0,
                            sortBy: {
                                column:
                                    "created_at",
                                order:
                                    "desc",
                            },
                        }
                    );

            if (!storageError) {
                const selfieFile =
                    files?.find(
                        (file) => {
                            const name =
                                clean(
                                    file.name
                                ).toLowerCase();

                            return (
                                name.includes(
                                    "selfie"
                                ) ||
                                name ===
                                    "selfie.jpg" ||
                                name ===
                                    "selfie.jpeg" ||
                                name ===
                                    "selfie.png" ||
                                name ===
                                    "selfie.webp"
                            );
                        }
                    );

                if (selfieFile) {
                    selfieStoragePath =
                        `${folder}/${selfieFile.name}`;
                }
            }
        }

        // ----------------------------------------------------
        // NO SELFIE FOUND
        // ----------------------------------------------------

        if (!selfieStoragePath) {
            return null;
        }

        const verificationMethod =
            registrationSource ===
            "kiosk"
                ? "kiosk"
                : "online";

        // ----------------------------------------------------
        // CREATE MISSING IDENTITY VERIFICATION
        // ----------------------------------------------------

        const {
            data: createdIdentity,
            error: createIdentityError,
        } =
            await supabase
                .from(
                    "identity_verifications"
                )
                .insert({
                    registration_id:
                        registrationId,

                    student_id:
                        studentUuid ||
                        null,

                    selfie_storage_path:
                        selfieStoragePath,

                    verification_method:
                        verificationMethod,

                    verification_status:
                        "pending",
                })
                .select("*")
                .single();

        if (createIdentityError) {
            throw new Error(
                `Unable to create missing identity verification record: ${createIdentityError.message}`
            );
        }

        return createdIdentity;
    };


// ============================================================
// ENRICH APPLICATION
// ============================================================

const enrichApplication =
    async (application) => {
        let student = null;
        let identityVerification = null;

        try {
            student =
                await findStudent(
                    application.student_id
                );
        } catch (error) {
            console.error(
                "Student lookup warning:",
                error.message
            );
        }

        try {
            identityVerification =
                await findIdentityVerification(
                    application.id
                );
        } catch (error) {
            console.error(
                "Identity verification warning:",
                error.message
            );
        }

        return {
            ...application,

            student:
                student
                    ? {
                        id:
                            student.id,

                        student_id:
                            student.student_id,

                        full_name:
                            student.full_name,

                        year_level:
                            student.year_level,

                        enrollment_status:
                            student.enrollment_status,
                    }
                    : null,

            enrollment_status:
                student?.enrollment_status ||
                "Not verified",

            student_verified:
                identityVerification
                    ?.verification_status ===
                "verified",

            verification_status:
                identityVerification
                    ?.verification_status ||
                "not_verified",

            identity_verification:
                identityVerification ||
                null,
        };
};


// ============================================================
// GET LATE ENROLLEE APPLICATIONS
// ============================================================

const getLateEnrolleeApplications =
    async (
        req,
        res
    ) => {
        try {
            await authenticateEB(req);

            const {
                status,
                search,
            } = req.query;

            let query =
                supabase
                    .from(
                        "registration_applications"
                    )
                    .select(`
                        id,
                        student_id,
                        registration_type,
                        application_status,
                        email,
                        registration_source,
                        full_name,
                        year_level,
                        otp_verified_at,
                        submitted_at,
                        reviewed_at,
                        reviewed_by,
                        rejection_reason,
                        correction_message,
                        created_at,
                        updated_at
                    `)
                    .in(
                        "registration_type",
                        LATE_REGISTRATION_TYPES
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                false,
                        }
                    );

            if (
                status &&
                status !== "all"
            ) {
                query =
                    query.eq(
                        "application_status",
                        status
                    );
            }

            if (
                search &&
                clean(search)
            ) {
                const value =
                    clean(search);

                query =
                    query.or(
                        `full_name.ilike.%${value}%,student_id.ilike.%${value}%,email.ilike.%${value}%,year_level.ilike.%${value}%`
                    );
            }

            const {
                data,
                error,
            } =
                await query;

            if (error) {
                return res
                    .status(500)
                    .json({
                        success:
                            false,

                        message:
                            "Unable to load late enrollee applications.",

                        error:
                            error.message,
                    });
            }

            const applications =
                await Promise.all(
                    (
                        data ||
                        []
                    ).map(
                        enrichApplication
                    )
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    count:
                        applications.length,

                    applications,

                    data:
                        applications,
                });

        } catch (error) {
            console.error(
                "❌ Late enrollee applications error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message,
                });
        }
    };


// ============================================================
// GET DOCUMENTS + SELFIE
// ============================================================

const getLateEnrolleeDocuments =
    async (
        req,
        res
    ) => {
        try {
            await authenticateEB(req);

            const {
                id,
            } = req.params;

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            const {
                data: documents,
                error: documentsError,
            } =
                await supabase
                    .from(
                        "registration_documents"
                    )
                    .select("*")
                    .eq(
                        "registration_id",
                        id
                    )
                    .order(
                        "uploaded_at",
                        {
                            ascending:
                                true,
                        }
                    );

            if (documentsError) {
                return res
                    .status(500)
                    .json({
                        success:
                            false,

                        message:
                            "Unable to load submitted documents.",

                        error:
                            documentsError.message,
                    });
            }

            const documentsWithSignedUrls =
                await Promise.all(
                    (
                        documents ||
                        []
                    ).map(
                        async (
                            document
                        ) => {
                            const signedUrl =
                                await createDocumentSignedUrl(
                                    document
                                );

                            return {
                                ...document,

                                signed_url:
                                    signedUrl,

                                signedUrl:
                                    signedUrl,

                                document_url:
                                    signedUrl,
                            };
                        }
                    )
                );

            const identityVerification =
                await findIdentityVerification(
                    id
                );

            const selfieUrl =
                await getSelfieUrl(
                    identityVerification,
                    id
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    documents:
                        documentsWithSignedUrls,

                    registration_documents:
                        documentsWithSignedUrls,

                    data:
                        documentsWithSignedUrls,

                    identity_verification:
                        identityVerification ||
                        null,

                    selfie_url:
                        selfieUrl,

                    selfie_signed_url:
                        selfieUrl,
                });

        } catch (error) {
            console.error(
                "❌ Late enrollee documents error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message,
                });
        }
    };


// ============================================================
// VERIFY ENROLLMENT
// ============================================================

const verifyEnrollment =
    async (
        req,
        res
    ) => {
        try {
            await authenticateEB(req);

            const {
                id,
            } = req.params;

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            const student =
                await findStudent(
                    application.student_id
                );

            if (!student) {
                return res
                    .status(200)
                    .json({
                        success:
                            true,

                        verified:
                            false,

                        message:
                            "This is a late enrollee. The student will be added to the official student roster after EB approval.",
                    });
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    verified:
                        String(
                            student.enrollment_status ||
                            ""
                        ).toUpperCase() ===
                        "ACTIVE",

                    student,
                });

        } catch (error) {
            console.error(
                "❌ Verify enrollment error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        error.message ||
                        "Unable to verify enrollment.",
                });
        }
    };


// ============================================================
// VERIFY STUDENT IDENTITY
// ============================================================

const verifyStudent =
    async (
        req,
        res
    ) => {
        try {
            const eb =
                await authenticateEB(req);

            const {
                id,
            } = req.params;

            let identityVerification =
                await findIdentityVerification(
                    id
                );

            // If the verification record is missing,
            // attempt to recreate it from the submitted selfie.
            if (!identityVerification) {
                identityVerification =
                    await ensureIdentityVerification(
                        id,
                        null,
                        "online"
                    );
            }

            if (!identityVerification) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Identity verification record not found and no submitted selfie could be recovered.",
                    });
            }

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "identity_verifications"
                    )
                    .update({
                        verification_status:
                            "verified",

                        verified_by:
                            eb.id,

                        verified_at:
                            new Date().toISOString(),
                    })
                    .eq(
                        "id",
                        identityVerification.id
                    )
                    .select("*")
                    .single();

            if (error) {
                throw new Error(
                    `Unable to verify student identity: ${error.message}`
                );
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Student identity verified successfully.",

                    data,
                });

        } catch (error) {
            console.error(
                "❌ Verify student error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        error.message ||
                        "Unable to verify student.",
                });
        }
    };


// ============================================================
// GENERATE RANDOM PASSWORD
// ============================================================

const generateRandomPassword =
    (length) => {
        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

        let password = "";

        while (
            password.length <
            length
        ) {
            password +=
                characters[
                    crypto.randomInt(
                        0,
                        characters.length
                    )
                ];
        }

        return password;
    };


// ============================================================
// APPROVE LATE ENROLLEE
// ============================================================

const approveLateEnrollee =
    async (
        req,
        res
    ) => {
        try {
            const eb =
                await authenticateEB(req);

            const {
                id,
            } = req.params;

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            const currentStatus =
                clean(
                    application.application_status
                ).toLowerCase();

            if (
                currentStatus ===
                "approved"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "This late enrollee application has already been approved.",
                    });
            }

            if (
                currentStatus ===
                "rejected"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "A rejected application cannot be approved directly.",
                    });
            }

            const yearLevel =
                normalizeYearLevel(
                    application.year_level
                );

            if (
                !ALLOWED_YEAR_LEVELS.includes(
                    yearLevel
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee registration is only available for 2nd Year, 3rd Year, and 4th Year.",
                    });
            }

            const studentId =
                clean(
                    application.student_id
                );

            const fullName =
                clean(
                    application.full_name
                );

            const email =
                clean(
                    application.email
                ).toLowerCase();

            const registrationSource =
                getRegistrationSource(
                    application
                );

            const isKioskRegistration =
                registrationSource ===
                "kiosk";

            const isEmailRegistration =
                registrationSource ===
                "online";

            if (!studentId) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Student ID is missing from the late enrollee application.",
                    });
            }

            if (!fullName) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Full name is missing from the late enrollee application.",
                    });
            }

            if (
                isEmailRegistration &&
                !isValidEmail(email)
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "A valid email address is required for online late-enrollee approval.",
                    });
            }

            // ------------------------------------------------
            // FIND STUDENT FIRST
            // ------------------------------------------------

            let student =
                await findStudent(
                    studentId
                );

            // ------------------------------------------------
            // CREATE STUDENT IF NEEDED
            // ------------------------------------------------

            if (!student) {
                const now =
                    new Date().toISOString();

                const {
                    data:
                        createdStudent,
                    error:
                        createStudentError,
                } =
                    await supabase
                        .from(
                            "students"
                        )
                        .insert({
                            student_id:
                                studentId,

                            full_name:
                                fullName,

                            year_level:
                                yearLevel,

                            enrollment_status:
                                "ACTIVE",

                            created_at:
                                now,

                            updated_at:
                                now,
                        })
                        .select(`
                            id,
                            student_id,
                            full_name,
                            year_level,
                            enrollment_status,
                            created_at,
                            updated_at
                        `)
                        .single();

                if (
                    createStudentError
                ) {
                    if (
                        createStudentError.code ===
                        "23505"
                    ) {
                        student =
                            await findStudent(
                                studentId
                            );

                        if (!student) {
                            throw new Error(
                                `Unable to create late enrollee student record: ${createStudentError.message}`
                            );
                        }
                    } else {
                        throw new Error(
                            `Unable to create late enrollee student record: ${createStudentError.message}`
                        );
                    }
                } else {
                    student =
                        createdStudent;
                }
            }

            if (!student) {
                throw new Error(
                    "Student record could not be created or retrieved."
                );
            }

            if (
                clean(
                    student.student_id
                ) !==
                studentId
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Student ID verification failed.",
                    });
            }

            // ------------------------------------------------
            // ENSURE IDENTITY VERIFICATION
            // ------------------------------------------------
            //
            // This is the important fix.
            //
            // If identity_verifications is missing but the
            // selfie was submitted through registration_documents
            // or stored in Supabase Storage, the controller
            // recreates the missing verification record.
            // ------------------------------------------------

            let identityVerification =
                await ensureIdentityVerification(
                    id,
                    student.id,
                    registrationSource
                );

            if (!identityVerification) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "The registration selfie could not be found. Please verify that the student submitted a selfie during registration.",
                    });
            }

            // ------------------------------------------------
            // FINALIZE IDENTITY VERIFICATION
            // ------------------------------------------------

            if (
                identityVerification.verification_status !==
                "verified"
            ) {
                const {
                    data:
                        verifiedIdentity,
                    error:
                        verifyError,
                } =
                    await supabase
                        .from(
                            "identity_verifications"
                        )
                        .update({
                            student_id:
                                student.id,

                            verification_status:
                                "verified",

                            verified_by:
                                eb.id,

                            verified_at:
                                new Date().toISOString(),
                        })
                        .eq(
                            "id",
                            identityVerification.id
                        )
                        .select("*")
                        .single();

                if (verifyError) {
                    throw new Error(
                        `Unable to finalize identity verification: ${verifyError.message}`
                    );
                }

                identityVerification =
                    verifiedIdentity;
            } else if (
                !identityVerification.student_id
            ) {
                const {
                    data:
                        updatedIdentity,
                    error:
                        updateIdentityError,
                } =
                    await supabase
                        .from(
                            "identity_verifications"
                        )
                        .update({
                            student_id:
                                student.id,
                        })
                        .eq(
                            "id",
                            identityVerification.id
                        )
                        .select("*")
                        .single();

                if (updateIdentityError) {
                    throw new Error(
                        `Unable to associate identity verification with student: ${updateIdentityError.message}`
                    );
                }

                identityVerification =
                    updatedIdentity;
            }

            // ------------------------------------------------
            // PASSWORD
            // ------------------------------------------------

            const temporaryPassword =
                generateRandomPassword(
                    isKioskRegistration
                        ? 32
                        : 12
                );

            const passwordHash =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            // ------------------------------------------------
            // FIND EXISTING ACCOUNT
            // ------------------------------------------------

            const {
                data:
                    existingAccount,
                error:
                    accountLookupError,
            } =
                await supabase
                    .from(
                        "student_accounts"
                    )
                    .select(`
                        id,
                        student_id,
                        registration_id,
                        email,
                        must_change_password,
                        account_status,
                        profile_photo_storage_path
                    `)
                    .eq(
                        "student_id",
                        studentId
                    )
                    .maybeSingle();

            if (
                accountLookupError
            ) {
                throw new Error(
                    `Unable to check student account: ${accountLookupError.message}`
                );
            }

            let account;

            const accountEmail =
                isKioskRegistration
                    ? null
                    : email;

            // ------------------------------------------------
            // CREATE ACCOUNT
            // ------------------------------------------------

            if (!existingAccount) {
                const now =
                    new Date().toISOString();

                const {
                    data:
                        createdAccount,
                    error:
                        createAccountError,
                } =
                    await supabase
                        .from(
                            "student_accounts"
                        )
                        .insert({
                            student_id:
                                studentId,

                            registration_id:
                                id,

                            email:
                                accountEmail,

                            password_hash:
                                passwordHash,

                            must_change_password:
                                true,

                            account_status:
                                "active",

                            created_at:
                                now,

                            updated_at:
                                now,
                        })
                        .select(`
                            id,
                            student_id,
                            registration_id,
                            email,
                            must_change_password,
                            account_status,
                            profile_photo_storage_path,
                            created_at,
                            updated_at
                        `)
                        .single();

                if (
                    createAccountError
                ) {
                    throw new Error(
                        `Unable to create student account: ${createAccountError.message}`
                    );
                }

                account =
                    createdAccount;

            } else {
                const {
                    data:
                        updatedAccount,
                    error:
                        updateAccountError,
                } =
                    await supabase
                        .from(
                            "student_accounts"
                        )
                        .update({
                            registration_id:
                                id,

                            email:
                                accountEmail,

                            password_hash:
                                passwordHash,

                            must_change_password:
                                true,

                            account_status:
                                "active",

                            updated_at:
                                new Date().toISOString(),
                        })
                        .eq(
                            "id",
                            existingAccount.id
                        )
                        .select(`
                            id,
                            student_id,
                            registration_id,
                            email,
                            must_change_password,
                            account_status,
                            profile_photo_storage_path,
                            created_at,
                            updated_at
                        `)
                        .single();

                if (
                    updateAccountError
                ) {
                    throw new Error(
                        `Unable to activate student account: ${updateAccountError.message}`
                    );
                }

                account =
                    updatedAccount;
            }

            // ------------------------------------------------
            // UPDATE APPLICATION
            // ------------------------------------------------

            const now =
                new Date().toISOString();

            const {
                data:
                    updatedApplication,
                error:
                    applicationUpdateError,
            } =
                await supabase
                    .from(
                        "registration_applications"
                    )
                    .update({
                        application_status:
                            "approved",

                        reviewed_at:
                            now,

                        reviewed_by:
                            eb.id,

                        rejection_reason:
                            null,

                        correction_message:
                            null,

                        updated_at:
                            now,
                    })
                    .eq(
                        "id",
                        id
                    )
                    .select(`
                        id,
                        student_id,
                        registration_type,
                        application_status,
                        email,
                        registration_source,
                        full_name,
                        year_level,
                        otp_verified_at,
                        submitted_at,
                        reviewed_at,
                        reviewed_by,
                        rejection_reason,
                        correction_message,
                        created_at,
                        updated_at
                    `)
                    .single();

            if (
                applicationUpdateError
            ) {
                throw new Error(
                    `Unable to approve late enrollee application: ${applicationUpdateError.message}`
                );
            }

            // ------------------------------------------------
            // SEND APPROVAL EMAIL
            // ------------------------------------------------

            let emailSent = false;

            if (
                isEmailRegistration
            ) {
                try {
                    const emailResult =
                        await sendRegistrationApprovalEmail(
                            email,
                            studentId,
                            fullName,
                            yearLevel,
                            temporaryPassword
                        );

                    if (
                        emailResult &&
                        emailResult.success ===
                            false
                    ) {
                        throw new Error(
                            emailResult.message ||
                            "Approval email could not be sent."
                        );
                    }

                    emailSent = true;

                } catch (emailError) {
                    console.error(
                        "❌ Approval email failed:",
                        emailError
                    );

                    return res
                        .status(502)
                        .json({
                            success:
                                false,

                            message:
                                "The late enrollee account was created, but the approval email could not be sent. Please check the email service before allowing the student to log in.",

                            accountCreated:
                                true,

                            accountActivated:
                                true,

                            emailSent:
                                false,

                            studentId,
                        });
                }

            } else {
                console.log(
                    "ℹ️ Kiosk late enrollee approved without email."
                );

                console.log(
                    "ℹ️ Student activation continues on kiosk."
                );

                console.log(
                    "ℹ️ Student will create personal 8-character password."
                );
            }

            // ------------------------------------------------
            // CREATE NOTIFICATION
            // ------------------------------------------------

            const notificationMessage =
                isKioskRegistration
                    ? "Your VOTARA late enrollee registration has been approved. Account activation will continue on the kiosk device, where you will create your personal 8-character password and complete your profile."
                    : "Your VOTARA late enrollee registration has been approved. A temporary password was sent to your registered email address. You must change your password and complete your profile photo before accessing your dashboard.";

            const {
                error:
                    notificationError,
            } =
                await supabase
                    .from(
                        "notifications"
                    )
                    .insert({
                        student_id:
                            studentId,

                        registration_id:
                            id,

                        notification_type:
                            "registration_approved",

                        title:
                            "VOTARA Registration Approved",

                        message:
                            notificationMessage,

                        is_read:
                            false,

                        sent_at:
                            now,

                        created_at:
                            now,
                    });

            if (
                notificationError
            ) {
                console.warn(
                    "⚠️ Notification creation warning:",
                    notificationError.message
                );
            }

            // ------------------------------------------------
            // FINAL RESULT
            // ------------------------------------------------

            const result = {
                ...updatedApplication,

                student,

                account,

                enrollment_status:
                    student.enrollment_status ||
                    "ACTIVE",

                student_verified:
                    true,

                verification_status:
                    "verified",
            };

            console.log(
                "=============================================="
            );

            console.log(
                "✅ LATE ENROLLEE APPROVED"
            );

            console.log(
                "Student ID:",
                studentId
            );

            console.log(
                "Student:",
                fullName
            );

            console.log(
                "Year Level:",
                yearLevel
            );

            console.log(
                "Registration source:",
                registrationSource
            );

            console.log(
                "Email:",
                isKioskRegistration
                    ? "Not provided / not required"
                    : email
            );

            console.log(
                "Student account:",
                "Active"
            );

            console.log(
                "Must change password:",
                true
            );

            console.log(
                "Approval email:",
                isKioskRegistration
                    ? "Not sent - kiosk activation"
                    : emailSent
                        ? "Sent"
                        : "Not sent"
            );

            console.log(
                "=============================================="
            );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        isKioskRegistration
                            ? "Late enrollee approved successfully. The student account is active without requiring an email address. Account activation will continue through the kiosk device, where the student creates their personal 8-character password."
                            : "Late enrollee approved successfully. The student account is active and the temporary password was sent to the registered email address. The student must change the password and complete the profile photo before accessing the dashboard.",

                    status:
                        "approved",

                    application:
                        result,

                    data:
                        result,

                    registrationSource:
                        registrationSource,

                    emailSent:
                        emailSent,

                    accountCreated:
                        !existingAccount,

                    accountActivated:
                        true,

                    activationRequired:
                        isKioskRegistration,
                });

        } catch (error) {
            console.error(
                "❌ Approve late enrollee error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message ||
                              "Unable to approve late enrollee.",
                });
        }
    };


// ============================================================
// REJECT LATE ENROLLEE
// ============================================================

const rejectLateEnrollee =
    async (
        req,
        res
    ) => {
        try {
            const eb =
                await authenticateEB(req);

            const {
                id,
            } = req.params;

            const reason =
                clean(
                    req.body?.reason ||
                    req.body?.remarks ||
                    req.body?.rejection_reason
                );

            if (!reason) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "A rejection reason is required.",
                    });
            }

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            if (
                application.application_status ===
                "approved"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "An approved application cannot be rejected.",
                    });
            }

            const now =
                new Date().toISOString();

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "registration_applications"
                    )
                    .update({
                        application_status:
                            "rejected",

                        rejection_reason:
                            reason,

                        correction_message:
                            null,

                        reviewed_at:
                            now,

                        reviewed_by:
                            eb.id,

                        updated_at:
                            now,
                    })
                    .eq(
                        "id",
                        id
                    )
                    .select("*")
                    .single();

            if (error) {
                throw new Error(
                    `Unable to reject application: ${error.message}`
                );
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Late enrollee application rejected successfully.",

                    data,
                });

        } catch (error) {
            console.error(
                "❌ Reject late enrollee error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message,
                });
        }
    };


// ============================================================
// CORRECTION
// ============================================================

const requestCorrection =
    async (
        req,
        res
    ) => {
        try {
            const eb =
                await authenticateEB(req);

            const {
                id,
            } = req.params;

            const reason =
                clean(
                    req.body?.reason ||
                    req.body?.remarks ||
                    req.body?.correction_message
                );

            if (!reason) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "A correction reason is required.",
                    });
            }

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            if (
                application.application_status ===
                "approved"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "An approved application cannot be sent for correction.",
                    });
            }

            const now =
                new Date().toISOString();

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "registration_applications"
                    )
                    .update({
                        application_status:
                            "needs_correction",

                        correction_message:
                            reason,

                        rejection_reason:
                            null,

                        reviewed_at:
                            now,

                        reviewed_by:
                            eb.id,

                        updated_at:
                            now,
                    })
                    .eq(
                        "id",
                        id
                    )
                    .select("*")
                    .single();

            if (error) {
                throw new Error(
                    `Unable to request correction: ${error.message}`
                );
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Correction request sent successfully.",

                    data,
                });

        } catch (error) {
            console.error(
                "❌ Correction request error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message,
                });
        }
    };


// ============================================================
// LEGACY NOTIFY STUDENT
// ============================================================

const notifyStudent =
    async (
        req,
        res
    ) => {
        try {
            await authenticateEB(req);

            const {
                id,
            } = req.params;

            const application =
                await findLateApplication(id);

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Late enrollee application not found.",
                    });
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "The application notification is handled through the VOTARA approval workflow.",

                    notified:
                        false,
                });

        } catch (error) {
            console.error(
                "❌ Notify student error:",
                error
            );

            return res
                .status(
                    error.name ===
                    "TokenExpiredError"
                        ? 401
                        : 500
                )
                .json({
                    success:
                        false,

                    message:
                        error.name ===
                        "TokenExpiredError"
                            ? "jwt expired"
                            : error.message,
                });
        }
    };


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getLateEnrolleeApplications,
    getLateEnrolleeDocuments,
    verifyEnrollment,
    approveLateEnrollee,
    rejectLateEnrollee,
    requestCorrection,
    verifyStudent,
    notifyStudent,
};