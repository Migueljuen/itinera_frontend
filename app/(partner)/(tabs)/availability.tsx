
// app/(partner)/PartnerAvailability.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

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
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import API_URL from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";

dayjs.extend(isBetween);


type DayOfWeek =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";

type OverrideType = "Available" | "Unavailable";
type PartnerType = "guide" | "driver";

type PartnerProfile = {
    profile_id: number;
    availability_days: string[] | string | null;
    guide_id?: number;
    driver_id?: number;
};

type AvailabilityOverride = {
    override_id: number;
    date: string;
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

const PARTNER_CONFIG: Record<PartnerType, { label: string; description: string }> = {
    guide: {
        label: "Tour Guide",
        description: "Set when you're available for tour bookings",
    },
    driver: {
        label: "Driver",
        description: "Set when you're available for transport bookings",
    },
};

function parseAvailabilityDays(input: PartnerProfile["availability_days"]): DayOfWeek[] {
    try {
        if (!input) return [];
        if (Array.isArray(input)) return input as DayOfWeek[];
        if (typeof input === "string") return JSON.parse(input || "[]") as DayOfWeek[];
        return [];
    } catch {
        return [];
    }
}

export default function PartnerAvailability() {
    const { user, token } = useAuth();
    const [updatingDays, setUpdatingDays] = useState<Partial<Record<DayOfWeek, boolean>>>({});

    const [loading, setLoading] = useState(false);
    const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
    const [partnerType, setPartnerType] = useState<PartnerType | null>(null);

    type BookingRange = { start_date: string; end_date: string };
    const [bookings, setBookings] = useState<BookingRange[]>([]);

    const [availabilityDays, setAvailabilityDays] = useState<DayOfWeek[]>([]);
    const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
    const scheme = useColorScheme();

    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    const [showAddOverrideModal, setShowAddOverrideModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [overrideDate, setOverrideDate] = useState<Date>(new Date());
    const [overrideReason, setOverrideReason] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const config = partnerType ? PARTNER_CONFIG[partnerType] : PARTNER_CONFIG.guide;

    const getProfileId = (): number | null => {
        if (!partnerProfile) return null;
        if (partnerType === "guide") return partnerProfile.guide_id || null;
        if (partnerType === "driver") return partnerProfile.driver_id || null;
        return null;
    };

    const detectPartnerType = async (): Promise<PartnerType | null> => {
        if (!user?.user_id) return null;

        try {
            const guideRes = await axios.get(`${API_URL}/partner/profile/guide/${user.user_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (guideRes.data?.profile) {
                return "guide";
            }
        } catch {
            // Not a guide
        }

        try {
            const driverRes = await axios.get(`${API_URL}/partner/profile/driver/${user.user_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (driverRes.data?.profile) {
                return "driver";
            }
        } catch {
            // Not a driver
        }

        return null;
    };

    const fetchPartnerProfile = async () => {
        if (!user?.user_id) return;

        try {
            setLoading(true);

            let type = partnerType;
            if (!type) {
                type = await detectPartnerType();
                if (!type) {
                    toast.error("Partner profile not found.");
                    return;
                }
                setPartnerType(type);
            }

            const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
            const end = selectedMonth.endOf("month").format("YYYY-MM-DD");

            const res = await axios.get(`${API_URL}/partner/profile/${type}/${user.user_id}`, {
                params: { start, end }, // ✅ bookings window
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const profile = res.data?.profile;
            if (!profile) {
                toast.error(`${PARTNER_CONFIG[type].label} profile not found.`);
                return;
            }

            setPartnerProfile({ ...profile, profile_id: profile.guide_id || profile.driver_id });
            setAvailabilityDays(parseAvailabilityDays(profile.availability_days));
            setBookings(res.data?.bookings || []); // ✅ store bookings
        } catch (e) {
            console.error("Error fetching partner profile:", e);
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
            await Promise.all([fetchPartnerProfile(), fetchOverrides()]);
            toast.success("Refreshed");
        } catch {
            // handled above
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (user?.user_id) {
            fetchPartnerProfile();
            fetchOverrides();
        }
    }, [user?.user_id, selectedMonth]);

    const overrideDateString = useMemo(
        () => dayjs(overrideDate).format("YYYY-MM-DD"),
        [overrideDate]
    );

    const getOverrideForDate = (date: dayjs.Dayjs) => {
        return overrides.find((o) => dayjs(o.date).isSame(date, "day"));
    };

    const isBookedDay = (date: dayjs.Dayjs) => {
        return bookings.some((b) => {
            const s = dayjs(b.start_date);
            const e = dayjs(b.end_date);
            return date.isBetween(s, e, "day", "[]");
        });
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

        const startDate = startOfMonth.day(0);
        const endDate = endOfMonth.day(6);

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
        const profileId = getProfileId();
        if (!profileId || !partnerType) return;

        const prevDays = availabilityDays;

        const updatedDays = nextValue
            ? Array.from(new Set([...prevDays, day]))
            : prevDays.filter((d) => d !== day);

        setAvailabilityDays(updatedDays);

        try {
            setUpdatingDays((p) => ({ ...p, [day]: true }));

            await axios.put(
                `${API_URL}/partner/profile/${partnerType}/${profileId}/availability`,
                { availability_days: JSON.stringify(updatedDays) },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (e) {
            setAvailabilityDays(prevDays);
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

    return (
        <SafeAreaView className="flex-1 bg-[#fff]">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View className="p-6 ">
                    <View className="flex-row justify-between items-baseline ">
                        <Text className="text-3xl font-onest-semibold text-black/90">
                            Availability
                        </Text>
                        <Pressable
                            onPress={refreshAll}
                            disabled={loading || uploading}
                            className="bg-gray-100 p-3 rounded-full"
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#1f2937" />
                            ) : (
                                <Ionicons name="refresh-outline" size={20} color="#1f2937" />
                            )}
                        </Pressable>
                    </View>
                    <Text className="text-black/40 font-onest">
                        {weeklyEnabledCount} weekly days • {upcomingBlockedCount} blocked dates
                    </Text>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Calendar Section */}
                    <View className="mt-12">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-2xl text-onest text-black/90">
                                {selectedMonth.format("MMMM YYYY")}
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <Pressable
                                    onPress={() => setSelectedMonth((m) => m.subtract(1, "month"))}
                                    className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                                >
                                    <Ionicons name="chevron-back" size={18} color="#374151" />
                                </Pressable>
                                <Pressable
                                    onPress={() => setSelectedMonth(dayjs())}
                                    className="px-3 py-2 rounded-full bg-gray-100"
                                >
                                    <Text className="text-xs font-onest text-black/70">Today</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setSelectedMonth((m) => m.add(1, "month"))}
                                    className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                                >
                                    <Ionicons name="chevron-forward" size={18} color="#374151" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Day headers */}
                        <View className="flex-row mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <View key={d} className="flex-1">
                                    <Text className="text-center text-xs text-black/40 font-onest">
                                        {d}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View className="flex-row flex-wrap">
                            {calendarDays.map((date, idx) => {
                                const isCurrentMonth = date.month() === selectedMonth.month();
                                const isToday = date.isSame(dayjs(), "day");
                                const isPast = date.isBefore(dayjs(), "day");

                                const available = isDayAvailable(date);
                                const override = getOverrideForDate(date);
                                const booked = isBookedDay(date);

                                const bgColor = !isCurrentMonth
                                    ? "bg-transparent"
                                    : booked
                                        ? "bg-amber-100"
                                        : available
                                            ? "bg-green-100"
                                            : "bg-gray-100";

                                const borderStyle = isToday ? "border border-primary" : "";

                                return (
                                    <Pressable
                                        key={`${date.format("YYYY-MM-DD")}-${idx}`}
                                        disabled={!isCurrentMonth || isPast || uploading || booked}

                                        onPress={() => openAddOverride(date.toDate())}
                                        style={{
                                            flexBasis: `${100 / 7}%`,
                                            aspectRatio: 1,
                                            padding: 2,
                                            opacity: !isCurrentMonth ? 0.3 : isPast ? 0.4 : 1,
                                        }}
                                    >
                                        <View
                                            className={`flex-1 rounded-xl ${bgColor} ${borderStyle} items-center justify-center`}
                                        >
                                            <Text
                                                className={`text-xs font-onest ${isCurrentMonth ? "text-black/80" : "text-black/30"}`}
                                            >
                                                {date.format("D")}
                                            </Text>
                                            {override && isCurrentMonth && (
                                                <View
                                                    className="absolute bottom-1"
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor:
                                                            override.type === "Available" ? "#059669" : "#DC2626",
                                                    }}
                                                />
                                            )}
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Legend */}
                        <View className="flex-row flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                            <View className="flex-row items-center gap-2">
                                <View className="w-3 h-3 rounded bg-green-100" />
                                <Text className="text-xs text-black/50 font-onest">Available</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <View className="w-3 h-3 rounded bg-amber-100" />
                                <Text className="text-xs text-black/50 font-onest">Booked</Text>
                            </View>

                            <View className="flex-row items-center gap-2">
                                <View className="w-3 h-3 rounded bg-gray-100" />
                                <Text className="text-xs text-black/50 font-onest">Unavailable</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <View className="w-3 h-3 rounded border border-primary" />
                                <Text className="text-xs text-black/50 font-onest">Today</Text>
                            </View>
                        </View>

                        <Text className="text-xs text-black/40 font-onest mt-3">
                            Tap a date to add a blocked date
                        </Text>
                    </View>

                    {/* Special Dates Section */}
                    <View className="mt-16">
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                                    <Ionicons name="calendar-outline" size={20} color="#DC2626" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-2xl text-onest text-black/90">Blocked Dates</Text>
                                    <Text className="text-xs text-black/50 font-onest mt-0.5">
                                        Specific dates you won't be available
                                    </Text>
                                </View>
                            </View>
                            <Pressable onPress={() => openAddOverride(new Date())}>
                                <Text className="text-sm font-onest text-primary">Add date</Text>
                            </Pressable>
                        </View>

                        {overrides.length === 0 ? (
                            <View className="items-center py-8">
                                <Ionicons name="calendar-clear-outline" size={40} color="#D1D5DB" />
                                <Text className="text-black/50 font-onest mt-3">No blocked dates</Text>
                                <Text className="text-black/40 font-onest text-xs mt-1">
                                    Add dates when you're unavailable
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {overrides
                                    .slice()
                                    .sort((a, b) => Number(new Date(a.date)) - Number(new Date(b.date)))
                                    .map((o, index) => {
                                        const d = dayjs(o.date);
                                        const isUnavailable = o.type !== "Available";
                                        return (
                                            <View key={o.override_id}>
                                                <View className="flex-row items-center py-3">

                                                    <View className="flex-1">
                                                        <Text className="text-sm font-onest text-black/90">
                                                            {d.format("MMM D, YYYY")}
                                                        </Text>
                                                        {o.reason && (
                                                            <Text className="text-xs text-black/50 font-onest mt-0.5">
                                                                {o.reason}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <Pressable
                                                        onPress={() => handleDeleteOverride(o.override_id)}
                                                        disabled={uploading}
                                                        className="p-2"
                                                    >
                                                        <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                                                    </Pressable>
                                                </View>
                                                {index < overrides.length - 1 && (
                                                    <View className="border-t border-gray-100" />
                                                )}
                                            </View>
                                        );
                                    })}
                            </View>
                        )}
                    </View>
                    {/* Weekly Availability Section */}
                    <View className="mt-16">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                                <Ionicons name="time-outline" size={20} color="#374151" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-2xl text-onest text-black/90">Weekly Schedule</Text>
                                <Text className="text-xs text-black/50 font-onest mt-0.5">
                                    Toggle the days you're generally available
                                </Text>
                            </View>
                        </View>

                        {loading ? (
                            <Text className="text-black/50 font-onest">Loading...</Text>
                        ) : (
                            <View>
                                {DAYS_OF_WEEK.map((day, index) => {
                                    const active = availabilityDays.includes(day);
                                    return (
                                        <View key={day}>
                                            <View className="flex-row items-center justify-between py-3">
                                                <Text
                                                    className={`text-sm font-onest ${active ? "text-black/90" : "text-black/40"}`}
                                                >
                                                    {day}
                                                </Text>
                                                <Switch
                                                    value={active}
                                                    trackColor={{ false: "#E5E7EB", true: "#1f2937" }}
                                                    onValueChange={(next) => toggleWeeklyDay(day, next)}
                                                    disabled={!!updatingDays[day] || !getProfileId()}
                                                />
                                            </View>
                                            {index < DAYS_OF_WEEK.length - 1 && (
                                                <View className="border-t border-gray-100" />
                                            )}
                                        </View>
                                    );
                                })}
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
                        className="flex-1 bg-black/50 px-6 justify-center"
                        onPress={() => setShowAddOverrideModal(false)}
                    >
                        <Pressable
                            onPress={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6"
                        >
                            <View className="flex-row justify-between items-start mb-6">
                                <View className="flex-1 pr-3">
                                    <Text className="text-xl text-onest text-black/90">
                                        Add Blocked Date
                                    </Text>
                                    <Text className="text-sm text-black/50 mt-1 font-onest">
                                        Block a date when you won't be available
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => setShowAddOverrideModal(false)}
                                    className="p-1"
                                >
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </Pressable>
                            </View>

                            {/* Date picker */}
                            <View className="mb-4">
                                <Text className="text-sm font-onest text-black/70 mb-2">Date</Text>
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="rounded-xl bg-gray-100 px-4 py-3 flex-row items-center justify-between"
                                >
                                    <Text className="text-sm font-onest text-black/90">
                                        {dayjs(overrideDate).format("MMM D, YYYY")}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                                </Pressable>

                                {showDatePicker && (
                                    <View className="mt-2">
                                        <DateTimePicker
                                            value={overrideDate}
                                            mode="date"
                                            display={Platform.OS === "ios" ? "inline" : "default"}
                                            minimumDate={new Date()}
                                            onChange={onDatePickerChange}
                                            // ✅ key fixes:
                                            themeVariant="light"                 // iOS/Android (where supported)
                                            textColor="#111827"                  // iOS only
                                            style={{ backgroundColor: "#FFFFFF" }} // helps if picker background is transparent
                                        />
                                        {Platform.OS === "ios" && (
                                            <Pressable onPress={() => setShowDatePicker(false)} className="mt-2 self-end">
                                                <Text className="text-sm font-onest text-primary">Done</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Reason */}
                            <View className="mb-6">
                                <Text className="text-sm font-onest text-black/70 mb-2">
                                    Reason (Optional)
                                </Text>
                                <TextInput
                                    value={overrideReason}
                                    onChangeText={setOverrideReason}
                                    placeholder="e.g., Vacation, Personal commitment"
                                    placeholderTextColor="#9CA3AF"
                                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-onest text-black/90"
                                />
                            </View>

                            {/* Actions */}
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={() => setShowAddOverrideModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100"
                                    disabled={uploading}
                                >
                                    <Text className="text-center font-onest text-black/70">Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleAddOverride}
                                    className="flex-1 py-3 rounded-xl bg-gray-900"
                                    disabled={uploading}
                                >
                                    <Text className="text-center font-onest text-white">
                                        {uploading ? "Adding..." : "Add Date"}
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