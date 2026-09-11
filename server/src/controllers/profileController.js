const Student = require("../models/Student");

// =====================================================
// GET STUDENT PROFILE
// =====================================================

const getStudentProfile = async (req, res) => {
    try {
        const studentId = req.student.studentId;

        const student = await Student.findOne({
            studentId,
        }).select("-passwordHash -otpHash");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        return res.status(200).json({
            success: true,
            student: {
                studentId: student.studentId,
                fullName: student.fullName,
                yearLevel: student.yearLevel,

                firstName: student.firstName || "",
                middleName: student.middleName || "",
                lastName: student.lastName || "",

                birthday: student.birthday || "",
                contactNumber: student.contactNumber || "",
                email: student.email || "",

                province: student.province || "",
                barangay: student.barangay || "",
                city: student.city || "",

                profilePicture:
                    student.profilePicture || null,
            },
        });

    } catch (error) {

        console.error(
            "❌ Get profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load profile.",
        });
    }
};


// =====================================================
// UPDATE STUDENT PROFILE
// =====================================================

const updateStudentProfile = async (req, res) => {
    try {
        const studentId = req.student.studentId;

        const {
            firstName,
            middleName,
            lastName,
            birthday,
            contactNumber,
            email,
            province,
            barangay,
            city,
        } = req.body;

        const student = await Student.findOne({
            studentId,
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        // ==========================================
        // UPDATE PROFILE INFORMATION
        // ==========================================

        student.firstName =
            firstName !== undefined
                ? firstName.trim()
                : student.firstName;

        student.middleName =
            middleName !== undefined
                ? middleName.trim()
                : student.middleName;

        student.lastName =
            lastName !== undefined
                ? lastName.trim()
                : student.lastName;

        student.birthday =
            birthday !== undefined
                ? birthday.trim()
                : student.birthday;

        student.contactNumber =
            contactNumber !== undefined
                ? contactNumber.trim()
                : student.contactNumber;

        student.email =
            email !== undefined
                ? email.trim().toLowerCase()
                : student.email;

        student.province =
            province !== undefined
                ? province.trim()
                : student.province;

        student.barangay =
            barangay !== undefined
                ? barangay.trim()
                : student.barangay;

        student.city =
            city !== undefined
                ? city.trim()
                : student.city;


        // ==========================================
        // UPDATE FULL NAME
        // ==========================================

        const nameParts = [
            student.firstName,
            student.middleName,
            student.lastName,
        ].filter(
            (name) => name && name.trim() !== ""
        );

        if (nameParts.length > 0) {
            student.fullName =
                nameParts.join(" ").trim();
        }


        await student.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",

            student: {
                studentId: student.studentId,
                fullName: student.fullName,
                yearLevel: student.yearLevel,

                firstName: student.firstName || "",
                middleName: student.middleName || "",
                lastName: student.lastName || "",

                birthday: student.birthday || "",
                contactNumber:
                    student.contactNumber || "",

                email: student.email || "",

                province:
                    student.province || "",

                barangay:
                    student.barangay || "",

                city:
                    student.city || "",

                profilePicture:
                    student.profilePicture || null,
            },
        });

    } catch (error) {

        console.error(
            "❌ Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update profile.",
        });
    }
};


module.exports = {
    getStudentProfile,
    updateStudentProfile,
};