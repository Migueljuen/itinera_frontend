// app/(auth)/steps/Step04ReviewSubmit.tsx
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

import type { PartnerOnboardingFormData } from "../partnerOnboardingForm";

type Props = {
  formData: PartnerOnboardingFormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
};

export default function Step04ReviewSubmit({
  formData,
  onSubmit,
  onBack,
  isSubmitting = false,
}: Props) {
  const logo = useMemo(
    () => require("../../../../assets/images/logo.png"),
    []
  );

  const getCategoryName = (id: number | null) => {
    const categories: Record<number, string> = {
      1: "Art and design",
      2: "Fitness and wellness",
      3: "Food and drink",
      4: "History and culture",
      5: "Nature and outdoors",
    };
    if (!id) return "—";
    return categories[id] || "—";
  };

  const renderRoleSummary = () => {
    const role = formData.creator_role;

    if (role === "Guide") {
      return (
        <View className="gap-3">
          <Row label="Role" value="Tour Guide" />
          <Row label="Expertise" value={getCategoryName(formData.expertise_category_id)} />
          <Row
            label="Languages"
            value={formData.languages?.length ? formData.languages.join(", ") : "—"}
          />
          <Row label="Service Areas" value={formData.areas_covered || "—"} />
          <Row
            label="Experience"
            value={
              formData.experience_years
                ? `${formData.experience_years} year${formData.experience_years !== 1 ? "s" : ""
                }`
                : "—"
            }
          />
          <Row
            label="Availability"
            value={
              formData.guide_availability_days?.length
                ? formData.guide_availability_days.join(", ")
                : "—"
            }
          />
        </View>
      );
    }

    if (role === "Driver") {
      return (
        <View className="gap-3">
          <Row label="Role" value="Transport Provider" />
          <Row label="Service Area" value={formData.service_area || "—"} />
          <Row label="Multi-day Service" value={formData.is_multi_day ? "Yes" : "No"} />
          <Row
            label="Availability"
            value={
              formData.driver_availability_days?.length
                ? formData.driver_availability_days.join(", ")
                : "—"
            }
          />
        </View>
      );
    }

    if (role === "Creator") {
      return (
        <Text className="text-sm text-black/60">
          You can start creating experiences after your account is approved.
        </Text>
      );
    }

    return null;
  };

  const Dot = () => <View className="w-2 h-2 rounded-full bg-green-500" />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="px-10" contentContainerStyle={{ paddingBottom: 28 }}>

        {/* main */}
        <View className="mt-24">
          <Text className="text-3xl font-onest-semibold text-black/90">
            Review & Submit
          </Text>
          <Text className="mt-2 text-base text-black/60">
            Please review your details before submitting your partner
            application.
          </Text>

          <View className="mt-6 gap-4">
            {/* Personal Information */}
            <Card title="Personal Information">
              <View className="gap-3">
                <Row
                  label="Full Name"
                  value={`${formData.first_name || ""} ${formData.last_name || ""}`.trim() || "—"}
                />
                <Row label="Email" value={formData.email || "—"} />
                <Row label="Mobile Number" value={formData.mobile_number || "—"} />
                <Row label="Short description" value={formData.short_description || "—"} />
              </View>
            </Card>

            {/* Verification Documents */}
            <Card title="Verification Documents">
              <View className="gap-2">
                {formData.profile_pic && (
                  <View className="flex-row items-center gap-2">
                    <Dot />
                    <Text className="text-sm text-black/60 font-onest">
                      Profile Picture
                    </Text>
                  </View>
                )}
                {formData.id_document && (
                  <View className="flex-row items-center gap-2">
                    <Dot />
                    <Text className="text-sm text-black/60 font-onest">
                      Government ID
                    </Text>
                  </View>
                )}
                {formData.license_document && (
                  <View className="flex-row items-center gap-2">
                    <Dot />
                    <Text className="text-sm text-black/60 font-onest">
                      Driver&apos;s License
                    </Text>
                  </View>
                )}

                {!formData.profile_pic &&
                  !formData.id_document &&
                  !formData.license_document && (
                    <Text className="text-sm text-black/45 font-onest">
                      No documents uploaded
                    </Text>
                  )}
              </View>
            </Card>

            {/* Role-specific */}
            <Card title="Other Details">{renderRoleSummary()}</Card>

            {/* Notice */}
            <View className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
              <Text className="text-sm text-blue-900">
                <Text className="font-onest-semibold">Note:</Text> Your
                application will be reviewed by our team. You&apos;ll receive an
                email notification once your account is approved, typically
                within 1–3 business days.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between mt-10">
            <Pressable
              onPress={onBack}
              disabled={isSubmitting}
              className={[
                "px-6 py-3 rounded-xl",
                isSubmitting ? "bg-black/10 opacity-50" : "bg-black/10",
              ].join(" ")}
            >
              <Text className="text-black/70 font-onest-medium">Back</Text>
            </Pressable>

            <Pressable
              onPress={onSubmit}
              disabled={isSubmitting}
              className={[
                "px-6 py-3 rounded-xl bg-black flex-row items-center gap-2",
                isSubmitting ? "opacity-60" : "opacity-100",
              ].join(" ")}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text className="text-white font-onest-medium">
                    Submitting...
                  </Text>
                </>
              ) : (
                <Text className="text-white font-onest-medium">
                  Submit Application
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** --- Small UI helpers --- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className=" rounded-2xl py-4">
      <Text className="text-base font-onest-semibold text-black/90 mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-black/60 font-onest">{label}:</Text>
      <Text className="text-sm text-black/90 font-onest-medium flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  subtitle,
  strong,
}: {
  icon: string;
  title: string;
  subtitle: string;
  strong: string;
}) {
  return (
    <View className="flex-row gap-3 items-start">
      <View className="w-10 h-10 rounded-xl border border-black/10 items-center justify-center bg-white">
        <Text className="text-lg">{icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-onest-semibold text-black/90">
          {title}
        </Text>
        <Text className="text-sm text-black/60 mt-0.5">{subtitle}</Text>
        <Text className="text-sm font-onest-semibold text-black/80 mt-2">
          {strong}
        </Text>
      </View>
    </View>
  );
}
