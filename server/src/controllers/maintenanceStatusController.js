const supabase = require("../config/supabase");

// Public endpoint: intentionally does not require an admin token.
// It exposes only the maintenance state needed by the frontend gate.
const getMaintenanceStatus = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("system_settings")
            .select("settings")
            .eq("id", 1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        const settings =
            data?.settings &&
            typeof data.settings === "object"
                ? data.settings
                : {};

        return res.status(200).json({
            success: true,
            maintenance: {
                enabled: Boolean(settings.maintenanceMode),
                message:
                    settings.maintenanceMessage ||
                    "The system is under maintenance. Please check back later.",
            },
        });
    } catch (error) {
        console.error(
            "Maintenance status error:",
            error
        );

        return res.status(500).json({
            success: false,
            maintenance: {
                enabled: false,
                message:
                    "The system is under maintenance. Please check back later.",
            },
        });
    }
};

module.exports = {
    getMaintenanceStatus,
};
