import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import "./PageLoader.css";

import VotaraLogo from "/src/images/Votara.png";

export default function PageLoader() {
    const ringRef = useRef(null);
    const contentRef = useRef(null);
    const dotRef = useRef(null);

    useLayoutEffect(() => {
        const motion = gsap.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.to(ringRef.current, {
                rotation: 360,
                duration: 0.9,
                repeat: -1,
                ease: "none",
            });
            gsap.from(contentRef.current, {
                opacity: 0, y: 8, scale: 0.97,
                duration: 0.25, ease: "power2.out",
            });
            gsap.to(dotRef.current, {
                opacity: 0.35, duration: 0.65,
                repeat: -1, yoyo: true, ease: "sine.inOut",
            });
        });
        return () => motion.revert();
    }, []);

    return (
        <div className="votara-page-loader" role="status" aria-label="Loading VOTARA" aria-live="polite">
            <div ref={contentRef} className="votara-loader-content" aria-hidden="true">

                <div className="votara-loader-circle">
                    <div ref={ringRef} className="votara-loader-ring" aria-hidden="true"></div>

                    <div className="votara-loader-logo">
                        <img
                            src={VotaraLogo}
                            alt="Votara Logo"
                        />
                    </div>
                </div>

                <div className="votara-loader-brand">VOTARA</div>
                <div className="votara-loader-label">
                    <span ref={dotRef} className="votara-loader-status-dot" />
                    Preparing your workspace
                </div>

            </div>
        </div>
    );
}
