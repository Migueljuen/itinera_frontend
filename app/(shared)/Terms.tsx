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
            className="py-4 mb-4"
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

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-[#fff]">
            {/* Header with back button */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full  items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#191313" />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1 px-10"
                contentContainerStyle={{ paddingBottom: 62 }}
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
                            "By creating an account, accessing, or using the Platform, you agree to these Terms and any linked policies (including the Refund & Cancellation Policy).",
                            "If you do not agree, do not use the Platform.",
                        ]}
                    />

                    <SectionCard
                        title="2. What the Platform Is"
                        items={[
                            "The Platform helps connect Travelers who create itineraries and request/book services.",
                            "Creators who list Experiences (activities/places).",
                            "Guides and Drivers who provide trip services.",
                            "Admins who manage verification, itinerary payments, and policy enforcement.",
                            "Unless explicitly stated, the Platform is not a travel agency and does not directly provide Experiences or transport services.",
                            "Partners (Creators/Guides/Drivers) are responsible for delivering their services.",
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
                            "Partners may be asked for additional information for verification (e.g., ID, vehicle info, certifications, Background Checks).",
                            "Verification may reduce risk but is not a guarantee of quality or safety.",
                        ]}
                    />

                    <SectionCard
                        title="5. Bookings and Itineraries"
                        items={[
                            "An itinerary may include multiple Experiences and services.",
                            "A \"Booking\" is considered confirmed only when the payment has been acknowledged by the admin.",
                            "Time slots, price, and meeting locations are set by Partners and may change with notice.",
                        ]}
                    />

                    <SectionCard
                        title="6. Payments (Manual via GCash)"
                        items={[
                            "Important: The Platform does not process payments in-app. Payments are made manually via GCash between Traveler and the Platform Admin.",
                            "Payment Instructions: You will only pay using the official payment details shown in the Platform.",
                            "Proof of Payment: You may be required to upload/send proof of payment (screenshot/receipt reference).",
                            "Confirmation: A booking is not fully confirmed until the admin confirms receipt.",
                            "Fees: Any GCash fees or transfer charges are paid by Traveler unless stated otherwise.",
                            "Wrong Transfers / Scams: If you send money to the wrong number or a scammer, the Platform's ability to recover funds may be limited. Always verify details before sending.",
                        ]}
                    />

                    <SectionCard
                        title="7. Refunds, Cancellations, No-Shows"
                        items={[
                            "Refunds and cancellations are governed by the Refund & Cancellation Policy, which is part of these Terms.",
                        ]}
                    />

                    <SectionCard
                        title="8. User Conduct"
                        items={[
                            "You must not harass, threaten, scam, or discriminate against others.",
                            "You must not post fraudulent listings, fake reviews, or misleading booking details.",
                            "You must not attempt to bypass platform rules (e.g., manipulating proof of payment).",
                            "You must not upload illegal content.",
                        ]}
                    />

                    <SectionCard
                        title="9. Listings, Accuracy, and Partner Responsibilities"
                        items={[
                            "Partners are responsible for accurate listings (price, inclusions, schedules, safety requirements).",
                            "Partners must deliver what is promised in the listing and confirmed in booking messages.",
                        ]}
                    />

                    <SectionCard
                        title="10. Messaging and Communication"
                        items={[
                            "The Platform provides in-app messaging.",
                            "We may review messages when necessary to investigate abuse reports, prevent fraud, or comply with law.",
                        ]}
                    />

                    <SectionCard
                        title="11. User Content (Reviews, Photos, Listings)"
                        items={[
                            "You keep ownership of your content, but you grant the Platform permission to store, display, and use it to operate the Platform.",
                            "Content must be truthful and non-infringing.",
                        ]}
                    />

                    <SectionCard
                        title="12. Safety Disclaimer / Assumption of Risk"
                        items={[
                            "Travel and activities involve risks (weather, terrain, transport, third parties).",
                            "You are responsible for assessing suitability and following safety guidance.",
                        ]}
                    />

                    <SectionCard
                        title="13. Disclaimers"
                        items={[
                            "The Platform is provided \"as is\" and \"as available.\"",
                            "We do not guarantee uninterrupted service or that all listings will be error-free.",
                        ]}
                    />

                    <SectionCard
                        title="14. Limitation of Liability"
                        items={[
                            "To the fullest extent allowed by law, the Platform is not liable for indirect or consequential damages.",
                        ]}
                    />

                    <SectionCard
                        title="15. Suspension and Termination"
                        items={[
                            "We may suspend or terminate accounts for fraud, abuse, policy violations, or safety concerns.",
                        ]}
                    />

                    <SectionCard
                        title="16. Governing Law"
                        items={[
                            "These Terms are governed by the laws of the Republic of the Philippines.",
                            "Disputes will be handled in the appropriate courts, unless consumer protection laws require otherwise.",
                        ]}
                    />

                    {/* Refund & Cancellation Policy Section */}
                    <View className="mt-6 mb-4">
                        <Text className="text-2xl font-onest-semibold text-black/90 leading-tight">
                            Refund & Cancellation Policy
                        </Text>
                        <Text className="mt-2 text-base text-black/50 font-onest">
                            This policy applies to bookings arranged through the Platform where payment is made manually via GCash.
                        </Text>
                    </View>

                    <SectionCard
                        title="A. Payment Types"
                        items={[
                            "Downpayment: 50% of the total itinerary price.",
                            "Fully Paid: 100% of the total itinerary price.",
                        ]}
                    />

                    <SectionCard
                        title="B. Traveler-Initiated Cancellation"
                        items={[
                            "Each activity in your itinerary is treated as a separate booking.",
                            "Downpayment (50%): Non-refundable. If you cancel a booking, the activity is removed and no refund shall be processed.",
                            "Fully paid (100%): 50% of the cancelled activity's cost will be refunded.",
                            "Any GCash fees/transfer charges are non-refundable.",
                            "Refunds are processed back to the payer's GCash number.",
                        ]}
                    />


                    <SectionCard
                        title="C. No-Show Policy"
                        items={[
                            "If you do not arrive for a scheduled activity, it is treated as a no-show for that booking.",
                            "No-shows are not refundable, whether downpayment or fully paid.",
                        ]}
                    />

                    <SectionCard
                        title="D. Partner-Initiated Cancellation"
                        items={[
                            "If the Partner cancels a confirmed booking (except force majeure/safety), the Traveler is entitled to a full refund of amounts paid (downpayment or full).",
                        ]}
                    />

                    <SectionCard
                        title="E. Force Majeure / Safety Cancellations"
                        items={[
                            "Events outside reasonable control may include severe weather warnings, natural disasters, government restrictions, or safety risks.",
                            "Outcome: Reschedule without penalty.",
                        ]}
                    />

                    <SectionCard
                        title="F. Disputes and Evidence Window"
                        items={[
                            "If you believe a service was not delivered as agreed, report it within 48 hours of the scheduled start time.",
                            "Provide evidence (messages, photos, receipts).",
                            "The Platform may mediate but does not guarantee recovery because payments are manual/off-platform.",
                        ]}
                    />

                    {/* Contact Section */}
                    <View className="mt-4 mb-8 py-4 px-5 bg-black/5 rounded-xl">
                        <Text className="text-base font-onest-semibold text-black/90 mb-2">
                            Contact
                        </Text>
                        <Text className="text-base font-onest text-black/50">
                            For support, disputes, or policy questions:{"\n"}
                            itinera.team.app@gmail.com
                        </Text>
                    </View>
                </MotiView>
            </ScrollView>
        </View>
    );
}