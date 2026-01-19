// app/(auth)/steps/Step03Driver.tsx
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { toast } from "sonner-native";

import type { DayOfWeek, PartnerOnboardingFormData } from "../partnerOnboardingForm";

type Props = {
  formData: PartnerOnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
  onNext: () => void;
  onBack: () => void;
};

const serviceAreas = [
  "Bacolod City",
  "Silay City",
  "Talisay City",
  "Victorias City",
  "Cadiz City",
  "Sagay City",
  "Escalante City",
  "Himamaylan City",
  "Kabankalan City",
  "Bago City",
  "La Carlota City",
  "San Carlos City",
  "Sipalay City",
] as const;

const daysOfWeek: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Step03Driver({
  formData,
  setFormData,
  onNext,
  onBack,
}: Props) {
  const logo = useMemo(
    () => require("../../../../assets/images/logo.png"),
    []
  );

  const handleChange = <K extends keyof PartnerOnboardingFormData>(
    field: K,
    value: PartnerOnboardingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedAreas = useMemo(() => {
    return formData.service_area ? formData.service_area.split(", ") : [];
  }, [formData.service_area]);

  const toggleServiceArea = (area: string) => {
    const currentAreas = formData.service_area
      ? formData.service_area.split(", ")
      : [];

    if (currentAreas.includes(area)) {
      const newAreas = currentAreas.filter((a) => a !== area);
      handleChange("service_area", newAreas.join(", "));
    } else {
      const newAreas = [...currentAreas, area];
      handleChange("service_area", newAreas.join(", "));
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    const current = formData.driver_availability_days || [];
    if (current.includes(day)) {
      handleChange(
        "driver_availability_days",
        current.filter((d) => d !== day)
      );
    } else {
      handleChange("driver_availability_days", [...current, day]);
    }
  };

  const handleContinue = () => {
    if (!formData.service_area || formData.service_area.trim() === "") {
      toast.error("Please select at least one service area.");
      return;
    }

    if (!formData.driver_availability_days?.length) {
      toast.error("Please select at least one available day.");
      return;
    }

    onNext();
  };

  const InfoRow = ({
    icon,
    title,
    subtitle,
    strong,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    strong: string;
  }) => (
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

  const Chip = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={[
        "border rounded-2xl px-3 py-3",
        selected ? "border-black bg-black/5" : "border-black/15 bg-white",
      ].join(" ")}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text className="text-sm text-black/80 font-onest-medium">{label}</Text>
    </Pressable>
  );

  const ToggleCard = ({
    title,
    subtitle,
    selected,
    onPress,
  }: {
    title: string;
    subtitle: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={[
        "flex-1 border rounded-2xl p-4",
        selected ? "border-black bg-black/5" : "border-black/15 bg-white",
      ].join(" ")}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Text className="text-base font-onest-medium text-black/90">{title}</Text>
      <Text className="text-xs text-black/55 mt-1">{subtitle}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="px-10" contentContainerStyle={{ paddingBottom: 28 }}>

        {/* main */}
        <View className="mt-24">
          <Text className="text-3xl font-onest-semibold text-black/90">
            Transport Service Details
          </Text>
          <Text className="mt-2 text-base text-black/60">
            Tell us about your service availability to help travelers find you.
          </Text>

          <View className="mt-8 gap-8">
            {/* Service Areas */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Service Areas <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-black/55 mt-2 mb-3">
                Select all areas where you provide transport services
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {serviceAreas.map((area) => (
                  <View key={area} style={{ width: "48%" }}>
                    <Chip
                      label={area}
                      selected={selectedAreas.includes(area)}
                      onPress={() => toggleServiceArea(area)}
                    />
                  </View>
                ))}
              </View>

              {selectedAreas.length > 0 && (
                <Text className="text-sm text-black/55 mt-3">
                  Selected: {selectedAreas.length} area
                  {selectedAreas.length !== 1 ? "s" : ""}
                </Text>
              )}
            </View>

            {/* Multi-day */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Multi-day Service
              </Text>

              <View className="flex-row gap-3 mt-3">
                <ToggleCard
                  title="Yes"
                  subtitle="I offer multi-day trips"
                  selected={formData.is_multi_day === true}
                  onPress={() => handleChange("is_multi_day", true)}
                />
                <ToggleCard
                  title="No"
                  subtitle="Day trips only"
                  selected={formData.is_multi_day === false}
                  onPress={() => handleChange("is_multi_day", false)}
                />
              </View>
            </View>

            {/* Availability */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Availability <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-black/55 mt-2 mb-3">
                Select the days you&apos;re available to provide service
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const selected = formData.driver_availability_days?.includes(day);
                  return (
                    <View key={day} style={{ width: "48%" }}>
                      <Chip
                        label={day}
                        selected={!!selected}
                        onPress={() => toggleDay(day)}
                      />
                    </View>
                  );
                })}
              </View>

              {!!formData.driver_availability_days?.length && (
                <Text className="text-sm text-black/55 mt-3">
                  Available {formData.driver_availability_days.length} day
                  {formData.driver_availability_days.length !== 1 ? "s" : ""} per
                  week
                </Text>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between mt-10">
            <Pressable
              onPress={onBack}
              className="px-8 py-4 rounded-xl bg-black/10"
            >
              <Text className="text-black/70 font-onest-medium">Back</Text>
            </Pressable>

            <Pressable
              onPress={handleContinue}
              className="bg-[#191313] py-4 px-8 rounded-md"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <Text className="text-white font-onest-medium">Continue</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
