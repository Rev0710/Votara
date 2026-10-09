import React from "react";
import "./PageLoader.css";

// Use the same Votara logo asset already used by AdminDashboard.
// PageLoader.jsx is in src/pages/admin, so this resolves to src/images/Votara.png.
import VotaraLogo from "/src/images/Votara.png";

export default function PageLoader() {
    return (
        <div className="votara-page-loader" role="status" aria-label="Loading">
            <div className="votara-loader-content">

                <div className="votara-loader-circle">
                    <div className="votara-loader-ring"></div>

                    <div className="votara-loader-logo">
                        <img
                            src={VotaraLogo}
                            alt="Votara Logo"
                        />
                    </div>
                </div>

                <div className="votara-loader-brand">Votara</div>
                <div className="votara-loader-label">LOADING</div>

                <div className="votara-loader-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

            </div>
        </div>
    );
}
