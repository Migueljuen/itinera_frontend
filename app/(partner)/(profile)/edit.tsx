import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";

type FieldKey = "name" | "email" | "mobile" | "timezone" | "payout_phone";

/** ✅ Signup-like field (no FocusableField) */
function SignupField({
    label,
    value,
    onChangeText,
    inputRef,
    keyboardType,
    autoCapitalize = "sentences",
    secureTextEntry,
    rightElement,
    isLast,
}: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    inputRef?: any;
    keyboardType?: any;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    secureTextEntry?: boolean;
    rightElement?: React.ReactNode;
    isLast?: boolean;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <Pressable
            onPress={() => inputRef?.current?.focus?.()}
            className={`px-4 py-3 bg-white ${!isLast ? "border-b border-black/10" : ""}`}
        >
            <Text
                className={`font-onest text-xs ${focused ? "text-black/70" : "text-black/50"
                    }`}
            >
                {label}
            </Text>

            <View className="relative mt-1">
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="font-onest text-base text-black/90 pr-10"
                    placeholder=""
                />

                {rightElement ? (
                    <View className="absolute right-0 bottom-0">{rightElement}</View>
                ) : null}
            </View>
        </Pressable>
    );
}

export default function EditAccountFieldScreen() {
    const router = useRouter();

    const {
        field,
        value: initialValue,
        first_name: initialFirstName,
        last_name: initialLastName,
    } = useLocalSearchParams<{
        field?: FieldKey;
        value?: string;
        first_name?: string;
        last_name?: string;
    }>();

    const config = useMemo(() => {
        const map: Record<
            FieldKey,
            {
                headerTitle: string;
                sectionTitle: string;
                helper?: string;
                label?: string;
                keyboardType?: any;
                autoCapitalize?: "none" | "sentences" | "words" | "characters";
            }
        > = {
            name: {
                headerTitle: "Update name",
                sectionTitle: "Legal name",
                helper: "Ensure this matches the name on your government-issued ID.",
            },
            email: {
                headerTitle: "Update email",
                sectionTitle: "Contact info",
                label: "Email",
                helper: "Trip updates will be emailed to you.",
                keyboardType: "email-address",
                autoCapitalize: "none",
            },
            mobile: {
                headerTitle: "Update mobile number",
                sectionTitle: "Contact info",
                label: "Phone number",
                helper: "Trip updates will be emailed to you.",
                keyboardType: "phone-pad",
                autoCapitalize: "none",
            },
            timezone: {
                headerTitle: "Update timezone",
                sectionTitle: "Timezone",
                label: "Timezone",
                helper: "Example: Asia/Manila",
                autoCapitalize: "none",
            },
            payout_phone: {
                headerTitle: "Update payout ",
                sectionTitle: "Payout",
                label: "Payout phone",
                helper: "Use the number linked to your payout method.",
                keyboardType: "phone-pad",
                autoCapitalize: "none",
            },
        };

        return field && map[field] ? map[field] : null;
    }, [field]);

    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const singleRef = useRef<TextInput>(null);

    const [firstName, setFirstName] = useState((initialFirstName ?? "").trim());
    const [lastName, setLastName] = useState((initialLastName ?? "").trim());
    const [value, setValue] = useState((initialValue ?? "").trim());
    const [saving, setSaving] = useState(false);

    // fallback parse for name if first/last not passed
    React.useEffect(() => {
        if (field !== "name") return;

        const hasProvided =
            (initialFirstName && initialFirstName.trim()) ||
            (initialLastName && initialLastName.trim());
        if (hasProvided) return;

        const raw = (initialValue ?? "").trim();
        if (!raw) return;

        const parts = raw.split(" ").filter(Boolean);
        if (!firstName)
            setFirstName(parts.slice(0, -1).join(" ") || parts[0] || "");
        if (!lastName) setLastName(parts.slice(-1).join(" ") || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [field]);

    if (!config) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <Text className="font-onest text-black/70">Invalid field.</Text>
                <Pressable className="mt-4" onPress={() => router.back()}>
                    <Text className="text-primary font-onest-medium">Go back</Text>
                </Pressable>
            </View>
        );
    }

    const buildPayload = () => {
        if (!field) return null;

        if (field === "name") {
            return {
                field: "name",
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            };
        }

        if (field === "email") return { field: "email", email: value.trim() };
        if (field === "mobile") return { field: "mobile", mobile_number: value.trim() };
        if (field === "timezone") return { field: "timezone", timezone: value.trim() };
        if (field === "payout_phone") return { field: "payout_phone", payout_phone: value.trim() };

        return null;
    };

    const validate = () => {
        if (!field) return "Invalid field";

        if (field === "name") {
            if (!firstName.trim() || !lastName.trim())
                return "Please enter your first and last name.";
            return null;
        }

        if (!value.trim()) return "This field cannot be empty.";
        if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
            return "Please enter a valid email address.";

        return null;
    };

    const onSave = async () => {
        const err = validate();
        if (err) {
            Alert.alert("Invalid input", err);
            return;
        }

        const payload = buildPayload();
        if (!payload) {
            Alert.alert("Error", "Missing payload.");
            return;
        }

        try {
            setSaving(true);

            const token = await AsyncStorage.getItem("token");
            const storedUser = await AsyncStorage.getItem("user");
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;

            const userId = parsedUser?.user_id;
            if (!userId) {
                Alert.alert("Error", "User not found. Please login again.");
                return;
            }

            const res = await fetch(`${API_URL}/users/${userId}/account`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get("content-type") || "";
            const data = contentType.includes("application/json") ? await res.json() : null;

            if (!res.ok) {
                const msg = data?.message || data?.error || "Failed to update. Please try again.";
                Alert.alert("Update failed", msg);
                return;
            }

            const updatedUser = data?.user;
            if (updatedUser) {
                const merged = { ...(parsedUser || {}), ...updatedUser };
                await AsyncStorage.setItem("user", JSON.stringify(merged));
            }

            router.back();
        } catch (e: any) {
            console.error("Save account field error:", e);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="bg-[#fff] h-full">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Signup-style top bar */}
                    <View className="border-b border-gray-200 py-6">
                        <View className="px-4 flex-row items-center justify-between">
                            <Pressable onPress={() => router.back()} className="py-1 pr-4">
                                <Ionicons name="arrow-back" size={22} color="#111827" />
                            </Pressable>

                            <Text className="text-center text-xl font-onest-semibold text-black/90 flex-1">
                                {config.headerTitle}
                            </Text>

                            <View className="w-[38px]" />
                        </View>
                    </View>

                    <View className="px-10 py-12">
                        {/* Section title like signup */}
                        <Text className="text-xl font-onest-medium text-black/90">
                            {config.sectionTitle}
                        </Text>

                        {/* Grouped inputs like signup */}
                        <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
                            {field === "name" ? (
                                <>
                                    <SignupField
                                        label="First name on your ID"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        inputRef={firstNameRef}
                                    />
                                    <SignupField
                                        label="Last name on your ID"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        inputRef={lastNameRef}
                                        isLast
                                    />
                                </>
                            ) : (
                                <SignupField
                                    label={config.label ?? "Value"}
                                    value={value}
                                    onChangeText={setValue}
                                    inputRef={singleRef}
                                    keyboardType={config.keyboardType}
                                    autoCapitalize={config.autoCapitalize ?? "sentences"}
                                    isLast
                                />
                            )}
                        </View>

                        {!!config.helper && (
                            <Text className="mt-2 font-onest text-sm text-black/50">
                                {config.helper}
                            </Text>
                        )}

                        {/* Signup-like black button */}
                        <Pressable
                            onPress={onSave}
                            disabled={saving}
                            className={`py-4 rounded-md mt-8 ${saving ? "bg-black/70" : "bg-[#191313]"
                                }`}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white/90 text-center text-lg font-bold">
                                    Save
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
