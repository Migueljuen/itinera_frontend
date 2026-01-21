// app/(auth)/steps/Step04ReviewSubmit.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const shadowStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

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

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-black/60 font-onest">{label}</Text>
      <Text className="text-sm text-black/90 font-onest-medium flex-1 text-right">
        {value}
      </Text>
    </View>
  );

  const Dot = () => <View className="w-2 h-2 rounded-full bg-blue-500" />;

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View className="rounded-2xl py-4">
      <Text className="text-base font-onest-semibold text-black/90 mb-4">
        {title}
      </Text>
      {children}
    </View>
  );

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
        <Text className="text-sm text-black/60 font-onest">
          You can start listing activities after your account is approved.
        </Text>
      );
    }

    return null;
  };

  const renderVehicleSummary = () => {
    if (formData.creator_role !== "Driver") return null;

    const hasVehicle =
      !!formData.vehicle_plate_number?.trim() ||
      !!formData.vehicle_type?.trim() ||
      !!formData.or_cr_document?.uri ||
      (formData.vehicle_photos?.length || 0) > 0;

    if (!hasVehicle) return null;

    return (
      <Section title="Vehicle Information">
        <View className="gap-3">
          <Row label="Plate Number" value={formData.vehicle_plate_number || "—"} />
          <Row label="Vehicle Type" value={formData.vehicle_type || "—"} />
          <Row label="Brand" value={formData.vehicle_brand || "—"} />
          <Row label="Model" value={formData.vehicle_model || "—"} />
          <Row label="Year" value={formData.vehicle_year || "—"} />
          <Row label="Color" value={formData.vehicle_color || "—"} />
          <Row
            label="Passenger Capacity"
            value={formData.vehicle_passenger_capacity || "—"}
          />
          <Row
            label="Price per day"
            value={
              formData.vehicle_price_per_day
                ? `₱${Number(formData.vehicle_price_per_day || 0).toFixed(2)}`
                : "—"
            }
          />
        </View>

        <View className="mt-4 gap-2">
          {/* OR/CR */}
          {!!formData.or_cr_document?.uri && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">OR/CR Document</Text>
            </View>
          )}

          {/* Photos */}
          {!!formData.vehicle_photos?.length && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">
                Vehicle Photos ({formData.vehicle_photos.length})
              </Text>
            </View>
          )}

          {!formData.or_cr_document?.uri && !formData.vehicle_photos?.length ? (
            <Text className="text-sm text-black/45 font-onest">
              No vehicle files uploaded
            </Text>
          ) : null}
        </View>
      </Section>
    );
  };

  const renderVerificationSummary = () => {
    const hasAny =
      !!formData.profile_pic ||
      !!formData.id_document ||
      !!formData.selfie_document ||
      !!formData.license_document ||
      !!formData.guide_certificate_document;

    return (
      <Section title="Verification Documents">
        <View className="gap-2">
          {formData.profile_pic && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">Profile Picture</Text>
            </View>
          )}

          {formData.selfie_document && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">Selfie Verification</Text>
            </View>
          )}

          {formData.id_document && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">Government ID</Text>
            </View>
          )}

          {formData.creator_role === "Driver" && formData.license_document && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">Driver&apos;s License</Text>
            </View>
          )}

          {formData.creator_role === "Guide" && formData.guide_certificate_document && (
            <View className="flex-row items-center gap-2">
              <Dot />
              <Text className="text-sm text-black/60 font-onest">
                Tour Guide Certificate / License
              </Text>
            </View>
          )}

          {!hasAny && (
            <Text className="text-sm text-black/45 font-onest">No documents uploaded</Text>
          )}
        </View>
      </Section>
    );
  };

  return (
    <SafeAreaView className="bg-[#fff] h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-10"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mt-12">
            <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
              Review your details before submitting your application.
            </Text>
          </View>

          <View className="py-12 ">
            <Section title="Personal Information" >
              <View className="gap-3">
                <Row
                  label="Full Name"
                  value={
                    `${formData.first_name || ""} ${formData.last_name || ""}`.trim() ||
                    "—"
                  }
                />
                <Row label="Email" value={formData.email || "—"} />
                <Row label="Mobile Number" value={formData.mobile_number || "—"} />
                <Row label="Bio" value={formData.short_description || "—"} />
              </View>
            </Section>

            {renderVerificationSummary()}

            <Section title="Other Details">{renderRoleSummary()}</Section>

            {/* Driver Vehicle Summary (only for Driver, only if data exists) */}
            {renderVehicleSummary()}

            <View style={shadowStyle} className="mt-6 p-4 rounded-2xl ">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#3B82F6"
                />
                <Text className="text-sm text-gray-700 font-onest ml-2 flex-1">
                  <Text className="font-onest-semibold">Note:</Text> Your application will be reviewed by our team. You&apos;ll receive an
                  email notification once your account is approved.
                </Text>
              </View>
            </View>

            <Text className="mt-8 font-onest text-sm text-black/50">
              By selecting Agree and submit, I indicate my agreement to Itinera&apos;s{" "}
              <Text className="text-blue-500 underline font-onest-medium">
                Terms of Service
              </Text>
            </Text>

            {/* Action buttons */}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={onBack}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 rounded-xl bg-gray-200"
              >
                <Text className="text-black/70 text-center text-base font-onest-medium">
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={onSubmit}
                disabled={isSubmitting}
                className={[
                  "bg-[#191313] py-4 px-8 rounded-xl flex-1",
                  isSubmitting ? "opacity-60" : "opacity-100",
                ].join(" ")}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white/90 text-center text-base font-onest-medium">
                    Agree and submit
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}