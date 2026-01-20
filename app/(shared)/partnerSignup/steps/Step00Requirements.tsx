// app/(auth)/steps/Step00Requirements.tsx
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { PartnerOnboardingFormData } from "../partnerOnboardingForm";

type Props = {
    formData: PartnerOnboardingFormData;
    onNext: () => void;
    onBack: () => void;
};

function SectionCard({

    title,
    subtitle,
    items,
}: {

    title: string;
    subtitle?: string;
    items: string[];
}) {
    return (
        <View
            className=" py-4 mb-4"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
            }}
        >
            <View className="flex-row items-center mb-1">

                <View className="flex-1">
                    <Text className="text-lg font-onest-semibold text-black/90">
                        {title}
                    </Text>

                </View>
            </View>

            <View className="gap-2">
                {items.map((it, idx) => (
                    <View key={`${title}-${idx}`} className="flex-row items-baseline gap-3">
                        <View className="size-2 bg-black/70 rounded-full"></View>
                        <Text className="flex-1 text-base font-onest text-black/50">
                            {it}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function Step00Requirements({ formData, onNext, onBack }: Props) {
    const [confirmed, setConfirmed] = useState(false);

    const roleLabel = formData.creator_role_label || "Partner";
    const role = formData.creator_role;

    const roleSpecificItems = useMemo(() => {
        if (role === "Guide") {
            return [
                "Tour guide license/certificate (upload for admin review).",
            ];
        }

        if (role === "Driver") {
            return [
                "Driver’s license (upload for admin review).",
                "Vehicle registration (OR/CR) (upload for admin review).",
            ];
        }

        // Creator/Experience host
        return [];
    }, [role]);

    return (
        <View className="flex-1">
            <ScrollView
                className="flex-1 px-10"
                contentContainerStyle={{ paddingBottom: 62 }}
            >
                {/* Header */}
                <View className="mt-24 mb-6">
                    <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
                        Verification requirements
                    </Text>
                    <Text className="mt-2 text-base text-black/50 font-onest">
                        Before you continue, here’s what you’ll need to submit for approval.
                    </Text>


                </View>

                {/* Cards */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 250 }}
                >
                    <SectionCard

                        title="1. Contact + profile"
                        items={[
                            "Verified phone number and email.",
                            "Complete profile: photo, legal name, service area.",
                        ]}
                    />

                    <SectionCard

                        title="2. Identity check"
                        subtitle="Used to confirm legitimacy of providers"
                        items={[
                            "Upload government ID + selfie.",
                            "Admin will check: readable, not expired, selfie matches ID.",
                        ]}
                    />

                    <SectionCard

                        title="3. Background screening"
                        subtitle="Philippines: Police Clearance should be recent"
                        items={[
                            "Upload National Police Clearance (issued within last 6 months).",
                        ]}
                    />

                    <SectionCard

                        title="4. Provider agreement"
                        items={[
                            "Follow local laws.",
                            "No prohibited activities.",
                            "Provide service as described (no bait-and-switch).",
                        ]}
                    />

                    <SectionCard

                        title="5. Role-specific add-ons"
                        subtitle={
                            role === "Creator"
                                ? "No extra documents required for this role"
                                : "Shown based on your selected role"
                        }
                        items={
                            roleSpecificItems.length
                                ? roleSpecificItems
                                : ["None required for this role."]
                        }
                    />
                </MotiView>

                {/* Confirmation */}
                <Pressable
                    onPress={() => setConfirmed((v) => !v)}
                    className="flex-row items-center mt-2"
                >
                    <View
                        className={`w-6 h-6 rounded-md items-center justify-center mr-3 ${confirmed ? "bg-primary" : "bg-black/10"
                            }`}
                    >
                        <Ionicons
                            name={confirmed ? "checkmark" : "remove"}
                            size={16}
                            color={confirmed ? "#fff" : "transparent"}
                        />
                    </View>
                    <Text className="flex-1 text-sm font-onest text-black/70">
                        I understand these requirements and I’m ready to proceed.
                    </Text>
                </Pressable>

                {/* Actions */}
                <View className="flex-row gap-3 mt-6">
                    <Pressable
                        onPress={onBack}
                        className="flex-1 rounded-xl py-4 items-center bg-gray-200"
                    >
                        <Text className="font-onest-medium text-black/80">Back</Text>
                    </Pressable>

                    <Pressable
                        onPress={onNext}
                        disabled={!confirmed}
                        className={`flex-1  py-4  px-8 rounded-xl items-center ${confirmed ? "bg-[#191313]" : "bg-black/40"
                            }`}
                    >
                        <Text className="font-onest-semibold text-white/90">Continue</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
