// Only a structured VOTARA authentication rejection should end an admin session.
// A proxy or another service on the API port can also return HTTP 401/403.
export function isAdminSessionRejection(error) {
    const response = error?.response;
    const data = response?.data;

    return [401, 403].includes(response?.status)
        && data !== null
        && typeof data === "object"
        && data.success === false
        && typeof data.message === "string"
        && data.message.trim().length > 0;
}

export function getAdminConnectionError(error) {
    const data = error?.response?.data;
    if (typeof data?.message === "string" && data.message.trim()) {
        return data.message;
    }

    return "Unable to reach the VOTARA server. Your admin session has been kept. Please try Refresh when the server is available.";
}
