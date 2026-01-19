// app/(auth)/steps/Step03Guide.tsx
import React, { useMemo } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";

import type { DayOfWeek, PartnerOnboardingFormData } from "../partnerOnboardingForm";

type Props = {
  formData: PartnerOnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
  onNext: () => void;
  onBack: () => void;
};

type ExpertiseCategory = { id: number; name: string; image: any };
type Language = { value: string; label: string; flag: string };

const expertiseCategories: ExpertiseCategory[] = [
  { id: 1, name: "Art and design", image: require("../../../../assets/images/category.png") },
  { id: 2, name: "Fitness and wellness", image: require("../../../../assets/images/category1.png") },
  { id: 3, name: "Food and drink", image: require("../../../../assets/images/category2.png") },
  { id: 4, name: "History and culture", image: require("../../../../assets/images/category3.png") },
  { id: 5, name: "Nature and outdoors", image: require("../../../../assets/images/category4.png") },
];

const availableLanguages: Language[] = [
  { value: "English", label: "English", flag: "🇬🇧" },
  { value: "Tagalog", label: "Tagalog", flag: "🇵🇭" },
  { value: "Cebuano", label: "Cebuano", flag: "🇵🇭" },
  { value: "Hiligaynon", label: "Hiligaynon", flag: "🇵🇭" }
];

const metroBacolodCities = [
  "Bacolod City",
  "Silay City",
  "Talisay City",
  "Bago City",
  "Murcia",
] as const;

const experienceLevels = [
  { value: 1, label: "Less than 1 year" },
  { value: 2, label: "1-2 years" },
  { value: 3, label: "3-5 years" },
  { value: 6, label: "6-10 years" },
  { value: 10, label: "10+ years" },
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

type CategoryCardProps = {
  id: number;
  name: string;
  image: any;
  selected: boolean;
  onPress: (id: number) => void;
};

const CategoryCard = React.memo(function CategoryCard({
  id,
  name,
  image,
  selected,
  onPress,
}: CategoryCardProps) {
  return (
    <Pressable
      onPress={() => onPress(id)}
      className={[
        "border rounded-2xl p-4 bg-white",
        selected ? "border-black bg-black/5" : "border-black/15",
      ].join(" ")}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View className="items-center">
        <View className="w-20 h-20 rounded-2xl overflow-hidden  items-center justify-center">
          <Image
            source={image}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
            fadeDuration={0} // ✅ prevents flicker on Android
          />
        </View>
        <Text className="text-sm font-onest-medium text-black/90 text-center mt-3">
          {name}
        </Text>
      </View>
    </Pressable>
  );
});


export default function Step03Guide({
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
    return formData.areas_covered ? formData.areas_covered.split(", ") : [];
  }, [formData.areas_covered]);

  const toggleLanguage = (language: string) => {
    const current = formData.languages || [];
    if (current.includes(language)) {
      handleChange(
        "languages",
        current.filter((l) => l !== language)
      );
    } else {
      handleChange("languages", [...current, language]);
    }
  };
  const onSelectCategory = React.useCallback(
    (id: number) => handleChange("expertise_category_id", id),
    [handleChange]
  );


  const toggleArea = (area: string) => {
    const currentAreas = formData.areas_covered
      ? formData.areas_covered.split(", ")
      : [];

    if (currentAreas.includes(area)) {
      const newAreas = currentAreas.filter((a) => a !== area);
      handleChange("areas_covered", newAreas.join(", "));
    } else {
      const newAreas = [...currentAreas, area];
      handleChange("areas_covered", newAreas.join(", "));
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    const current = formData.guide_availability_days || [];
    if (current.includes(day)) {
      handleChange(
        "guide_availability_days",
        current.filter((d) => d !== day)
      );
    } else {
      handleChange("guide_availability_days", [...current, day]);
    }
  };

  const handleContinue = () => {
    if (!formData.expertise_category_id) {
      toast.error("Please select your area of expertise.");
      return;
    }
    if (!formData.languages?.length) {
      toast.error("Please select at least one language.");
      return;
    }
    if (!formData.areas_covered || formData.areas_covered.trim() === "") {
      toast.error("Please select at least one tour area.");
      return;
    }
    if (!formData.experience_years) {
      toast.error("Please select your experience level.");
      return;
    }
    if (!formData.guide_availability_days?.length) {
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
    left,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    left?: React.ReactNode;
  }) => (
    <Pressable
      onPress={onPress}
      className={[
        "border rounded-2xl px-3 py-3",
        selected ? "border-black bg-black/5" : "border-black/15 bg-white",
      ].join(" ")}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View className="flex-row items-center gap-2">
        {left}
        <Text className="text-sm text-black/80 font-onest-medium">{label}</Text>
      </View>
    </Pressable>
  );


  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="px-10" contentContainerStyle={{ paddingBottom: 28 }}>

        {/* main */}
        <View className=" mt-24">
          <Text className="text-3xl font-onest-semibold text-black/90">
            Tour Guide Details
          </Text>
          <Text className="mt-2 text-base text-black/60">
            Share your expertise and help travelers discover the best of Negros
            Occidental.
          </Text>

          <View className="mt-8 gap-8">
            {/* Expertise */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/90">
                What type of experiences do you specialize in?<Text className="text-red-500">*</Text>
              </Text>


              <View className="flex-row flex-wrap gap-3 mt-4">
                {expertiseCategories.map((cat) => (
                  <View key={cat.id} style={{ width: "48%" }}>
                    <CategoryCard
                      id={cat.id}
                      name={cat.name}
                      image={cat.image}
                      selected={formData.expertise_category_id === cat.id}
                      onPress={onSelectCategory}
                    />
                  </View>
                ))}
              </View>

            </View>

            {/* Languages */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Languages <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-black/55 mt-2 mb-3">
                Select all languages you can guide in
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {availableLanguages.map((lang) => (
                  <View key={lang.value} style={{ width: "48%" }}>
                    <Chip
                      label={lang.label}
                      selected={formData.languages?.includes(lang.value) ?? false}
                      onPress={() => toggleLanguage(lang.value)}

                    />
                  </View>
                ))}
              </View>

              {!!formData.languages?.length && (
                <Text className="text-sm text-black/55 mt-3">
                  Selected: {formData.languages.length} language
                  {formData.languages.length !== 1 ? "s" : ""}
                </Text>
              )}
            </View>

            {/* Experience Level */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Experience Level <Text className="text-red-500">*</Text>
              </Text>

              <View className="flex-row flex-wrap gap-2 mt-3">
                {experienceLevels.map((exp) => (
                  <View key={exp.value} style={{ width: "48%" }}>
                    <Chip
                      label={exp.label}
                      selected={formData.experience_years === exp.value}
                      onPress={() => handleChange("experience_years", exp.value)}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Service Areas */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Service Areas <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-black/55 mt-2 mb-3">
                Select cities in Metro Bacolod where you provide tour guide
                services
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {metroBacolodCities.map((city) => (
                  <View key={city} style={{ width: "48%" }}>
                    <Chip
                      label={city}
                      selected={selectedAreas.includes(city)}
                      onPress={() => toggleArea(city)}
                    />
                  </View>
                ))}
              </View>

              {selectedAreas.length > 0 && (
                <Text className="text-sm text-black/55 mt-3">
                  Selected: {selectedAreas.length}{" "}
                  {selectedAreas.length === 1 ? "city" : "cities"}
                </Text>
              )}
            </View>

            {/* Availability */}
            <View>
              <Text className="text-lg font-onest-semibold text-black/85">
                Availability <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-black/55 mt-2 mb-3">
                Select the days you&apos;re available to guide tours
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <View key={day} style={{ width: "48%" }}>
                    <Chip
                      label={day}
                      selected={formData.guide_availability_days?.includes(day) ?? false}
                      onPress={() => toggleDay(day)}
                    />
                  </View>
                ))}
              </View>

              {!!formData.guide_availability_days?.length && (
                <Text className="text-sm text-black/55 mt-3">
                  Available {formData.guide_availability_days.length} day
                  {formData.guide_availability_days.length !== 1 ? "s" : ""} per
                  week
                </Text>
              )}
            </View>

            {/* Tip box */}
            <View className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
              <Text className="text-sm text-blue-900">
                <Text className="font-onest-semibold">Tip:</Text> Offering tours
                in multiple languages and covering popular destinations can help
                you attract more travelers.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between mt-10">
            <Pressable onPress={onBack} className="px-8 py-4 rounded-xl bg-black/10">
              <Text className="text-black/70 font-onest-medium">Back</Text>
            </Pressable>

            <Pressable
              onPress={handleContinue}
              className="px-8 py-4 rounded-xl bg-black"
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
