import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import API_URL from "../../../constants/api";
import { useAuth } from "../../../contexts/AuthContext";

type AccountUser = {
    user_id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_number?: string;
    profile_pic?: string;
    selfie_document?: string;
    role?: string;
    status?: string;
    created_at?: string;
    timezone?: string;
};

const AccountSettingsScreen = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [account, setAccount] = useState<AccountUser>({
        user_id: user?.user_id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
    });

    const shadowStyle = {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    };

    const cardStyle = "rounded-2xl";
    const sectionTitleStyle = "text-xl font-onest-semibold text-gray-800";

    const getFormattedFileUrl = useCallback((path?: string) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        const normalized = path.startsWith("/") ? path : `/${path}`;
        return `${API_URL}${normalized}`;
    }, []);

    const openUrl = async (url: string) => {
        const can = await Linking.canOpenURL(url);
        if (!can) {
            Alert.alert("Can't open link", "This file/link cannot be opened on your device.");
            return;
        }
        Linking.openURL(url);
    };

    const fetchAccount = useCallback(async () => {
        try {
            setLoading(true);

            let userId = user?.user_id;

            if (!userId) {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        userId = parsed.user_id;
                    } catch { }
                }
            }

            if (!userId) {
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem("token");

            const tryFetch = async (url: string) => {
                const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                return res;
            };

            let res = await tryFetch(`${API_URL}/users/${userId}`);
            if (!res.ok) res = await tryFetch(`${API_URL}/user/${userId}`);

            if (!res.ok) {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setAccount((prev) => ({ ...prev, ...parsed }));
                }
                return;
            }

            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await res.text();
                console.log("Non-JSON response (account-settings):", text.slice(0, 200));
                return;
            }

            const data = await res.json();
            const fetchedUser: AccountUser = data?.user ?? data?.data?.user ?? data?.data ?? data;

            setAccount((prev) => ({ ...prev, ...fetchedUser }));

            const storedUser = await AsyncStorage.getItem("user");
            const parsedStored = storedUser ? JSON.parse(storedUser) : {};
            await AsyncStorage.setItem("user", JSON.stringify({ ...parsedStored, ...fetchedUser }));
        } catch (e) {
            console.error("Error fetching account settings:", e);
        } finally {
            setLoading(false);
        }
    }, [user?.user_id]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchAccount();
        } finally {
            setRefreshing(false);
        }
    };

    const fullName = useMemo(() => {
        const fn = account.first_name || "";
        const ln = account.last_name || "";
        const name = `${fn} ${ln}`.trim();
        return name || "—";
    }, [account.first_name, account.last_name]);

    type EditField = "name" | "email" | "mobile" | "timezone" | "payout_phone";

    const onEditField = (field: EditField, currentValue?: string | number | null) => {
        if (field === "name") {
            router.push({
                pathname: "/(guide)/(profile)/edit",
                params: {
                    field: "name",
                    first_name: account.first_name ?? "",
                    last_name: account.last_name ?? "",
                },
            });
            return;
        }

        router.push({
            pathname: "/(guide)/(profile)/edit",
            params: {
                field,
                value: currentValue ? String(currentValue) : "",
            },
        });
    };



    const SettingRow = ({
        icon,
        label,
        value,
        onPress,
        showChevron = false,
        showLabel = false,
    }: {
        icon: any;
        label: string;
        value?: string | number | null;
        onPress?: () => void;
        showChevron?: boolean;
        showLabel?: boolean;
    }) => {
        const RowWrap: any = onPress ? TouchableOpacity : View;

        return (
            <RowWrap
                onPress={onPress}
                activeOpacity={0.8}
                className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100 last:border-b-0"
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3">
                        <Ionicons name={icon} size={20} color="#374151" />
                    </View>

                    <View className="flex-1">
                        {showLabel ? (
                            <Text className="font-onest-medium text-gray-800">{label}</Text>
                        ) : null}

                        <Text
                            className={
                                showLabel
                                    ? "text-xs text-gray-500 font-onest mt-1"
                                    : "text-sm text-gray-800 font-onest"
                            }
                        >
                            {value !== undefined && value !== null && String(value).trim() !== ""
                                ? String(value)
                                : "—"}
                        </Text>
                    </View>
                </View>

                {showChevron ? <Ionicons name="chevron-forward" size={18} color="#9CA3AF" /> : null}
            </RowWrap>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#fff]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#1f2937"]}
                        tintColor={"#1f2937"}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="py-6 px-4">
                    <View className="flex-row justify-between items-center mb-6">
                        <Pressable className="flex flex-row items-baseline" onPress={() => router.back()}>
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color="#1f1f1f"
                                style={{ marginRight: 12 }}
                            />
                            <View>
                                <Text className="text-3xl font-onest-semibold text-gray-800">
                                    Account settings
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Account Info */}
                <View className="mb-6">
                    <View className={`${cardStyle} mx-4 overflow-hidden`} style={shadowStyle}>
                        <SettingRow
                            icon="person-circle-outline"
                            label="Full Name"
                            value={fullName}
                            onPress={() => onEditField("name", fullName)}
                            showChevron
                        />
                        <SettingRow
                            icon="mail-outline"
                            label="Email"
                            value={account.email}
                            onPress={() => onEditField("email", account.email)}
                            showChevron
                        />
                        <SettingRow
                            icon="call-outline"
                            label="Mobile Number"
                            value={account.mobile_number}
                            onPress={() => onEditField("mobile", account.mobile_number)}
                            showChevron
                        />

                    </View>
                </View>

                {/* Status ONLY (keep label only for status) */}
                {account.status ? (
                    <View className="mb-6">
                        <View className={`${cardStyle} mx-4 overflow-hidden`} style={shadowStyle}>
                            <SettingRow
                                icon="shield-checkmark-outline"
                                label="Status"
                                value={account.status}
                                showLabel
                                onPress={() => { }}
                                showChevron={false}
                            />
                        </View>
                    </View>
                ) : null}

                {/* Payout */}
                <View className="mb-6">
                    <Text className={`px-6 ${sectionTitleStyle} mb-4`}>Payout <Text className="text-black/50 font-onest text-sm">(GCash)</Text></Text>
                    <View className={`${cardStyle} mx-4 overflow-hidden`} style={shadowStyle}>
                        <SettingRow
                            icon="wallet-outline"
                            label="Payout Phone"
                            value={account.mobile_number}
                            onPress={() => onEditField("payout_phone", account.mobile_number)}
                            showChevron
                        />
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default AccountSettingsScreen;
