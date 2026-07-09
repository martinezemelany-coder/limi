export function getFriendlyFirebaseErrorMessage(error) {
    const code = error?.code || ""; 

    if (
        code === "unavailable" ||
        code === "failed-precondition" ||
        code === "network-request-failed" ||
        !navigator.onLine
    ) {
        return "Please connect to Wi-Fi or check your internet connection 💕";
    }

    return error?.message || "Something went wrong. Please try again.";
} 

   