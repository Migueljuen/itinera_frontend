// app/(partner)/GuideAvailability.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import API_URL from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";

type DayOfWeek =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";

type OverrideType = "Available" | "Unavailable";

type GuideProfile = {
    guide_id: number;
    availability_days: string[] | string | null;
};

type AvailabilityOverride = {
    override_id: number;
    date: string; // can be "YYYY-MM-DD" or timestamp
    type: OverrideType;
    reason?: string | null;
};

const DAYS_OF_WEEK: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

function parseAvailabilityDays(input: GuideProfile["availability_days"]): DayOfWeek[] {
    try {
        if (!input) return [];
        if (Array.isArray(input)) return input as DayOfWeek[];
        if (typeof input === "string") return JSON.parse(input || "[]") as DayOfWeek[];
        return [];
    } catch {
        return [];
    }
}

const softShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
};

export default function GuideAvailability() {
    const { user, token } = useAuth();
    const [updatingDays, setUpdatingDays] = useState<Partial<Record<DayOfWeek, boolean>>>({});

    const [loading, setLoading] = useState(false);
    const [guideProfile, setGuideProfile] = useState<GuideProfile | null>(null);

    const [availabilityDays, setAvailabilityDays] = useState<DayOfWeek[]>([]);
    const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);

    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    const [showAddOverrideModal, setShowAddOverrideModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // header filter pills (like Inbox)
    const filters = ["All", "Weekly", "Special Dates", "Calendar"];
    const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

    // override form
    const [overrideDate, setOverrideDate] = useState<Date>(new Date());
    const [overrideReason, setOverrideReason] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);


    const fetchGuideProfile = async () => {
        if (!user?.user_id) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/partner/profile/guide/${user.user_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const profile: GuideProfile | undefined = res.data?.profile;
            if (!profile) {
                toast.error("Guide profile not found.");
                return;
            }

            setGuideProfile(profile);
            setAvailabilityDays(parseAvailabilityDays(profile.availability_days));
        } catch (e) {
            console.error("Error fetching guide profile:", e);
            toast.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchOverrides = async () => {
        if (!user?.user_id) return;
        try {
            const res = await axios.get(
                `${API_URL}/partner/availability/overrides/user/${user.user_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setOverrides(res.data?.overrides || []);
        } catch (e) {
            console.error("Error fetching overrides:", e);
        }
    };

    const refreshAll = async () => {
        try {
            setUploading(true);
            await Promise.all([fetchGuideProfile(), fetchOverrides()]);
            toast.success("Refreshed");
        } catch {
            // handled above
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (user?.user_id) {
            fetchGuideProfile();
            fetchOverrides();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_id]);

    const overrideDateString = useMemo(
        () => dayjs(overrideDate).format("YYYY-MM-DD"),
        [overrideDate]
    );

    const getOverrideForDate = (date: dayjs.Dayjs) => {
        return overrides.find((o) => dayjs(o.date).isSame(date, "day"));
    };

    const isDayAvailable = (date: dayjs.Dayjs) => {
        const dayName = date.format("dddd") as DayOfWeek;
        const override = getOverrideForDate(date);
        if (override) return override.type === "Available";
        return availabilityDays.includes(dayName);
    };

    const generateCalendarDays = () => {
        const startOfMonth = selectedMonth.startOf("month");
        const endOfMonth = selectedMonth.endOf("month");

        // Force Sunday-start week to match your header (Sun..Sat)
        const startDate = startOfMonth.day(0); // Sunday
        const endDate = endOfMonth.day(6);     // Saturday

        const days: dayjs.Dayjs[] = [];
        let current = startDate;

        while (current.isBefore(endDate, "day") || current.isSame(endDate, "day")) {
            days.push(current);
            current = current.add(1, "day");
        }

        return days;
    };

    const calendarDays = useMemo(
        () => generateCalendarDays(),
        // keep deps for correctness when overrides/days change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedMonth, overrides, availabilityDays]
    );

    const weeklyEnabledCount = availabilityDays.length;

    const upcomingBlockedCount = useMemo(() => {
        const today = dayjs().startOf("day");
        return overrides.filter((o) => {
            const d = dayjs(o.date).startOf("day");
            return d.isSame(today) || d.isAfter(today) ? o.type === "Unavailable" : false;
        }).length;
    }, [overrides]);

    const toggleWeeklyDay = async (day: DayOfWeek, nextValue: boolean) => {
        if (!guideProfile?.guide_id) return;

        const prevDays = availabilityDays;

        const updatedDays = nextValue
            ? Array.from(new Set([...prevDays, day]))
            : prevDays.filter((d) => d !== day);

        // optimistic UI
        setAvailabilityDays(updatedDays);

        try {
            setUpdatingDays((p) => ({ ...p, [day]: true }));

            await axios.put(
                `${API_URL}/partner/profile/guide/${guideProfile.guide_id}/availability`,
                { availability_days: JSON.stringify(updatedDays) },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (e) {
            setAvailabilityDays(prevDays); // rollback
            toast.error("Failed to update availability");
        } finally {
            setUpdatingDays((p) => ({ ...p, [day]: false }));
        }
    };


    const openAddOverride = (date?: Date) => {
        const base = date ?? new Date();
        setOverrideDate(base);
        setOverrideReason("");
        setShowAddOverrideModal(true);
    };

    const handleAddOverride = async () => {
        if (!user?.user_id) return;

        // Prevent past dates
        if (dayjs(overrideDate).isBefore(dayjs(), "day")) {
            toast.error("Please select a date starting today.");
            return;
        }

        try {
            setUploading(true);
            await axios.post(
                `${API_URL}/partner/availability/overrides`,
                {
                    entity_type: "user",
                    entity_id: user.user_id,
                    date: overrideDateString,
                    type: "Unavailable",
                    reason: overrideReason,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Unavailable date added");
            setShowAddOverrideModal(false);
            await fetchOverrides();
        } catch (e) {
            console.error("Error adding override:", e);
            toast.error("Failed to add override");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteOverride = (overrideId: number) => {
        Alert.alert("Remove override?", "This will delete the special date.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                    try {
                        setUploading(true);
                        await axios.delete(`${API_URL}/partner/availability/overrides/${overrideId}`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        });
                        toast.success("Override removed");
                        await fetchOverrides();
                    } catch (e) {
                        console.error("Error deleting override:", e);
                        toast.error("Failed to delete override");
                    } finally {
                        setUploading(false);
                    }
                },
            },
        ]);
    };

    const onDatePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS !== "ios") setShowDatePicker(false);
        if (event.type === "dismissed") return;
        if (selected) setOverrideDate(selected);
    };

    // Filtered render flags (so it feels like Inbox pills)
    const showWeekly = activeFilter === "All" || activeFilter === "Weekly";
    const showSpecial = activeFilter === "All" || activeFilter === "Special Dates";
    const showCalendar = activeFilter === "All" || activeFilter === "Calendar";

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1 "
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header (match Inbox header layout) */}
                <View className="p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-3xl font-onest-semibold text-black/90">
                                Availability
                            </Text>
                            <Text className="text-black/40 font-onest">
                                {weeklyEnabledCount} weekly days • {upcomingBlockedCount} blocked dates
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                            <Pressable
                                onPress={refreshAll}
                                disabled={loading || uploading}
                                className="w-10 h-10 rounded-full  items-center justify-center"
                                style={({ pressed }) => [
                                    softShadow,
                                    { opacity: pressed ? 0.8 : 1 },
                                ]}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#1f2937" />
                                ) : (
                                    <Ionicons name="refresh-outline" size={20} color="rgba(0,0,0,0.7)" />
                                )}
                            </Pressable>

                            <View className="bg-indigo-50 rounded-full px-3 py-1">
                                <Text className="text-primary font-onest-semibold text-sm">
                                    {upcomingBlockedCount}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Filter pills (same pattern as Inbox) */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                    >
                        {filters.map((filter) => {
                            const isActive = activeFilter === filter;
                            return (
                                <Pressable
                                    key={filter}
                                    onPress={() => setActiveFilter(filter)}
                                    className={`px-6 py-2 rounded-full mr-3 ${isActive ? "bg-[#191313]" : ""
                                        }`}
                                    style={softShadow}
                                >
                                    <Text
                                        className={`text-base font-onest-medium ${isActive ? "text-white" : "text-black/40"
                                            }`}
                                    >
                                        {filter}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Content */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-4 pt-2 gap-4">
                        {/* Weekly Availability Card */}
                        {showWeekly && (
                            <View className="bg-white rounded-2xl p-5" style={softShadow}>
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-12 h-12 rounded-full bg-black/5 items-center justify-center">
                                            <Ionicons name="time-outline" size={20} color="rgba(0,0,0,0.75)" />
                                        </View>
                                        <View>
                                            <Text className="text-base font-onest-semibold text-black/90">
                                                Weekly Availability
                                            </Text>
                                            <Text className="text-sm text-black/40 font-onest">
                                                Toggle the days you’re generally available
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {loading ? (
                                    <Text className="text-black/50 font-onest">Loading...</Text>
                                ) : (
                                    <View className="gap-3">
                                        {DAYS_OF_WEEK.map((day) => {
                                            const active = availabilityDays.includes(day);
                                            return (
                                                <View key={day} className="flex-row items-center justify-between">
                                                    <Text
                                                        className={`text-base font-onest-medium ${active ? "text-black/90" : "text-black/35"
                                                            }`}
                                                    >
                                                        {day}
                                                    </Text>

                                                    <Switch
                                                        value={active}
                                                        trackColor={{ false: "#E5E7EB", true: "#191313" }}
                                                        onValueChange={(next) => toggleWeeklyDay(day, next)}
                                                        disabled={!!updatingDays[day] || !guideProfile?.guide_id}
                                                    />

                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Special Dates Card */}
                        {showSpecial && (
                            <View className="bg-white rounded-2xl p-5" style={softShadow}>
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-12 h-12 rounded-full bg-black/5 items-center justify-center">
                                            <Ionicons name="calendar-outline" size={20} color="rgba(0,0,0,0.75)" />
                                        </View>
                                        <View>
                                            <Text className="text-base font-onest-semibold text-black/90">
                                                Special Dates
                                            </Text>
                                            <Text className="text-sm text-black/40 font-onest">
                                                Block specific dates you won’t be available
                                            </Text>
                                        </View>
                                    </View>

                                    <Pressable
                                        onPress={() => openAddOverride(new Date())}
                                        disabled={uploading}
                                        className="px-4 py-2 rounded-full bg-primary"
                                        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                                    >
                                        <Text className="text-white font-onest-medium">Add</Text>
                                    </Pressable>
                                </View>

                                {overrides.length === 0 ? (
                                    <View className="items-center justify-center py-6">
                                        <Ionicons name="calendar-clear-outline" size={44} color="#D1D5DB" />
                                        <Text className="text-black/40 font-onest-medium text-base mt-3">
                                            No special dates set
                                        </Text>
                                        <Text className="text-black/40 font-onest text-sm mt-1">
                                            Add blocked dates when you’re unavailable
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="gap-2">
                                        {overrides
                                            .slice()
                                            .sort((a, b) => Number(new Date(a.date)) - Number(new Date(b.date)))
                                            .map((o) => {
                                                const d = dayjs(o.date);
                                                const isUnavailable = o.type !== "Available";
                                                return (
                                                    <View
                                                        key={o.override_id}
                                                        className={`rounded-2xl p-4 ${isUnavailable ? "bg-red-50" : "bg-green-50"
                                                            }`}
                                                    >
                                                        <View className="flex-row justify-between items-start">
                                                            <View className="flex-1 pr-3">
                                                                <Text className="text-base font-onest-semibold text-black/90">
                                                                    {d.format("MMM D, YYYY")}
                                                                </Text>
                                                                <Text
                                                                    className={`text-xs font-onest-medium mt-1 ${isUnavailable ? "text-red-700" : "text-green-700"
                                                                        }`}
                                                                >
                                                                    {o.type}
                                                                </Text>

                                                                {!!o.reason && (
                                                                    <Text className="text-sm text-black/60 mt-2 font-onest">
                                                                        {o.reason}
                                                                    </Text>
                                                                )}
                                                            </View>

                                                            <Pressable
                                                                onPress={() => handleDeleteOverride(o.override_id)}
                                                                disabled={uploading}
                                                                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                                            >
                                                                <Ionicons
                                                                    name="trash-outline"
                                                                    size={18}
                                                                    color="rgba(0,0,0,0.75)"
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Calendar Card */}
                        {showCalendar && (
                            <View className="bg-white rounded-2xl p-5" style={softShadow}>
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-base font-onest-semibold text-black/90">
                                        {selectedMonth.format("MMMM YYYY")}
                                    </Text>

                                    <View className="flex-row items-center gap-2">
                                        <Pressable
                                            onPress={() => setSelectedMonth((m) => m.subtract(1, "month"))}
                                            className="w-9 h-9 rounded-xl bg-black/5 items-center justify-center"
                                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                                        >
                                            <Ionicons name="chevron-back" size={18} color="rgba(0,0,0,0.75)" />
                                        </Pressable>

                                        <Pressable
                                            onPress={() => setSelectedMonth(dayjs())}
                                            className="px-3 py-2 rounded-xl bg-black/5"
                                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                                        >
                                            <Text className="text-sm font-onest-medium text-black/80">Today</Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => setSelectedMonth((m) => m.add(1, "month"))}
                                            className="w-9 h-9 rounded-xl bg-black/5 items-center justify-center"
                                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                                        >
                                            <Ionicons
                                                name="chevron-forward"
                                                size={18}
                                                color="rgba(0,0,0,0.75)"
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Day headers */}
                                <View className="flex-row">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                        <View key={d} className="flex-1 py-2">

                                            <Text className="text-center text-xs text-black/50 font-onest-medium">
                                                {d}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Grid */}
                                <View className="flex-row flex-wrap">
                                    {calendarDays.map((date, idx) => {
                                        const isCurrentMonth = date.month() === selectedMonth.month();
                                        const isToday = date.isSame(dayjs(), "day");
                                        const isPast = date.isBefore(dayjs(), "day");

                                        const available = isDayAvailable(date);
                                        const override = getOverrideForDate(date);

                                        const bg =
                                            !isCurrentMonth
                                                ? "bg-black/5"
                                                : available
                                                    ? "bg-indigo-100"
                                                    : "bg-black/5";

                                        const borderRing = isToday
                                            ? "border border-primary"
                                            : "border border-transparent";

                                        return (
                                            <Pressable
                                                key={`${date.format("YYYY-MM-DD")}-${idx}`}
                                                disabled={!isCurrentMonth || isPast || uploading}
                                                onPress={() => openAddOverride(date.toDate())}
                                                style={{
                                                    flexBasis: `${100 / 7}%`,
                                                    aspectRatio: 1,
                                                    padding: 4,
                                                    opacity: !isCurrentMonth ? 0.45 : isPast ? 0.35 : 1,
                                                }}
                                            >

                                                <View
                                                    className={`flex-1 rounded-2xl ${bg} ${borderRing} items-center justify-center`}
                                                >
                                                    <Text className="text-sm font-onest-medium text-black/80">
                                                        {date.format("D")}
                                                    </Text>

                                                    {!!override && isCurrentMonth && (
                                                        <View
                                                            style={{
                                                                position: "absolute",
                                                                bottom: 8,
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 6,
                                                                backgroundColor:
                                                                    override.type === "Available" ? "#16a34a" : "#dc2626",
                                                            }}
                                                        />
                                                    )}
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {/* Legend */}
                                <View className="flex-row flex-wrap gap-4 mt-4">
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-4 h-4 rounded bg-indigo-100" />
                                        <Text className="text-xs text-black/50 font-onest">Available</Text>
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <View className="w-4 h-4 rounded bg-black/5" />
                                        <Text className="text-xs text-black/50 font-onest">Unavailable</Text>
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <View className="w-4 h-4 rounded border border-primary" />
                                        <Text className="text-xs text-black/50 font-onest">Today</Text>
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <View
                                            style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: "#dc2626" }}
                                        />
                                        <Text className="text-xs text-black/50 font-onest">Override</Text>
                                    </View>
                                </View>

                                <Text className="text-xs text-black/40 font-onest mt-3">
                                    Tip: Tap a date to quickly add an unavailable override.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Add Override Modal */}
                <Modal
                    visible={showAddOverrideModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAddOverrideModal(false)}
                >
                    <Pressable
                        className="flex-1 bg-black/50 px-5 justify-center"
                        onPress={() => setShowAddOverrideModal(false)}
                    >
                        <Pressable
                            onPress={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-5"
                            style={softShadow}
                        >
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1 pr-3">
                                    <Text className="text-lg font-onest-semibold text-black/90">
                                        Add Unavailable Date
                                    </Text>
                                    <Text className="text-sm text-black/40 mt-1 font-onest">
                                        Block a date when you won’t be available for bookings.
                                    </Text>
                                </View>

                                <Pressable onPress={() => setShowAddOverrideModal(false)}>
                                    <Ionicons name="close" size={22} color="rgba(0,0,0,0.6)" />
                                </Pressable>
                            </View>

                            {/* Date row */}
                            <View className="mt-4">
                                <Text className="text-sm font-onest-medium text-black/70 mb-2">
                                    Date
                                </Text>

                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="rounded-2xl bg-black/5 px-4 py-3 flex-row items-center justify-between"
                                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                                >
                                    <Text className="text-base font-onest-medium text-black/85">
                                        {dayjs(overrideDate).format("MMM D, YYYY")}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={18} color="rgba(0,0,0,0.7)" />
                                </Pressable>

                                {showDatePicker && (
                                    <View className="mt-2">
                                        <DateTimePicker
                                            value={overrideDate}
                                            mode="date"
                                            display={Platform.OS === "ios" ? "inline" : "default"}
                                            minimumDate={new Date()}
                                            onChange={onDatePickerChange}
                                        />
                                        {Platform.OS === "ios" && (
                                            <Pressable
                                                onPress={() => setShowDatePicker(false)}
                                                className="mt-2 px-4 py-2 rounded-xl bg-primary self-end"
                                            >
                                                <Text className="text-white font-onest-medium">Done</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Reason */}
                            <View className="mt-4">
                                <Text className="text-sm font-onest-medium text-black/70 mb-2">
                                    Reason (Optional)
                                </Text>
                                <TextInput
                                    value={overrideReason}
                                    onChangeText={setOverrideReason}
                                    placeholder="e.g., Vacation, Personal commitment"
                                    placeholderTextColor="rgba(0,0,0,0.35)"
                                    className="rounded-2xl bg-black/5 px-4 py-3 text-base font-onest"
                                />
                            </View>

                            {/* Actions */}
                            <View className="flex-row gap-3 mt-5">
                                <Pressable
                                    onPress={() => setShowAddOverrideModal(false)}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-black/10"
                                    disabled={uploading}
                                >
                                    <Text className="text-center font-onest-medium text-black/75">
                                        Cancel
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleAddOverride}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-primary"
                                    disabled={uploading}
                                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                                >
                                    <Text className="text-center font-onest-medium text-white">
                                        {uploading ? "Saving..." : "Add"}
                                    </Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
