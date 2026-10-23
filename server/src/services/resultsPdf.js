
const PDFDocument = require("pdfkit");

function buildResultsPdf(report) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true,
            info: { Title: report.election.title + " - Results & Reports", Author: "VOTARA" } });
        const chunks = [];
        doc.on("data", chunk => chunks.push(chunk));
        doc.on("error", reject);
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        const width = doc.page.width - 84;
        const bottom = () => doc.page.height - 64;
        const room = height => { if (doc.y + height > bottom()) doc.addPage(); };
        const line = (text, size = 11, bold = false, color = "#172033") => {
            doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color);
            room(doc.heightOfString(String(text), {width}) + 8);
            doc.text(String(text), 42, doc.y, {width, lineGap: 3}).moveDown(.4);
        };
        try {
            line("VOTARA / RESULTS & REPORTS", 11, true, "#155dfb");
            line(report.election.title || "Election", 24, true);
            line([report.election.electionDate || "Date not set",
                (report.election.startTime || "-") + " - " + (report.election.endTime || "-"),
                report.election.status || "Unknown status"].join(" | "));
            line("Generated: " + new Date(report.generatedAt).toLocaleString("en-PH", {timeZone: "Asia/Manila"}) + " (Asia/Manila)", 9, false, "#53627a");
            line("Participation summary", 15, true);
            const s = report.summary;
            for (const [label, value] of [
                ["Eligible voters", s.eligibleVoters], ["Voters who voted", s.votersWhoVoted],
                ["Remaining voters", s.remainingVoters], ["Turnout", Number(s.turnoutPercentage || 0).toFixed(2) + "%"],
                ["Submitted ballots", s.submittedBallots], ["Positions", report.positions.length],
                ["Candidates", report.positions.reduce((n, p) => n + p.candidates.length, 0)],
                ["Positions with results", s.positionsWithResults], ["Tied positions", s.tiedPositions],
                ["Positions without votes", s.positionsWithoutVotes],
            ]) line(label + ": " + (value ?? 0));
            line("Complete candidate results", 17, true);
            for (const position of report.positions) {
                room(100);
                line(position.position + " / " + String(position.status || "no_votes").replace(/_/g, " "), 13, true, "#155dfb");
                if (!position.candidates.length) { line("No candidates registered for this position."); continue; }
                const total = position.candidates.reduce((n, c) => n + Number(c.votes || 0), 0);
                const highest = Math.max(...position.candidates.map(c => Number(c.votes || 0)));
                const columns = [0, 208, 345, 393, 449], widths = [200, 129, 40, 48, width - 449];
                const header = () => {
                    room(42);
                    const y = doc.y;
                    doc.font("Helvetica-Bold").fontSize(9).fillColor("#53627a");
                    ["Candidate", "Party list", "Votes", "Share", "Result"].forEach((label, i) => {
                        doc.text(label, 42 + columns[i], y, {width: widths[i], align: i === 2 || i === 3 ? "right" : "left"});
                    });
                    doc.y = y + 24;
                };
                header();
                for (const candidate of position.candidates) {
                    const votes = Number(candidate.votes || 0);
                    const result = votes > 0 && votes === highest
                        ? (position.status === "tie" ? "Tie" : position.winner?.name === candidate.name ? "Winner" : "") : "";
                    const cells = [candidate.name || "Unnamed candidate", candidate.party || "Independent",
                        String(votes), (total ? (votes / total * 100).toFixed(2) : "0.00") + "%", result];
                    doc.font("Helvetica").fontSize(9);
                    const height = Math.max(...cells.map((cell, i) => doc.heightOfString(cell, {width: widths[i]}))) + 18;
                    if (doc.y + height > bottom()) { doc.addPage(); line(position.position + " (continued)", 13, true); header(); }
                    doc.font("Helvetica").fontSize(9);
                    const y = doc.y;
                    cells.forEach((cell, i) => doc.fillColor("#172033").text(cell, 42 + columns[i], y + 5,
                        {width: widths[i], align: i === 2 || i === 3 ? "right" : "left"}));
                    doc.moveTo(42, y + height).lineTo(42 + width, y + height).strokeColor("#dce3ef").lineWidth(.5).stroke();
                    doc.y = y + height + 4;
                }
                line("Total votes for this position: " + total, 9, true);
                doc.moveDown(.5);
            }
            line("Aggregate election totals only. Individual ballot selections and private student records are excluded.", 9, false, "#53627a");
            const pages = doc.bufferedPageRange();
            for (let index = 0; index < pages.count; index++) {
                doc.switchToPage(index);
                doc.font("Helvetica").fontSize(8).fillColor("#53627a")
                    .text("VOTARA | Page " + (index + 1) + " of " + pages.count, 42, doc.page.height - 40,
                        {width, align: "right", lineBreak: false});
            }
            doc.end();
        } catch (error) { doc.destroy(); reject(error); }
    });
}
module.exports = { buildResultsPdf };
