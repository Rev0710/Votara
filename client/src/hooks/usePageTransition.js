import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function usePageTransition() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const goTo = useCallback(
        (path) => {
            if (isLoading) return;

            setIsLoading(true);

            window.setTimeout(() => {
                navigate(path);

                window.setTimeout(() => {
                    setIsLoading(false);
                }, 180);
            }, 300);
        },
        [navigate, isLoading]
    );

    return {
        goTo,
        isLoading,
    };
}