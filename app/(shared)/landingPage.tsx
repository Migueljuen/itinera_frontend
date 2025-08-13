// import { useRouter } from "expo-router";
// import React, { useState } from 'react';
// import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// import { useFonts } from "expo-font";
// import Logo from "../../assets/images/undraw.svg";
// import Logo1 from "../../assets/images/undraw1.svg";
// import Logo2 from "../../assets/images/undraw2.svg";

// const categories = ['All', 'Food', 'Culture', 'Adventure', 'Fitness', 'Relaxation', 'Sports', 'Music', 'Art'];

// export default function landingPage() {
//   const [selectedCategory, setSelectedCategory] = useState('All'); // default selected

//   const [searchText, setSearchText] = useState('');
//   const [fontsLoaded] = useFonts({
//     "Onest-Medium": require('../../assets/fonts/Onest-Medium.ttf'),
//     "Onest-ExtraBold": require('../../assets/fonts/Onest-ExtraBold.ttf'),
//     "Onest-Bold": require('../../assets/fonts/Onest-Bold.ttf'),
//     "Onest-SemiBold": require('../../assets/fonts/Onest-SemiBold.ttf'),
//     "Onest-Regular": require('../../assets/fonts/Onest-Regular.ttf'),
//     "Onest-Light": require('../../assets/fonts/Onest-Light.ttf')
//   })
//   const router = useRouter();

//   return (

//     <SafeAreaView >
//       <View className="flex gap-8">

//         <View className=" flex flex-row justify-between px-5 items-center ">
//           <Image source={require('../../assets/images/logo.png')} style={{ width: 100, height: 100 }} />
//           <TouchableOpacity onPress={() => router.replace("/login")} className="bg-buttonPrimary p-4 rounded-md">
//             <Text className="text-white text-center">Sign In</Text>
//           </TouchableOpacity>
//         </View>

//         <ScrollView >
//           <View className=" flex justify-center items-center flex-1 p-12 gap-8 w-11/12 m-auto  ">
//             <View className="text-center"><Text className=" text-4xl text-center text-normal font-onest-medium">Experience more.</Text><Text className="font-onest-medium text-4xl text-center text-normal"> Plan less.</Text></View>
//             <Text className="text-grey text-center font-onest">Craft Your Perfect Journey: Tailored Itineraries for Every Adventure.</Text>
//             <TouchableOpacity onPress={() => router.replace("/login")} className="bg-buttonSecondary p-4 rounded-md">
//               <Text className="text-white text-center">Get started</Text>
//             </TouchableOpacity>

//           </View>

//           <View className=" flex justify-center items-start flex-1 gap-8 w-full m-auto pl-8 bg-primary p-16">
//             <Text className="font-extrabold text-4xl text-white"><Text className="text-accent">Uncover</Text> Real Experiences</Text>
//             <Text className="text-gray-300 w-5/6  ">Go beyond the itinerary—discover unique moments that make every trip unforgettable.</Text>
//           </View>

//           <View className=" flex justify-center items-end flex-1 gap-8 w-full m-auto pr-8 bg-white p-12 ">
//             <Logo width={150} height={150} />
//             <Text className="text-right font-extrabold text-4xl text-normal ">Personalized <Text className="bg-buttonSecondary">Recommendations</Text></Text>
//             <Text className="text-grey w-5/6 text-right">Plan, customize, and optimize your trips. Whether it's for vacations or everyday adventures.</Text>
//           </View>

//           <View className=" flex justify-center items-start flex-1 gap-8 w-full m-auto pl-8 bg-white p-12">
//             <Logo1 width={150} height={150} />
//             <Text className="text-left font-extrabold text-4xl text-normal"> <Text className="bg-buttonSecondary">Feel</Text> Every Moment</Text>
//             <Text className="text-grey w-5/6 text-left">It’s not about where you go, but how it makes you feel. Travel with meaning.</Text>
//           </View>

//           <View className=" flex justify-center items-center flex-1 gap-6 w-full bg-white py-24">
//             <Logo2 width={150} height={150} />
//             <Text className="text-left font-extrabold text-4xl text-normal">What We Offer</Text>
//             <Text className="text-grey w-5/6 text-left">Discover meaningful experiences that go beyond schedules. Explore, feel, and connect with each destination in a way that’s truly unforgettable. ✨</Text>

//             <View className="border border-gray-200 rounded-lg w-11/12 mx-auto px-4 py-12">
//               <Text className="flex items-center font-bold text-normal text-xl py-4">  <Logo2 width={75} height={75} />Authentic Experiences </Text>
//               <Text className="text-gray-500">Immerse yourself in unique, local adventures curated to help you live the culture, not just see it.</Text>
//             </View>
//             <View className="border border-gray-200 rounded-lg  w-11/12 mx-auto px-4 py-12 ">
//               <Text className="flex items-center font-bold text-normal text-xl py-4">  <Logo2 width={75} height={75} />Story-Driven Travel</Text>
//               <Text className="text-gray-500">Every experience is a chapter. Build memories through curated moments that tell a story worth sharing.</Text>
//             </View>
//             <View className="border border-gray-200 rounded-lg  w-11/12 mx-auto px-4 py-12 ">
//               <Text className="flex items-center font-bold text-normal text-xl py-4">  <Logo2 width={75} height={75} />Moments That Matter</Text>
//               <Text className="text-gray-500">From breathtaking views to quiet local rituals, find moments that make your trip truly meaningful.</Text>
//             </View>

//           </View>

//           <View className="bg-white  border-t border-gray-200 h-[720px] px-[10%]  ">
//             <View className="items-center mb-4">
//               <Image source={require('../../assets/images/logo.png')} style={{ width: 100, height: 100 }} />

//               <Text className="text-gray-500 text-center mt-1 px-6">
//                 Turn your next trip into a hassle-free experience with Itinera.
//               </Text>
//             </View>

//             <View className="flex-row justify-between mt-4 gap-12">
//               <View className="flex items-start justify-start w-3/6">
//                 <Text className="font-semibold text-center py-4">Legal</Text>
//                 <TouchableOpacity><Text className="text-gray-500  w-3/6">Terms and Conditions</Text></TouchableOpacity>
//                 <TouchableOpacity><Text className="text-gray-500 ">Privacy Policy</Text></TouchableOpacity>
//               </View>

//               <View className="flex items-start justify-start w-3/6">
//                 <Text className="font-semibold text-center  py-4">Support</Text>
//                 <TouchableOpacity><Text className="text-gray-500 ">Contact Us</Text></TouchableOpacity>
//               </View>
//             </View>
//             <View className="flex-row justify-between mt-4 gap-12 border-gray-200 border-b pb-12">
//               <View className="flex items-start justify-start w-3/6">
//                 <Text className="font-semibold text-center  py-4">Other</Text>
//                 <TouchableOpacity><Text className="text-gray-500  w-3/6">FAQs</Text></TouchableOpacity>
//                 <TouchableOpacity><Text className="text-gray-500 ">About Us</Text></TouchableOpacity>
//               </View>

//               <View className="flex items-start justify-start w-3/6">
//                 <Text className="font-semibold text-center  py-4">Itineraries</Text>
//                 <TouchableOpacity><Text className="text-gray-500 ">Destinations</Text></TouchableOpacity>
//               </View>
//             </View>

//             <Text className="text-center mt-8 text-grey">© 2025 Itinera. All rights reserved</Text>
//           </View>

//         </ScrollView >
//       </View>

//     </SafeAreaView>
//   );
// }
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
    title: "Uncover Real Experiences",
    description:
      "Go beyond the itinerary—discover unique moments that make every trip unforgettable.",
    image: require("../../assets/images/test1.png"),
  },
  {
    id: "2",
    title: "Personalized Recommendations",
    description:
      "Plan, customize, and optimize your trips. Whether its for vacations or everyday adventures.",
    image: require("../../assets/images/1.jpg"),
  },
  {
    id: "3",
    title: "Feel every moment",
    description:
      "It’s not about where you go, but how it makes you feel. Travel with meaning.",
    image: require("../../assets/images/1.jpg"),
  },
  {
    id: "4",
    title: "Get Started",
    description:
      "Ready to begin your journey? Let's dive in and explore together!",
    image: require("../../assets/images/1.jpg"),
  },
];

const landingPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // const [fontsLoaded] = useFonts({
  //   "Onest-Medium": require("../../assets/fonts/Onest-Medium.ttf"),
  //   "Onest-ExtraBold": require("../../assets/fonts/Onest-ExtraBold.ttf"),
  //   "Onest-Bold": require("../../assets/fonts/Onest-Bold.ttf"),
  //   "Onest-SemiBold": require("../../assets/fonts/Onest-SemiBold.ttf"),
  //   "Onest-Regular": require("../../assets/fonts/Onest-Regular.ttf"),
  //   "Onest-Light": require("../../assets/fonts/Onest-Light.ttf"),
  // });

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