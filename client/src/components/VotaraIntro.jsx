
import { useEffect, useRef, useState } from "react";
import "./VotaraIntro.css";

export default function VotaraIntro({ onComplete }) {
    const [videoError, setVideoError] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const completedRef = useRef(false);
    const fallbackTimer = useRef(null);

    const finishIntro = () => {
        if (completedRef.current) return;

        completedRef.current = true;
        setIsFading(true);

        fallbackTimer.current = window.setTimeout(() => {
            onComplete?.();
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (fallbackTimer.current) {
                window.clearTimeout(fallbackTimer.current);
            }
        };
    }, []);

    return (
        <div
            className={`votara-intro ${
                isFading ? "votara-intro--fade-out" : ""
            }`}
            aria-label="VOTARA introduction"
        >
            {!videoError ? (
                <video
                    className="votara-intro-video"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onEnded={finishIntro}
                    onError={() => setVideoError(true)}
                >
                    <source
                        src="/votara-intro.mp4"
                        type="video/mp4"
                    />
                </video>
            ) : (
                <div className="votara-intro-fallback">
                    <h1>Votara</h1>
                    <p>Welcome to VOTARA</p>
                    <button type="button" onClick={finishIntro}>
                        Continue to VOTARA
                    </button>
                </div>
            )}
        </div>
    );
}
