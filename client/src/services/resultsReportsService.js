
import api from "./api";

/**
 * Load aggregate election results for the Electoral Board.
 *
 * @param {string} electionId
 * @returns {Promise<object>}
 */
export const getResultsReportsData = async (electionId = "") => {
    const response = await api.get(
        "/electoral-board/results-reports",
        {
            params: electionId
                ? { election_id: electionId }
                : {},
        }
    );

    if (!response?.data?.success) {
        throw new Error(
            response?.data?.message ||
            "Unable to load election results."
        );
    }

    return response.data;
};

/**
 * Export aggregate election results as an Excel file.
 *
 * @param {string} electionId
 * @returns {Promise<object>}
 */
export const exportResultsReports = async (electionId) => {
    if (!electionId) {
        throw new Error(
            "Please select an election before exporting results."
        );
    }

    const response = await api.get(
        "/electoral-board/results-reports/export",
        {
            params: {
                election_id: electionId,
            },
            responseType: "blob",
        }
    );

    return response;
};

export default {
    getResultsReportsData,
    exportResultsReports,
};
