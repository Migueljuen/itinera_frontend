import API_URL from "@/constants/api"; // Adjust path as needed
import { Review } from "@/types/experienceDetails";
import { useEffect, useState } from "react";

const DUMMY_REVIEWS: Review[] = [
    {
        id: 1,
        userName: "Maria Santos",
        rating: 5,
        comment:
            "Amazing experience! The guide was very knowledgeable and friendly. The views were breathtaking and worth every peso. Highly recommend this to anyone visiting the area!",
        date: "2025-06-15",
        helpful: 12,
    },
    {
        id: 2,
        userName: "John Chen",
        rating: 4,
        comment:
            "Great tour overall. The location is beautiful and the activities were fun. Only minor issue was the timing - we felt a bit rushed at some spots. Still, would definitely recommend!",
        date: "2025-06-10",
        helpful: 8,
    },
    {
        id: 3,
        userName: "Ana Reyes",
        rating: 5,
        comment:
            "Perfect day out! Everything was well organized from start to finish. The local insights shared by our guide made the experience even more special. Don't forget to bring your camera!",
        date: "2025-06-05",
        helpful: 15,
    },
    {
        id: 4,
        userName: "Robert Garcia",
        rating: 3,
        comment:
            "The experience itself was good but felt overpriced for what was offered. The location is nice but can get very crowded. Better to go early in the morning if possible.",
        date: "2025-05-28",
        helpful: 5,
    },
    {
        id: 5,
        userName: "Lisa Fernandez",
        rating: 5,
        comment:
            "Absolutely loved it! This was the highlight of our trip. The staff went above and beyond to make sure everyone had a great time. Worth every penny!",
        date: "2025-05-20",
        helpful: 20,
    },
];

type UseReviewsResult = {
    reviews: Review[];
    loading: boolean;
    error: string | null;
};

export const useReviews = (experienceId: number): UseReviewsResult => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `${API_URL}/reviews/experience/${experienceId}`
                );
                const data = await response.json();

                if (data.success && data.reviews.length > 0) {
                    const mapped = data.reviews.map((r: any) => ({
                        id: r.review_id,
                        userName: r.user_name,
                        userAvatar: r.profile_pic,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at,
                        helpful: r.helpful_count,
                    }));
                    setReviews(mapped);
                } else {
                    // Fallback to dummy data
                    setReviews(DUMMY_REVIEWS);
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setReviews(DUMMY_REVIEWS); // Fallback
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [experienceId]);

    return {
        reviews,
        loading,
        error,
    };
};