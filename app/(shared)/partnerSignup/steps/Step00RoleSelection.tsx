// app/(auth)/steps/Step00RoleSelection.tsx
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { PartnerOnboardingFormData } from "../partnerOnboardingForm";

// If you want simple layout animations:
// npm i moti
// expo install react-native-reanimated
import { MotiView } from "moti";

type RoleItem = {
  role_id: "Creator" | "Guide" | "Driver";
  name: string;
  description: string;
  image: any; // require(...)
};

type Props = {
  formData: PartnerOnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
  onNext: () => void;
};

export default function Step00RoleSelection({
  formData,
  setFormData,
  onNext,
}: Props) {
  const roles: RoleItem[] = [
    // {
    //   role_id: "Creator",
    //   name: "Share Activity",
    //   description: "Offer activities and experiences to travelers",
    //   image: require("../../../../assets/images/category.png"),
    // },
    {
      role_id: "Guide",
      name: "Tour Guide",
      description: "Guide travelers through destinations and activities",
      image: require("../../../../assets/images/category1.png"),
    },
    {
      role_id: "Driver",
      name: "Transport Provider",
      description: "Provide itinerary-based transportation services",
      image: require("../../../../assets/images/car.png"),
    },
  ];

  const handleRoleSelect = (role: RoleItem) => {
    setFormData((prev) => ({
      ...prev,
      creator_role: role.role_id,
      creator_role_label: role.name,
    }));

    setTimeout(onNext, 300);
  };

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="items-center mt-24 mb-10">
        <Text className="text-3xl font-onest-semibold text-black/90 text-center leading-tight">
          How would you like to{"\n"}partner with Itinera?
        </Text>
        <Text className="mt-3 text-base text-black/50 text-center font-onest">
          Choose the role that best describes the services you offer
        </Text>
      </View>

      {/* Role Grid */}
      <View className="flex-col justify-between gap-4">
        {roles.map((role) => {
          const selected = formData.creator_role === role.role_id;

          return (
            <MotiView
              key={role.role_id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={{ width: "90%", marginHorizontal: "auto" }}
            >
              <Pressable
                onPress={() => handleRoleSelect(role)}
                className="rounded-2xl p-12 bg-[#fff]"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                <View className="items-center">
                  <View className="w-20 h-20 rounded-2xl items-center justify-center overflow-hidden mb-4 bg-black/5">
                    <Image
                      source={role.image}
                      style={{ width: 64, height: 64 }}
                      resizeMode="contain"
                    />
                  </View>

                  <Text className="text-xl font-onest-medium text-black/90 text-center">
                    {role.name}
                  </Text>

                  <Text className="text-base text-black/50 text-center mt-2">
                    {role.description}
                  </Text>
                </View>
              </Pressable>
            </MotiView>
          );
        })}
      </View>

      {/* If you want full-width cards (1-column) instead of grid:
          change style width to "100%" and remove justify-between */}
    </View>
  );
}
