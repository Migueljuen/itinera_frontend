// hooks/useNearbyFood.ts

import API_URL from "@/constants/api";
import { useEffect, useState } from "react";

export type NearbyFoodItem = {
    experience_id: number;
    title: string;
    primary_image: string | null;
    images?: string[];
    destination_name?: string;
    destination_city?: string;
    destination_latitude: number | null;
    destination_longitude: number | null;
    price: number | null;
    price_estimate: string | null;
    unit: string | null;
    distance_km?: number | null;
};

/**
 * Fetches food experiences (category_id = 3) near a geographic point.
 *
 * @param lat  - Latitude of the anchor location
 * @param lng  - Longitude of the anchor location
 * @param excludeId - experience_id to exclude (the current experience itself)
 * @param radiusKm  - Search radius in kilometres (default 5)
 */
export function useNearbyFood(
    lat: number | null | undefined,
    lng: number | null | undefined,
    excludeId?: number,
    radiusKm = 5
) {
    const [items, setItems] = useState<NearbyFoodItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lat == null || lng == null) return;

        let cancelled = false;

        const fetchNearbyFood = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    lat: String(lat),
                    lng: String(lng),
                    radius: String(radiusKm),
                });
                if (excludeId != null) params.set("exclude", String(excludeId));

                const res = await fetch(
                    `${API_URL}/experience/nearby-food?${params.toString()}`
                );

                if (!res.ok) return;

                const data: NearbyFoodItem[] = await res.json();
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                console.warn("useNearbyFood: fetch failed", e);
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchNearbyFood();

        return () => {
            cancelled = true;
        };
    }, [lat, lng, excludeId, radiusKm]);

    return { items, loading };
}
