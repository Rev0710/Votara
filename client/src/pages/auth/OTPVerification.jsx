import { useEffect, useRef, useState } from "react";







import { Link, useNavigate } from "react-router-dom";







import votaraLogo from "../../assets/images/votara-logo.png";







import "./OTPVerification.css";















const OTP_LENGTH = 6;















const OTPVerification = () => {







  const navigate = useNavigate();















  // =====================================================







  // STATE







  // =====================================================















  const [otp, setOtp] = useState(







    Array(OTP_LENGTH).fill("")







  );















  const [email, setEmail] = useState("");







  const [studentId, setStudentId] = useState("");







  const [fullName, setFullName] = useState("");







  const [yearLevel, setYearLevel] = useState("");







  const [registrationType, setRegistrationType] =







    useState("normal");















  const [error, setError] = useState("");







  const [message, setMessage] = useState("");















  const [loading, setLoading] = useState(false);







  const [resending, setResending] = useState(false);















  const [countdown, setCountdown] = useState(30);

    const [showDisclaimer, setShowDisclaimer] = useState(false);















  const inputRefs = useRef([]);















  // =====================================================







  // LOAD REGISTRATION INFORMATION







  // =====================================================















  useEffect(() => {







    const savedStudentId =







      sessionStorage.getItem(







        "votara_student_id"







      );















    const savedEmail =







      sessionStorage.getItem(







        "votara_email"







      );















    const savedFullName =







      sessionStorage.getItem(







        "votara_full_name"







      );















    const savedYearLevel =







      sessionStorage.getItem(







        "votara_year_level"







      );















    const savedRegistrationType =







      sessionStorage.getItem(







        "votara_registration_type"







      );















    // -------------------------------------------------







    // REQUIRE BASIC REGISTRATION INFORMATION







    // -------------------------------------------------















    if (







      !savedStudentId ||







      !savedEmail







    ) {







      setError(







        "Registration information is missing. Please register again."







      );















      return;







    }















    setStudentId(savedStudentId);







    setEmail(savedEmail);







    setFullName(savedFullName || "");







    setYearLevel(savedYearLevel || "");















    setRegistrationType(







      savedRegistrationType ||







      "normal"







    );















  }, []);















  // =====================================================







  // COUNTDOWN







  // =====================================================















  useEffect(() => {







    if (countdown <= 0) {







      return;







    }















    const timer = setInterval(() => {







      setCountdown(







        (previous) =>







          previous - 1







      );







    }, 1000);















    return () => {







      clearInterval(timer);







    };















  }, [countdown]);















  // =====================================================







  // OTP INPUT







  // =====================================================















  const handleOtpChange = (







    index,







    value







  ) => {















    // Numbers only







    if (!/^\d$/.test(value)) {







    return;







  }















    const newOtp = [...otp];















    newOtp[index] =







      value.slice(-1);















    setOtp(newOtp);















    setError("");







    setMessage("");















    // Move to next box







    if (







      value &&







      index < OTP_LENGTH - 1







    ) {







      inputRefs.current[







        index + 1







      ]?.focus();







    }







  };















  // =====================================================







  // BACKSPACE







  // =====================================================















  const handleKeyDown = (







    index,







    e







  ) => {















    if (







      e.key === "Backspace" &&







      !otp[index] &&







      index > 0







    ) {







      inputRefs.current[







        index - 1







      ]?.focus();







    }







  };















  // =====================================================







  // PASTE OTP







  // =====================================================















  const handlePaste = (e) => {















    e.preventDefault();















    const pastedData =







      e.clipboardData







        .getData("text")







        .replace(/\D/g, "")







        .slice(







          0,







          OTP_LENGTH







        );















    if (!pastedData) {







      return;







    }















    const newOtp =







      Array(OTP_LENGTH).fill("");















    pastedData







      .split("")







      .forEach(







        (







          number,







          index







        ) => {







          newOtp[index] =







            number;







        }







      );















    setOtp(newOtp);















    setError("");







    setMessage("");















    const nextIndex =







      Math.min(







        pastedData.length,







        OTP_LENGTH - 1







      );















    inputRefs.current[







      nextIndex







    ]?.focus();







  };















  // =====================================================







  // VERIFY OTP







  // =====================================================















  const handleVerifyOTP = async (







    e







  ) => {















    e.preventDefault();















    // -------------------------------------------------







    // PREVENT DOUBLE SUBMISSION







    // -------------------------------------------------















    if (loading) {







      return;







    }















    setError("");







    setMessage("");















    const enteredOTP =







      otp.join("");















    // -------------------------------------------------







    // VALIDATE OTP







    // -------------------------------------------------















    if (







      enteredOTP.length !==







      OTP_LENGTH







    ) {







      setError(







        "Please enter the complete 6-digit OTP."







      );















      return;







    }















    // -------------------------------------------------







    // VALIDATE REGISTRATION INFO







    // -------------------------------------------------















    if (







      !studentId ||







      !email







    ) {







      setError(







        "Registration information is missing. Please register again."







      );















      return;







    }















    setLoading(true);















    try {















      // =================================================







      // VERIFY WITH BACKEND







      // =================================================















      const response =







        await fetch(







          "http://localhost:5000/api/registration/verify-otp",







          {







            method: "POST",















            headers: {







              "Content-Type":







                "application/json",







            },















            body: JSON.stringify({







              studentId,







              email,







              otp: enteredOTP,







            }),







          }







        );















      let data;















      try {







        data =







          await response.json();







      } catch {







        throw new Error(







          "The server returned an invalid response."







        );







      }















      console.log(







        "OTP verification response:",







        data







      );















      // =================================================







      // HANDLE SERVER ERROR







      // =================================================















      if (







        !response.ok ||







        !data.success







      ) {







        throw new Error(







          data.message ||







          "Invalid OTP. Please try again."







        );







      }















      // =================================================







      // OTP SUCCESSFULLY VERIFIED







      // =================================================















      /*







      * IMPORTANT:







      *







      * OTP verification does NOT mean







      * EB/Admin approval.







      *







      * OTP verification only confirms







      * the student's email.







      *







      * The student must still complete:







      *







      * 1. Personal information







      * 2. Required documents







      * 3. Real-time selfie







      * 4. Final registration submission







      *







      * The application MUST NOT become







      * "pending_review" at this stage.







      *







      * "pending_review" should only happen







      * after the documents and selfie are







      * successfully uploaded.







      */















      // -------------------------------------------------







      // KEEP REGISTRATION INFORMATION







      // -------------------------------------------------















      sessionStorage.setItem(







        "votara_student_id",







        studentId







      );















      sessionStorage.setItem(







        "votara_email",







        email







      );















      sessionStorage.setItem(







        "votara_full_name",







        fullName ||







          data.student?.fullName ||







          ""







      );















      sessionStorage.setItem(







        "votara_year_level",







        yearLevel ||







          data.student?.yearLevel ||







          ""







      );















      sessionStorage.setItem(







        "votara_registration_type",







        registrationType







      );















      // -------------------------------------------------







      // MARK OTP AS VERIFIED







      // -------------------------------------------------















      sessionStorage.setItem(







        "votara_otp_verified",







        "true"







      );















      // -------------------------------------------------







      // CLEAR OLD REGISTRATION STATUS







      // -------------------------------------------------















      /*







      * Remove stale status/correction values.







      *







      * This is important when testing multiple







      * registrations in the same browser.







      */















      sessionStorage.removeItem(







        "votara_registration_status"







      );















      sessionStorage.removeItem(







        "votara_correction_message"







      );















      // -------------------------------------------------







      // SAVE SERVER RETURNED STUDENT INFORMATION







      // -------------------------------------------------















      if (data.student) {















        sessionStorage.setItem(







          "votara_verified_student",







          JSON.stringify(







            data.student







          )







        );















        // -------------------------------------------------







        // USE SERVER AUTHORITATIVE INFORMATION







        // -------------------------------------------------















        if (







          data.student.fullName







        ) {







          sessionStorage.setItem(







            "votara_full_name",







            data.student.fullName







          );







        }















        if (







          data.student.yearLevel







        ) {







          sessionStorage.setItem(







            "votara_year_level",







            data.student.yearLevel







          );







        }







      }















      // -------------------------------------------------







      // CLEAR OTP INPUT







      // -------------------------------------------------















      setOtp(







        Array(OTP_LENGTH).fill("")







      );















      // -------------------------------------------------







      // GO TO VOTARA DISCLAIMER







      // -------------------------------------------------















      /*







      * IMPORTANT FLOW CHANGE







      *







      * DO NOT navigate directly to:







      *







      * /student-registration







      *







      * because that page does not exist.







      *







      * The existing VOTARA page that handles







      * the remaining registration process is:







      *







      * /registration-requirements







      *







      * That page handles:







      *







      * - Personal information







      * - Student ID Front







      * - Student ID Back







      * - Enrollment Proof







      * - Supporting Document







      * - Real-time Selfie







      * - Final submission







      *







      * Only after that final submission should







      * the backend change the application to:







      *







      * pending_review







      */

            setShowDisclaimer(true);















    } catch (error) {















      console.error(







        "❌ OTP verification error:",







        error







      );















      setError(







        error.message ||







        "Unable to verify OTP. Please try again."







      );















    } finally {















      setLoading(false);







    }







  };















  // =====================================================







  // RESEND OTP







  // =====================================================















  const handleResendOTP = async () => {















    // -------------------------------------------------







    // PREVENT MULTIPLE REQUESTS







    // -------------------------------------------------















    if (







      countdown > 0 ||







      resending







    ) {







      return;







    }















    if (







      !studentId ||







      !email







    ) {







      setError(







        "Registration information is missing. Please register again."







      );















      return;







    }















    setError("");







    setMessage("");







    setResending(true);















    try {















      // =================================================







      // REQUEST NEW OTP







      // =================================================















      const response =







        await fetch(







          "http://localhost:5000/api/registration/resend-otp",







          {







            method: "POST",















            headers: {







              "Content-Type":







                "application/json",







            },















            body: JSON.stringify({







              studentId,







              email,







            }),







          }







        );















      let data;















      try {







        data =







          await response.json();







      } catch {







        throw new Error(







          "The server returned an invalid response."







        );







      }















      // =================================================







      // SERVER ERROR







      // =================================================















      if (







        !response.ok ||







        !data.success







      ) {







        throw new Error(







          data.message ||







          "Unable to resend OTP."







        );







      }















      // =================================================







      // CLEAR OLD OTP







      // =================================================















      setOtp(







        Array(OTP_LENGTH).fill("")







      );















      // =================================================







      // RESTART TIMER







      // =================================================















      setCountdown(30);















      // =================================================







      // SUCCESS MESSAGE







      // =================================================















      setMessage(







        "A new OTP has been sent to your email."







      );















      // =================================================







      // FOCUS FIRST OTP BOX







      // =================================================















      setTimeout(() => {







        inputRefs.current[0]?.focus();







      }, 50);















    } catch (error) {















      console.error(







        "❌ Resend OTP error:",







        error







      );















      setError(







        error.message ||







        "Unable to resend OTP."







      );















    } finally {















      setResending(false);







    }







  };















  // =====================================================







  // MASK EMAIL







  // =====================================================















  const maskEmail = (







    emailAddress







  ) => {















    if (!emailAddress) {







      return "your email";







    }















    const [







      name,







      domain,







    ] =







      emailAddress.split("@");















    if (







      !name ||







      !domain







    ) {







      return emailAddress;







    }















    if (name.length <= 2) {







      return `${name[0]}***@${domain}`;







    }















    return `${name.substring(







      0,







      2







    )}***@${domain}`;







  };















  // =====================================================







  // RENDER







  // =====================================================















  return (







    <>







    <div className="otp-page">







      <div className="otp-card">















        <section className="otp-left-panel">















          <button







            type="button"







            className="otp-logo"







            onClick={() => navigate("/")}







            aria-label="Go to VOTARA home"







            disabled={loading}







          >







            <img







              src={votaraLogo}







              alt="Votara"







            />







          </button>















          <div className="otp-left-content">















            <span className="otp-left-kicker">







              VOTARA / CAMPUS ELECTIONS







            </span>















            <h2>







              Verify your







              <br />







              student record.







            </h2>















            <p className="otp-left-description">







              We sent a one-time code to the email







              address connected to your student record.







            </p>















            <div className="otp-step-list">















              <div className="otp-step">







                <span className="otp-step-number">







                  01







                </span>















                <span>







                  Student details







                </span>







              </div>















              <div className="otp-step active">







                <span className="otp-step-number">







                  02







                </span>















                <span>







                  Verify your code







                </span>







              </div>















              <div className="otp-step">







                <span className="otp-step-number">







                  03







                </span>















                <span>







                  Await board review







                </span>







              </div>















            </div>















          </div>















          <div







            className="otp-orbit"







            aria-hidden="true"







          >







            <div className="otp-orbit-ring ring-one"></div>







            <div className="otp-orbit-ring ring-two"></div>







            <div className="otp-orbit-ring ring-three"></div>















            <div className="otp-orbit-core">







              <img







                src={votaraLogo}







                alt=""







              />







            </div>















            <span className="otp-orbit-dot orbit-check">







              ✓







            </span>















            <span className="otp-orbit-dot orbit-shield">







              ▣







            </span>















            <span className="otp-orbit-dot orbit-user">







              ♙







            </span>







          </div>















        </section>















        <section className="otp-right-panel">















          <div className="otp-content-card">















            <div className="otp-content">















              <button







                type="button"







                className="otp-back-top"







                onClick={() =>







                  navigate("/register")







                }







                disabled={loading}







              >







                <span className="otp-back-arrow">←</span>







                <span>Back to registration</span>







              </button>















              <span className="otp-kicker">







                OTP VERIFICATION







              </span>















              <h1>







                Enter your code.







              </h1>















              <p>







                We sent a 6-digit verification







                code to:







              </p>















              <div className="otp-email-display">







                <strong>







                  {maskEmail(email)}







                </strong>







              </div>















              <p>







                Enter it below to continue







                your VOTARA registration.







              </p>















              {error && (







                <p







                  className="otp-error"







                  role="alert"







                >







                  {error}







                </p>







              )}















              {message && (







                <p







                  className="otp-success"







                  role="status"







                >







                  {message}







                </p>







              )}















              <form onSubmit={handleVerifyOTP}>















                <div







                  className="otp-input-container"







                  onPaste={handlePaste}







                >







                  {otp.map(







                    (digit, index) => (







                      <input







                        key={index}







                        ref={(element) => {







                          inputRefs.current[index] =







                            element;







                        }}







                        type="text"







                        inputMode="numeric"







                        autoComplete={







                          index === 0







                            ? "one-time-code"







                            : "off"







                        }







                        maxLength={1}







                        value={digit}







                        onChange={(e) =>







                          handleOtpChange(







                            index,







                            e.target.value







                          )







                        }







                        onKeyDown={(e) =>







                          handleKeyDown(







                            index,







                            e







                          )







                        }







                        disabled={loading}







                        aria-label={`OTP digit ${index + 1}`}







                      />







                    )







                  )}







                </div>















                <div className="otp-action-row">















                  <button







                    type="button"







                    className={`resend-button ${







                      countdown > 0 || resending







                        ? "disabled"







                        : ""







                    }`}







                    onClick={handleResendOTP}







                    disabled={







                      countdown > 0 ||







                      resending







                    }







                  >







                    {resending







                      ? "Sending..."







                      : countdown > 0







                      ? `Resend code in 00:${String(







                         countdown







                       ).padStart(2, "0")}`







                      : "Resend code"}







                  </button>















                  <button







                    type="submit"







                    className="verify-button"







                    disabled={







                      loading ||







                      otp.join("").length !==







                        OTP_LENGTH







                    }







                  >







                    {loading







                      ? "Verifying..."







                      : "Verify code"}







                  </button>















                </div>















              </form>















            </div>















    </div>

        </section>
</div>

    </div>
        {showDisclaimer && (

            <div

                className="otp-disclaimer-overlay"

                role="dialog"

                aria-modal="true"

                aria-labelledby="otp-disclaimer-title"

            >

                <div className="otp-disclaimer-modal">

                    <div className="otp-disclaimer-header">

                        <div className="otp-disclaimer-header-copy">

                            <span className="otp-disclaimer-kicker">

                                VOTARA / PLEASE REVIEW

                            </span>

                            <h2 id="otp-disclaimer-title">

                                Before you continue

                            </h2>

                            <p>

                                Please review the following information before continuing your registration.

                            </p>

                        </div>


                        <div

                            className="otp-disclaimer-orbit"

                            aria-hidden="true"

                        >

                            <div className="otp-disclaimer-ring disclaimer-ring-one"></div>

                            <div className="otp-disclaimer-ring disclaimer-ring-two"></div>

                            <div className="otp-disclaimer-ring disclaimer-ring-three"></div>

                            <div className="otp-disclaimer-core">

                                <img src={votaraLogo} alt="" />

                            </div>

                        </div>

                    </div>

                    <div className="otp-disclaimer-body">

                        <span className="otp-disclaimer-label">

                            ACADEMIC PROTOTYPE / DISCLAIMER

                        </span>

                        <h3>Votara app disclaimer</h3>

                        <p className="otp-disclaimer-intro">

                            Votara is a system developed as part of an academic capstone project for the Bachelor of Science in Information Technology (BSIT) program. It is intended for educational and demonstration purposes.

                        </p>

                        <div className="otp-disclaimer-list">

                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">01</span>

                                <div>

                                    <strong>Not an Official Institutional System</strong>

                                    <p>

                                        Votara is a student-developed prototype and is not an officially sanctioned institutional voting system unless formally adopted and authorized by the appropriate school administration or student organization.

                                    </p>

                                </div>

                            </div>

                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">02</span>

                                <div>

                                    <strong>Data Privacy</strong>

                                    <p>

                                        Votara uses registration information and election data to operate and verify the election process. Individual voting selections are intended to remain private from other students and are handled according to the rules of the election.

                                    </p>

                                </div>

                            </div>



                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">03</span>

                                <div>

                                    <strong>No Guarantee of Uninterrupted Service</strong>

                                    <p>

                                        As a student-built application, Votara may experience bugs, downtime, or technical limitations. The developers do not guarantee uninterrupted or error-free operation.

                                    </p>

                                </div>

                            </div>

                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">04</span>

                                <div>

                                    <strong>Election Integrity</strong>

                                    <p>

                                        Votara is designed with security and fairness in mind, but this academic prototype has not undergone the security auditing required for legally binding official elections.

                                    </p>

                                </div>

                            </div>

                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">05</span>

                                <div>

                                    <strong>Limitation of Liability</strong>

                                    <p>

                                        The student project team shall not be held liable for disputes, damages, or consequences arising from use of this academic prototype, including election outcomes, data loss, or misuse of the platform.

                                    </p>

                                </div>

                            </div>

                            <div className="otp-disclaimer-item">

                                <span className="otp-disclaimer-number">06</span>

                                <div>

                                    <strong>Intended Use</strong>

                                    <p>

                                        This application is intended for the BSIT/WIT student community for the purposes outlined by its developers as part of a capstone requirement and is not intended for commercial deployment.

                                    </p>

                                </div>

                            </div>

                        </div>



                        <p className="otp-disclaimer-confirmation">

                            By selecting "I agree and continue," you confirm that you have read this disclaimer.

                        </p>



                        <div className="otp-disclaimer-actions">

                            <button

                                type="button"

                                className="otp-disclaimer-back"

                                onClick={() => setShowDisclaimer(false)}

                            >

                                Go back

                            </button>



                            <button

                                type="button"

                                className="otp-disclaimer-agree"

                                onClick={() => {

                                    sessionStorage.setItem(

                                        "votara_disclaimer_agreed",

                                        "true"

                                    );



                                    navigate(

                                        "/registration-requirements",

                                        {

                                            replace: true,

                                        }

                                    );

                                }}

                            >

                                I agree and continue

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        )}

    </>

);



};
export default OTPVerification;