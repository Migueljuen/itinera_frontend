import API_URL from "@/constants/api"; // Adjust path as needed
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Formats an image URL to include the API base URL if needed
 */
export const getFormattedImageUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) {
        return imageUrl;
    }
    const formattedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${API_URL}${formattedPath}`;
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
    return new Date().toISOString().split("T")[0];
};

/**
 * Gets a date one week from now as an ISO string (YYYY-MM-DD)
 */
export const getNextWeekDateString = (): string => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
};

/**
 * Retrieves the user ID from the auth context or AsyncStorage
 */
export const getUserId = async (contextUserId?: number): Promise<number | null> => {
    if (contextUserId) return contextUserId;

    try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
            const userObj = JSON.parse(userData);
            return userObj.user_id;
        }
    } catch (e) {
        console.error("Error parsing user data:", e);
    }

    return null;
};

/**
 * Formats a profile picture URL
 */
export const getProfilePicUrl = (profilePic: string | null): string | null => {
    if (!profilePic) return null;
    return `${API_URL}/${profilePic.replace(/\\/g, '/')}`;
};