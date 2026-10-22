const supabase = require("../config/supabase");

const isEnrollmentActive = value => ["active", "enrolled"].includes(String(value || "").trim().toLowerCase());

const getStudentInPersonVerification = async (studentId) => {
    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, student_id, full_name, year_level, enrollment_status")
        .eq("id", studentId)
        .maybeSingle();
    if (studentError) throw studentError;
    if (!student) return { student: null };

    const { data: applications, error: applicationError } = await supabase
        .from("registration_applications")
        .select("id, student_id, registration_type, application_status, submitted_at, created_at")
        .eq("student_id", student.student_id)
        .order("created_at", { ascending: false });
    if (applicationError) throw applicationError;
    const application = (applications || []).find(row =>
        !["late", "late_enrollee"].includes(String(row.registration_type || "").toLowerCase())
    ) || null;

    let identityVerification = null;
    if (application) {
        const { data, error } = await supabase
            .from("identity_verifications")
            .select("id, registration_id, student_id, verification_method, verification_status, verified_by, verified_at, created_at")
            .eq("registration_id", application.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        identityVerification = data;
    }

    return { student, application, identityVerification };
};

const getInPersonVerificationStudents = async (req, res) => {
    try {
        const rawSearch = String(req.query.search || "").trim();
        const numericSearch = /^[\d\s-]+$/.test(rawSearch) && /\d/.test(rawSearch);
        const studentIdSearch = rawSearch.replace(/\D/g, "");
        if (numericSearch && studentIdSearch.length !== 5) {
            return res.status(400).json({ success: false, message: "Student IDs must contain exactly 5 digits." });
        }
        const search = (numericSearch ? studentIdSearch : rawSearch.replace(/[%,_(),]/g, "")).slice(0, 100);
        const limit = search ? 50 : 100;

        let studentsQuery = supabase
            .from("students")
            .select("id, student_id, full_name, year_level, enrollment_status")
            .order("full_name", { ascending: true })
            .limit(limit);

        if (search) {
            studentsQuery = studentsQuery.or(`student_id.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { data: students, error: studentError } = await studentsQuery;
        if (studentError) throw studentError;

        const { data: election, error: electionError } = await supabase
            .from("elections")
            .select("id, title, status, election_date")
            .eq("status", "open")
            .eq("is_published", true)
            .order("election_date", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (electionError) throw electionError;

        const studentIds = (students || []).map(row => row.id).filter(Boolean);
        const studentCodes = (students || []).map(row => row.student_id).filter(Boolean);
        const [participationResult, applicationResult] = await Promise.all([
            election && studentIds.length
                ? supabase.from("vote_participations").select("student_id, has_voted, voted_at").eq("election_id", election.id).in("student_id", studentIds)
                : Promise.resolve({ data: [], error: null }),
            studentCodes.length
                ? supabase.from("registration_applications").select("id, student_id, registration_type, application_status, submitted_at, created_at").in("student_id", studentCodes).order("created_at", { ascending: false })
                : Promise.resolve({ data: [], error: null }),
        ]);
        if (participationResult.error) throw participationResult.error;
        if (applicationResult.error) throw applicationResult.error;

        const participationByStudent = new Map((participationResult.data || []).map(row => [String(row.student_id), row]));
        const applicationsByStudent = new Map();
        for (const row of applicationResult.data || []) {
            if (["late", "late_enrollee"].includes(String(row.registration_type || "").toLowerCase())) continue;
            if (!applicationsByStudent.has(String(row.student_id))) applicationsByStudent.set(String(row.student_id), row);
        }
        const applicationIds = Array.from(applicationsByStudent.values()).map(row => row.id).filter(Boolean);
        const { data: identityRows, error: identityError } = applicationIds.length
            ? await supabase.from("identity_verifications")
                .select("id, registration_id, student_id, verification_method, verification_status, verified_by, verified_at, created_at")
                .in("registration_id", applicationIds)
                .order("created_at", { ascending: false })
            : { data: [], error: null };
        if (identityError) throw identityError;

        const identityByRegistration = new Map();
        for (const row of identityRows || []) {
            if (!identityByRegistration.has(String(row.registration_id))) identityByRegistration.set(String(row.registration_id), row);
        }

        return res.status(200).json({
            success: true,
            election: election ? { id: election.id, title: election.title, status: election.status } : null,
            students: (students || []).map(student => {
                const participation = participationByStudent.get(String(student.id));
                const application = applicationsByStudent.get(String(student.student_id));
                const identity = application ? identityByRegistration.get(String(application.id)) : null;
                const isVerified = identity?.verification_status === "verified";
                return {
                    ...student,
                    registration_status: application?.application_status || "not_submitted",
                    registration_id: application?.id || null,
                    verification_status: identity?.verification_status || "pending",
                    physical_id_verified: isVerified,
                    registration_confirmed: isVerified,
                    has_voted: election ? participation?.has_voted === true : null,
                    voted_at: election ? participation?.voted_at || null : null,
                    election_title: election?.title || null,
                };
            }),
        });
    } catch (error) {
        console.error("EB in-person verification lookup error:", error);
        return res.status(500).json({ success: false, message: "Unable to load student verification records." });
    }
};

const verifyStudentInPerson = async (req, res) => {
    try {
        if (req.body?.physical_id_verified !== true || req.body?.registration_confirmed !== true) {
            return res.status(400).json({ success: false, message: "Complete both physical ID and registration checks before verifying." });
        }
        const { student, application, identityVerification: existingIdentityVerification } = await getStudentInPersonVerification(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: "Student was not found." });
        if (!isEnrollmentActive(student.enrollment_status)) {
            return res.status(409).json({ success: false, message: "Only students with active enrollment can be verified." });
        }
        if (application?.application_status !== "approved") {
            return res.status(409).json({ success: false, message: "The student's registration must be approved before in-person verification." });
        }
        let identityVerification = existingIdentityVerification;
        // Some older approved registrations predate the online identity row. Create the
        // linked record only after the EB has completed the in-person checklist.
        if (!identityVerification) {
            const identityData = {
                registration_id: application.id,
                student_id: student.student_id,
                verification_method: "in_person",
                verification_status: "pending",
            };
            const { data, error } = await supabase.from("identity_verifications")
                .insert(identityData)
                .select("id, registration_id, student_id, verification_method, verification_status, verified_by, verified_at, created_at")
                .single();
            if (error) throw error;
            identityVerification = data;
        }
        if (identityVerification.verification_status === "verified") {
            return res.status(200).json({ success: true, verification_status: "verified", message: "This student is already verified." });
        }

        const { data, error } = await supabase.from("identity_verifications")
            .update({ verification_status: "verified", verification_method: "in_person", verified_by: req.user?.id || null, verified_at: new Date().toISOString() })
            .eq("id", identityVerification.id)
            .select("id, verification_status, verification_method, verified_at")
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, verification: data, message: "Student identity has been successfully verified." });
    } catch (error) {
        console.error("EB in-person student verification error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Unable to verify this student." });
    }
};

const activateVerifiedStudent = async (req, res) => {
    try {
        const { student, application, identityVerification } = await getStudentInPersonVerification(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: "Student was not found." });
        if (application?.application_status !== "approved" || identityVerification?.verification_status !== "verified") {
            return res.status(409).json({ success: false, message: "Approve the registration and complete in-person verification before activating the account." });
        }
        if (!isEnrollmentActive(student.enrollment_status)) {
            return res.status(409).json({ success: false, message: "Only actively enrolled students can activate an account." });
        }
        const yearLevel = String(student.year_level || "").trim().toLowerCase();
        if (yearLevel === "1" || /^(1st|first)\b/.test(yearLevel)) {
            return res.status(409).json({ success: false, message: "First-year students are not eligible for this account activation flow." });
        }

        const { data, error } = await supabase.from("student_accounts")
            .update({ account_status: "active" })
            .eq("student_id", student.student_id)
            .select("id, student_id, account_status")
            .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: "A student account was not found for this student." });
        return res.status(200).json({ success: true, account: data, message: "Student account has been activated." });
    } catch (error) {
        console.error("EB student account activation error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Unable to activate the student account." });
    }
};

module.exports = { getInPersonVerificationStudents, verifyStudentInPerson, activateVerifiedStudent };
