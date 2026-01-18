
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TooltipType = "manual" | "generate" | null;

const SelectionScreen = () => {
  const router = useRouter();
  const [activeTooltip, setActiveTooltip] = useState<TooltipType>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showTooltip = (type: TooltipType) => {
    setActiveTooltip(type);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setActiveTooltip(null));
  };

  const tooltipContent = {
    manual: {
      title: "Create My Own Itinerary",
      description:
        "Perfect for travelers who want full control. Build your trip day-by-day, choose your own activities, and customize every detail.",
      features: [
        "Pick specific experiences",
        "Set your own schedule",
        "Full customization",
      ],
      icon: "pencil-outline",
    },
    generate: {
      title: "Generate Itinerary",
      description:
        "Let us create a personalized itinerary for you. Just tell us your preferences, and we'll plan your perfect trip.",
      features: [
        "System generated suggestions",
        "Save time planning",
        "Based on your interests",
      ],
      icon: "sparkles-outline",
    },
  };

  const renderTooltip = () => {
    if (!activeTooltip) return null;

    const content = tooltipContent[activeTooltip];

    return (
      <Modal
        visible={true}
        transparent
        animationType="none"
        onRequestClose={hideTooltip}
      >
        <TouchableWithoutFeedback onPress={hideTooltip}>
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                {/* Header */}
                <View className="flex-row items-center mb-4">
                  <Text className="text-xl font-onest-semibold flex-1 text-black/90">
                    {content.title}
                  </Text>
                </View>

                {/* Description */}
                <Text className="text-black/70 font-onest text-sm mb-8 leading-6">
                  {content.description}
                </Text>

                {/* Features */}
                <View className="mb-6 hidden">
                  {content.features.map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Text className="text-black/50 font-onest ">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Okay Button */}
                <TouchableOpacity
                  onPress={hideTooltip}
                  className="bg-primary py-3 rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-onest-semibold text-center text-base">
                    Got it!
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="text-center py-2">
              <Text className="text-center text-xl font-onest-semibold my-4">
                Getting started
              </Text>
              <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                You can either build your own itinerary step-by-step or let us
                generate one based on your travel preferences.
              </Text>

              <View className="flex flex-col items-center w-11/12 m-auto">
                {/* Manual Creation Card */}
                <View className="relative w-full mb-4">
                  <TouchableOpacity
                    onPress={() => router.push("/manual")}
                    className="size-80 rounded-2xl bg-primary flex-col justify-center items-center gap-2 w-full"
                    activeOpacity={0.8}
                  >
                    <Image
                      source={require('../../../assets/images/undraw.png')}
                      className="h-[120px] w-[100%]"
                      resizeMode="contain"
                    />
                    <Text className="mt-8 font-onest-medium text-gray-50 text-base">
                      Create My Own Itinerary
                    </Text>
                  </TouchableOpacity>

                  {/* Info Button */}
                  <TouchableOpacity
                    onPress={() => showTooltip("manual")}
                    className="absolute top-3 right-3 bg-white/20 p-2 rounded-full"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                {/* Generate Card */}
                <View className="relative w-full">
                  <TouchableOpacity
                    onPress={() => router.push("/generate")}
                    className="size-80 rounded-2xl bg-yellow-200 flex-col justify-center items-center gap-2 w-full"
                    activeOpacity={0.8}
                  >
                    <Image
                      source={require('../../../assets/images/undraw1.png')}
                      className="h-[120px] w-[100%]"
                      resizeMode="contain"
                    />
                    <Text className="mt-8 font-onest-medium text-black/70 text-base">
                      Generate Itinerary
                    </Text>
                  </TouchableOpacity>

                  {/* Info Button */}
                  <TouchableOpacity
                    onPress={() => showTooltip("generate")}
                    className="absolute top-3 right-3 bg-black/10 p-2 rounded-full"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color="#1a1a1a"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Helper Text */}
              <View className="flex-row items-center justify-center mt-6 px-4">
                <Ionicons name="bulb-outline" size={16} color="#6B7280" />
                <Text className="text-gray-500 font-onest text-xs ml-2">
                  Tap the info icon to learn more about each option
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Render Tooltip Modal */}
      {renderTooltip()}
    </SafeAreaView>
  );
};

export default SelectionScreen;
