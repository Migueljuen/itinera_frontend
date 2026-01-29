// app/(auth)/steps/Step00Requirements.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
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
        <View className="py-4 mb-4">
            <View className="flex-row items-center mb-1">
                <View className="flex-1">
                    <Text className="text-lg font-onest-semibold text-black/90">
                        {title}
                    </Text>

                    {subtitle ? (
                        <Text className="text-sm text-black/50 mt-0.5 font-onest">
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            </View>

            <View className="gap-2">
                {items.map((it, idx) => (
                    <View key={`${title}-${idx}`} className="flex-row items-baseline gap-3">
                        <View className="size-2 bg-black/70 rounded-full flex-shrink-0 mt-1.5" />
                        <Text className="flex-1 text-base font-onest text-black/70">
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
    const router = useRouter();

    const goToTerms = () => {
        router.push("/(shared)/Terms");
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1 px-10"
                contentContainerStyle={{ paddingBottom: 62 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mt-24 mb-6">
                    <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
                        Become our Partner
                    </Text>
                    <Text className="mt-2 text-base text-black/50 font-onest">
                        Before you continue, here's what you'll need to submit for approval.
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
                            "Complete profile: photo, legal name, short bio.",
                        ]}
                    />

                    <SectionCard
                        title="2. Identity check"
                        subtitle="Used to confirm legitimacy of Partners"
                        items={[
                            "Upload government ID + selfie.",
                            "Admin will check: readable, not expired, selfie matches ID.",
                        ]}
                    />

                    <SectionCard
                        title="3. Business permit (required)"
                        subtitle="Required to list paid experiences/services"
                        items={[
                            "Upload a valid business permit (e.g., Mayor’s/Business Permit) or other proof of legal authority to operate.",
                            "Failure to provide this may delay approval or prevent your listings from being published.",
                        ]}
                    />

                    <SectionCard
                        title="4. Registration fee & subscription"
                        subtitle="Required to activate your partner account"
                        items={[
                            "A one-time registration fee of ₱1,299 is required for new partners.",
                            "Your registration includes 1 month of basic subscription (30 days) after payment is confirmed.",
                            "After the 1 month, choose a plan to stay active:",
                            "• Basic: ~₱599/month",
                            "• Pro: ~₱999/month (includes everything in Basic, plus Pro features)",
                            "Only subscribed partners can preview their activity/listing and receive bookings from the system.",
                        ]}
                    />

                    <SectionCard
                        title="5. Partner agreement"
                        items={[
                            "Follow local laws.",
                            "No prohibited activities.",
                            "Provide experiences as described (no bait-and-switch).",
                        ]}
                    />

                    <SectionCard
                        title="6. What you can do as a Partner"
                        subtitle="Create and manage unique travel experiences"
                        items={[
                            "Design custom tours and activities.",
                            "Set your own pricing and availability.",
                            "Connect with travelers looking for authentic experiences.",
                        ]}
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

                    <Text className="flex-1 font-onest text-sm text-black/90">
                        I understand these requirements and I'm ready to proceed. By selecting
                        Agree and continue, I indicate my agreement to Itinera's{" "}
                        <Text
                            className="text-blue-500 underline font-onest-medium"
                            onPress={(e) => {
                                // prevent toggling the checkbox when clicking the link
                                e?.stopPropagation?.();
                                goToTerms();
                            }}
                        >
                            Terms of Service
                        </Text>
                        .
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
                        className={`flex-1 py-4 px-8 rounded-xl items-center ${confirmed ? "bg-[#191313]" : "bg-black/40"
                            }`}
                    >
                        <Text className="font-onest-semibold text-white/90">
                            Agree and continue
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
