// app/(auth)/TermsOfServiceScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

function SectionCard({
    title,
    items,
}: {
    title: string;
    items: string[];
}) {
    return (
        <View
            className="py-4 mb-4 rounded-2xl "
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
                    <View
                        key={`${title}-${idx}`}
                        className="flex-row items-baseline gap-3"
                    >
                        <View className="size-2 bg-black/70 rounded-full mt-1.5" />
                        <Text className="flex-1 text-base font-onest text-black/50">
                            {it}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-[#fff]">
            {/* Header with back button */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#191313" />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1 px-10"
                contentContainerStyle={{ paddingBottom: 62 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
                        Terms of Service
                    </Text>
                    <Text className="mt-2 text-base text-black/50 font-onest">
                        Effective Date: January 24, 2026
                    </Text>
                    <Text className="mt-1 text-sm text-black/40 font-onest">
                        Contact: itinera.team.app@gmail.com
                    </Text>
                </View>

                {/* Content */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 250 }}
                >
                    <SectionCard
                        title="1. Acceptance of Terms"
                        items={[
                            "By creating an account, accessing, or using the Platform, you agree to these Terms and any linked policies.",
                            "If you do not agree, do not use the Platform.",
                        ]}
                    />

                    <SectionCard
                        title="2. What the Platform Is"
                        items={[
                            "The Platform helps connect Travelers who create itineraries and book Experiences/services from Partners.",
                            "Partners may include Experience Creators (activity publishers), Guides, and Drivers.",
                            "The Platform provides discovery, itinerary planning tools, booking coordination, and account/verification workflows.",
                            "Unless explicitly stated, the Platform is not a travel agency and does not directly provide Experiences, tours, guiding, or transport services.",
                            "Partners are responsible for delivering the services they list and offer.",
                        ]}
                    />

                    <SectionCard
                        title="3. Eligibility and Accounts"
                        items={[
                            "You agree to provide accurate information and keep your login secure.",
                            "You are responsible for all activity under your account.",
                        ]}
                    />

                    <SectionCard
                        title="4. Roles and Partner Verification"
                        items={[
                            "Partners may be asked for additional information for verification (e.g., government-issued ID, certifications, vehicle information).",
                            "Partners offering paid Experiences or services may be required to submit a valid business permit or proof of legal authority to operate, in accordance with applicable local laws.",
                            "Failure to provide required documents may result in delayed approval, listing removal, or account suspension.",
                            "Verification may reduce risk but is not a guarantee of quality or safety.",
                        ]}
                    />

                    <SectionCard
                        title="5. Partner Registration Fee and Subscription Requirement"
                        items={[
                            "New Partners are required to pay a one-time registration fee to activate their Partner account.",
                            "Registration fee: ₱1,299 (one-time).",
                            "The registration fee includes one (1) month of basic subscription access starting from activation.",
                            "After the 1 month: Basic subscription is ₱599/month and Pro subscription is ₱999/month.",
                            "Only subscribed Partners can preview their activity/listing as it appears to Travelers and receive bookings through the Platform.",
                            "If a Partner’s subscription ends, their ability to receive bookings and certain Partner features may be restricted until subscription is renewed.",
                            "Subscription tiers, inclusions, and pricing may be updated with notice on the Platform.",
                        ]}
                    />

                    <SectionCard
                        title="6. Bookings and Itineraries"
                        items={[
                            "An itinerary may include multiple Experiences and services; each booked Experience/service is treated as a separate booking.",
                            'A booking may be "Pending" (awaiting required payment) or "Confirmed" (ready/secured).',
                            "If an Experience requires payment, the booking remains Pending until payment is completed and acknowledged in the Platform.",
                            "Time slots, price, inclusions, meeting points, and policies are set by Partners and may change with notice (changes will not apply retroactively to already-confirmed bookings unless required for safety/legal reasons).",
                            "Availability and capacity limits apply per time slot/date. Attempts to book beyond capacity may be rejected or cancelled.",
                        ]}
                    />

                    <SectionCard
                        title="7. Payments and Fees"
                        items={[
                            "Payments are handled directly per booking and are not processed by the Platform unless explicitly stated in-product.",
                            "The Platform does not charge Travelers a platform commission per booking. The Platform earns through Partner registration and subscription fees.",
                            "Partners are responsible for setting the price of their Experiences/services and for communicating any additional requirements clearly (where applicable).",
                        ]}
                    />

                    <SectionCard
                        title="8. Disputes, Cancellations, and Service Issues"
                        items={[
                            "Cancellations, reschedules, no-shows, and refund eligibility (if any) are determined by the Partner’s stated booking policy and any applicable consumer protection laws.",
                            "If you believe a service was not delivered as agreed, report the issue within a reasonable time and provide relevant evidence (messages, photos, receipts).",
                            "The Platform may assist with communication or mediation, but outcomes may depend on the Partner’s policies and the payment method used.",
                            "Force majeure and safety-related disruptions (e.g., severe weather, government restrictions) may require rescheduling or cancellation for safety.",
                        ]}
                    />

                    <SectionCard
                        title="9. User Conduct"
                        items={[
                            "You must not harass, threaten, scam, or discriminate against others.",
                            "You must not post fraudulent listings, fake reviews, or misleading booking details.",
                            "You must not attempt to bypass platform rules or abuse booking/availability systems.",
                            "You must not upload illegal, harmful, or infringing content.",
                        ]}
                    />

                    <SectionCard
                        title="10. Listings, Accuracy, and Partner Responsibilities"
                        items={[
                            "Partners are responsible for accurate listings (price, inclusions, schedules, safety requirements, and any restrictions).",
                            "Partners must deliver what is promised in the listing and confirmed in booking messages.",
                            "Partners must comply with applicable laws and regulations relevant to their services.",
                        ]}
                    />

                    <SectionCard
                        title="11. Messaging and Communication"
                        items={[
                            "The Platform may provide in-app messaging for coordination.",
                            "We may review messages when necessary to investigate abuse reports, prevent fraud, ensure safety, or comply with law.",
                        ]}
                    />

                    <SectionCard
                        title="12. User Content (Reviews, Photos, Listings)"
                        items={[
                            "You keep ownership of your content, but you grant the Platform permission to store, display, and use it to operate and improve the Platform.",
                            "Content must be truthful, lawful, and non-infringing.",
                        ]}
                    />

                    <SectionCard
                        title="13. Safety Disclaimer / Assumption of Risk"
                        items={[
                            "Travel and activities involve risks (weather, terrain, transport, third parties).",
                            "You are responsible for assessing suitability and following safety guidance and local rules.",
                        ]}
                    />

                    <SectionCard
                        title="14. Disclaimers"
                        items={[
                            'The Platform is provided "as is" and "as available."',
                            "We do not guarantee uninterrupted service or that all listings will be error-free.",
                            "We do not guarantee outcomes of bookings, Partner performance, or Traveler satisfaction.",
                        ]}
                    />

                    <SectionCard
                        title="15. Limitation of Liability"
                        items={[
                            "To the fullest extent allowed by law, the Platform is not liable for indirect, incidental, or consequential damages.",
                            "To the extent permitted by law, any liability related to the Platform is limited to amounts paid to the Platform for registration/subscription (if any) within a reasonable period.",
                        ]}
                    />

                    <SectionCard
                        title="16. Suspension and Termination"
                        items={[
                            "We may suspend or terminate accounts for fraud, abuse, policy violations, repeated cancellations, safety concerns, or misuse of the Platform.",
                            "We may restrict Partner visibility or booking access for non-compliance, expired subscription, or verification failures.",
                        ]}
                    />

                    <SectionCard
                        title="17. Governing Law"
                        items={[
                            "These Terms are governed by the laws of the Republic of the Philippines.",
                            "Disputes will be handled in the appropriate courts, unless consumer protection laws require otherwise.",
                        ]}
                    />

                    {/* Contact Section */}
                    <View className="mt-4 mb-8 py-4 px-5 bg-black/5 rounded-xl">
                        <Text className="text-base font-onest-semibold text-black/90 mb-2">
                            Contact
                        </Text>
                        <Text className="text-base font-onest text-black/50 whitespace-pre-line">
                            For support, disputes, or policy questions:{"\n"}
                            itinera.team.app@gmail.com
                        </Text>
                    </View>
                </MotiView>
            </ScrollView>
        </View>
    );
}
