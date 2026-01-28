// AvailabilityCalendar.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import API_URL from "../constants/api";

type TimeSlot = {
    slot_id?: number;
    availability_id?: number;
    start_time: string;
    end_time: string;

    price_per_guest?: number; // may still arrive as string at runtime; handled below

    // NEW: capacity fields returned by backend (per date)
    max_guests?: number;
    used_guests?: number;
    remaining_guests?: number;
};

type AvailabilityDay = {
    availability_id?: number;
    experience_id?: number;
    day_of_week: string;
    time_slots: TimeSlot[];
};

type AvailabilityData = {
    availability: AvailabilityDay[];
};

interface AvailabilityCalendarProps {
    experienceId: number;
    tripStartDate: string;
    tripEndDate: string;

    // numeric fallback (experience-level)
    pricePerGuest?: number;

    // NEW: string fallback (experience-level estimate)
    priceEstimate?: string | null;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
    experienceId,
    tripStartDate,
    tripEndDate,
    pricePerGuest = 0,
    priceEstimate = null,
}) => {
    // NEW: store slots per actual date (YYYY-MM-DD)
    const [slotsByDate, setSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tripStart = useMemo(() => new Date(tripStartDate), [tripStartDate]);
    const tripEnd = useMemo(() => new Date(tripEndDate), [tripEndDate]);

    const toYYYYMMDD = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const getTripDates = () => {
        const dates: Date[] = [];
        const currentDate = new Date(tripStart);
        currentDate.setHours(0, 0, 0, 0);

        const end = new Date(tripEnd);
        end.setHours(0, 0, 0, 0);

        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const tripDates = useMemo(() => getTripDates(), [tripStart, tripEnd]);

    useEffect(() => {
        let cancelled = false;

        const fetchAvailabilityForTrip = async () => {
            try {
                setLoading(true);
                setError(null);

                const results: Record<string, TimeSlot[]> = {};

                // fetch for each date so remaining_guests is correct per date
                await Promise.all(
                    tripDates.map(async (dateObj) => {
                        const dateStr = toYYYYMMDD(dateObj);
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

                        const resp = await fetch(
                            `${API_URL}/experience/availability/${experienceId}?date=${encodeURIComponent(dateStr)}`
                        );

                        if (!resp.ok) {
                            // Don't crash the whole calendar if one date fails
                            results[dateStr] = [];
                            return;
                        }

                        const data: AvailabilityData = await resp.json();

                        const day = data?.availability?.find((d) => d.day_of_week === dayName);
                        const slots = Array.isArray(day?.time_slots) ? day!.time_slots : [];

                        results[dateStr] = slots;
                    })
                );

                if (!cancelled) {
                    setSlotsByDate(results);
                }
            } catch (e) {
                console.error("Error fetching availability data:", e);
                if (!cancelled) setError("Could not load availability information");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAvailabilityForTrip();

        return () => {
            cancelled = true;
        };
    }, [experienceId, tripDates]);

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const formatTimeRange = (startTime: string, endTime: string) => {
        return `${formatTime(startTime)} – ${formatTime(endTime)}`;
    };

    const timeToMinutes = (timeString: string) => {
        const [hours, minutes] = timeString.split(":").map((num) => parseInt(num, 10));
        return hours * 60 + minutes;
    };

    const sortTimeSlots = (slots: TimeSlot[]) => {
        return [...slots].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    };

    const formatDateHeader = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
        });
    };

    const getMonthYear = () => {
        return tripStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const formatPrice = (price: number) => `₱${price.toLocaleString()}`;

    // ---------- Price fallback helpers ----------
    const toValidPriceNumber = (val: unknown): number | null => {
        if (val === null || val === undefined || val === "") return null;
        const n = Number(val);
        if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return null;
        return n;
    };

    const getCleanEstimate = (estimate: string | null | undefined) => {
        if (typeof estimate !== "string") return null;
        const trimmed = estimate.trim();
        if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
        return trimmed.replace(/^₱\s*/i, "");
    };

    const renderPriceLine = (slot: TimeSlot) => {
        const slotPrice = toValidPriceNumber((slot as any).price_per_guest);
        const fallbackPrice = toValidPriceNumber(pricePerGuest);

        const estimate = getCleanEstimate(priceEstimate);

        if (slotPrice != null) return `${formatPrice(slotPrice)} / guest`;
        if (fallbackPrice != null) return `${formatPrice(fallbackPrice)} / guest`;
        if (estimate) return `Est. ₱${estimate} / guest`;
        return "—";
    };
    // ------------------------------------------

    const renderSlotsLeft = (slot: TimeSlot) => {
        const remaining = slot.remaining_guests;
        if (remaining === null || remaining === undefined) return null;

        const n = Number(remaining);
        if (!Number.isFinite(n)) return null;

        if (n <= 0) return "Full";
        return `${n} slots left`;
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 64 }}>
                <ActivityIndicator size="large" color="#1f2937" />
                <Text style={{ marginTop: 16, color: "#6B7280" }}>Loading availability...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 64 }}>
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
                <Text
                    style={{
                        color: "#EF4444",
                        fontWeight: "500",
                        textAlign: "center",
                        marginTop: 16,
                    }}
                >
                    {error}
                </Text>
            </View>
        );
    }

    // If every date has 0 slots, show empty state
    const hasAnySlots = Object.values(slotsByDate).some((arr) => Array.isArray(arr) && arr.length > 0);

    if (!hasAnySlots) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 64 }}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={{ color: "#4B5563", fontWeight: "500", textAlign: "center", marginTop: 16 }}>
                    No availability found
                </Text>
                <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 8, paddingHorizontal: 32 }}>
                    This experience has no available time slots for your trip dates.
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Month Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#E5E7EB",
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#000" }}>{getMonthYear()}</Text>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="calendar-outline" size={20} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Scrollable Time Slots */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {tripDates.map((date, dateIndex) => {
                    const dateStr = toYYYYMMDD(date);
                    const daySlots = slotsByDate[dateStr] || [];
                    const sortedSlots = daySlots.length ? sortTimeSlots(daySlots) : [];

                    if (sortedSlots.length === 0) return null;

                    return (
                        <View key={dateIndex} style={{ paddingTop: 20 }}>
                            {/* Date Header */}
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 12 }}>
                                {formatDateHeader(date)}
                            </Text>

                            {/* Time Slot Cards - View Only */}
                            {sortedSlots.map((slot, slotIndex) => {
                                const slotsLeftText = renderSlotsLeft(slot);

                                return (
                                    <View
                                        key={slotIndex}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: "#E5E7EB",
                                            backgroundColor: "#fff",
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            marginBottom: 12,
                                        }}

                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <View style={{ flex: 1 }}>
                                                <View className="flex font-onest  flex-row items-center justify-between">
                                                    <Text style={{ fontSize: 18, fontWeight: "400", color: "#000" }}>
                                                        {formatTimeRange(slot.start_time, slot.end_time)}
                                                    </Text>
                                                    {!!slotsLeftText && (
                                                        <Text
                                                            className="font-onest-medium text-black/50"
                                                            style={{
                                                                fontSize: 14,

                                                                fontWeight: slotsLeftText === "Full" ? "600" : "500",
                                                            }}
                                                        >
                                                            {slotsLeftText}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text className="font-onest" style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
                                                    {renderPriceLine(slot)}
                                                </Text>


                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default AvailabilityCalendar;
