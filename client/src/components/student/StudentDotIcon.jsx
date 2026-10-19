// Filled dot silhouettes match the existing dashboard mark at every scale.
const patterns = {
    dashboard: ["000010000", "000111000", "001111100", "011111110", "011111110", "011010110", "011010110", "011010110", "000000000"],
    vote: ["000000010", "000000110", "000000110", "000110110", "000110110", "011110110", "011110110", "011110110", "000000000"],
    candidates: ["001100110", "011110111", "001100110", "000000000", "011110110", "110011001", "110011001", "110011001", "000000000"],
    results: ["001111100", "111111111", "110111011", "110111011", "011111110", "000111000", "000010000", "000111000", "001111100"],
    guidelines: ["001111100", "011000110", "110011011", "000011011", "000110110", "000110000", "000000000", "000110000", "000110000"],
    settings: ["000111000", "010111010", "111111111", "111000111", "111000111", "111000111", "111111111", "010111010", "000111000"],
};

export default function StudentDotIcon({ name }) {
    const pattern = patterns[name] || patterns.dashboard;
    return <svg className="student-dot-icon" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true" focusable="false">
        {pattern.flatMap((row, y) => [...row].map((dot, x) => dot === "1"
            ? <circle key={`${x}-${y}`} cx={x + 1.5} cy={y + 1.5} r="0.39" /> : null))}
    </svg>;
}
