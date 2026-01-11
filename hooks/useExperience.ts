import API_URL from "@/constants/api"; // Adjust path as needed
import { useAuth } from "@/contexts/AuthContext"; // Adjust path as needed
import { Experience } from "@/types/experienceDetails";
import { getUserId } from "@/utils/formatters";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

type UseExperienceResult = {
    experience: Experience | null;
    loading: boolean;
    error: string | null;
    isSaved: boolean;
    toggleSave: () => Promise<void>;
};

export const useExperience = (experienceId: number): UseExperienceResult => {
    const { user } = useAuth();
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchExperience = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch experience data
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch experience");
                }
                const data = await response.json();
                setExperience(data);

                // Check if saved
                const userId = await getUserId(user?.user_id);
                if (userId) {
                    const savedResponse = await fetch(
                        `${API_URL}/saved-experiences/check/${experienceId}?user_id=${userId}`
                    );
                    if (savedResponse.ok) {
                        const savedData = await savedResponse.json();
                        setIsSaved(savedData.isSaved);
                    }
                }
            } catch (err) {
                console.error("Error fetching experience data:", err);
                setError(err instanceof Error ? err.message : "Unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId, user?.user_id]);

    const toggleSave = async () => {
        try {
            const userId = await getUserId(user?.user_id);

            if (!userId) {
                Alert.alert(
                    "Authentication Required",
                    "Please login to save experiences"
                );
                return;
            }

            const response = await fetch(`${API_URL}/saved-experiences/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    experience_id: experienceId,
                    user_id: userId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsSaved(data.action === "saved");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update saved status");
            }
        } catch (err) {
            console.error("Error saving experience:", err);
            Alert.alert(
                "Error",
                "Failed to save experience. Please check your connection."
            );
        }
    };

    return {
        experience,
        loading,
        error,
        isSaved,
        toggleSave,
    };
};