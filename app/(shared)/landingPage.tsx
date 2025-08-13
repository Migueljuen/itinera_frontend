
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
const { width } = Dimensions.get("window");
const router = useRouter();

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: "1",
    title: "Uncover Real  Experiences",
    description:
      "Go beyond the itinerary—discover unique moments that make every trip unforgettable.",
    image: require("../../assets/images/test2.png"),
  },
  {
    id: "2",
    title: "Personalized Recommendations",
    description:
      "Plan, customize, and optimize your trips. Whether its for vacations or everyday adventures.",
    image: require("../../assets/images/test1.png"),
  },
  {
    id: "3",
    title: "Get Started",
    description:
      "Ready to begin your journey? Let's dive in and explore together!",
    image: require("../../assets/images/test3.png"),
  },
];

const landingPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setCurrentIndex(index);
  };

  return (
    <View className="flex-1  font-onest flex items-center justify-start bg-white">
      {/* Carousel */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={{ width: 150, height: 150, marginTop: 36 }}
      />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className=""
      >
        {onboardingData.map((slide, index) => (
          <View
            key={slide.id}
            className="justify-center items-center px-8  flex-1"
            style={{ width }}
          >
            <Image
              source={slide.image}
              className="h-[350px] w-[100%] mb-4"
              resizeMode="contain"
            />
            <Text className="text-black/90 text-4xl font-onest-bold text-center leading-tight mb-4">
              {slide.title}
            </Text>
            <Text className="text-black/60 text-lg font-onest text-center leading-6 opacity-90 ">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="flex justify-center items-center py-12 mb-12 ">
        {/* Pagination Dots */}
        <View className="flex-row  mb-8">
          {onboardingData.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              className={`h-3 rounded-full mx-1 ${
                index === currentIndex
                  ? "bg-buttonPrimary w-8"
                  : "bg-gray-300 w-3"
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/login")}
          className="bg-buttonSecondary px-16 py-4  rounded-full"
        >
          <Text className="text-white text-center text-xl">Get started</Text>
          {/* {" "} */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default landingPage;