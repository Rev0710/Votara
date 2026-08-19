import React from 'react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#EAEFFD] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-4xl p-8 md:p-12 flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="w-full flex items-center justify-start gap-3 mb-12">
          <svg
            className="w-10 h-10 text-[#0047FF]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z" />
          </svg>
          <span className="text-3xl font-bold text-[#0047FF] tracking-tight">
            Votara
          </span>
        </div>

        {/* Content Container */}
        <div className="max-w-2xl w-full text-[#1E1E1E] space-y-4 text-xs md:text-sm leading-relaxed">
          <h2 className="font-bold text-sm md:text-base uppercase tracking-wide text-black">
            WELCOME USERNAME !
          </h2>

          <p className="text-gray-600 font-medium">
            2026 OPAL TEAM. All rights reserved
          </p>

          <div className="space-y-3 pt-2">
            <p className="font-semibold text-black">Votara App Disclaimer</p>
            <p className="text-gray-700">
              Votara is a system developed as part of an academic capstone project for the Bachelor of Science in Information Technology (BSIT) program at Western Institute of Technology (WIT). It is intended for educational and demonstration purposes.
            </p>

            <div>
              <span className="font-semibold block text-black">1. Not an Official Institutional System</span>
              <p className="text-gray-700">
                Votara is a student-developed prototype and is not an officially sanctioned voting system of Western Institute of Technology unless formally adopted and authorized by the school administration or Student Supreme Council. Any election conducted using this app is subject to the approval and oversight of the relevant student organization or department.
              </p>
            </div>

            <div>
              <span className="font-semibold block text-black">2. Data Privacy</span>
              <p className="text-gray-700">
                Votara may collect limited user information (e.g., student ID, section, voting selections) solely for the purpose of conducting and verifying elections within the scope of this project. Data collected is used only for academic demonstration and will not be shared with third parties. Users should avoid entering sensitive personal information beyond what is required.
              </p>
            </div>

            <div>
              <span className="font-semibold block text-black">3. No Guarantee of Uninterrupted Service</span>
              <p className="text-gray-700">
                As a student-built application, Votara may experience bugs, downtime, or technical limitations. The developers do not guarantee uninterrupted or error-free operation and are not liable for any loss, damage, or inconvenience resulting from technical issues.
              </p>
            </div>

            <div>
              <span className="font-semibold block text-black">4. Election Integrity</span>
              <p className="text-gray-700">
                While Votara is designed with security and fairness in mind, it has not undergone the level of security auditing required for legally binding, official, or government-recognized elections. Results generated through this app should be treated as advisory unless independently verified by the organization conducting the election.
              </p>
            </div>

            <div>
              <span className="font-semibold block text-black">5. Limitation of Liability</span>
              <p className="text-gray-700">
                The developers of Votara (the student project team) shall not be held liable for any disputes, damages, or consequences arising from the use of this application, including but not limited to election outcomes, data loss, or misuse of the platform.
              </p>
            </div>

            <div>
              <span className="font-semibold block text-black">6. Intended Use</span>
              <p className="text-gray-700">
                This application is intended solely for use within the BSIT department/WIT student community for the purposes outlined by its developers as part of a capstone requirement, and is not licensed or intended for commercial deployment.
              </p>
            </div>

            <p className="text-gray-700 pt-2">
              Want me to adjust the tone (more formal/legal vs. simpler/plain language), or turn this into a proper Word document you can include as an appendix in your capstone paper?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-8">
            <button
              type="button"
              className="px-8 py-2.5 rounded-md border border-gray-400 text-gray-800 font-medium hover:bg-gray-50 transition-colors duration-150 min-w-[140px]"
            >
              Go back
            </button>
            <button
              type="button"
              className="px-8 py-2.5 rounded-md bg-[#0047FF] text-white font-medium hover:bg-blue-700 transition-colors duration-150 min-w-[140px]"
            >
              I agree
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}