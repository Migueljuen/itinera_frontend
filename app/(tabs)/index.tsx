import { View, Text, Image, ScrollView, TextInput, TouchableOpacity } from 'react-native'

import React, { useState, useEffect, use } from 'react';
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { experiences } from '../../data/experiences'
import Adjustment from '../../assets/icons/adjustment.svg'
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from '../../constants/api'
const categories = ['All', 'Food', 'Cultural', 'Adventure', 'Fitness', 'Relaxation', 'Scenic', 'Sports', 'Music', 'Art'];


const app = () => {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState('All'); // default selected
  const filteredExperiences = selectedCategory === 'All'
    ? experiences
    : experiences.filter(exp => exp.category.toLowerCase() === selectedCategory.toLowerCase());


  const [searchText, setSearchText] = useState('');
  const [fontsLoaded] = useFonts({
    "Onest-Medium": require('../../assets/fonts/Onest-Medium.ttf'),
    "Onest-ExtraBold": require('../../assets/fonts/Onest-ExtraBold.ttf'),
    "Onest-Bold": require('../../assets/fonts/Onest-Bold.ttf'),
    "Onest-SemiBold": require('../../assets/fonts/Onest-SemiBold.ttf'),
    "Onest-Regular": require('../../assets/fonts/Onest-Regular.ttf'),
    "Onest-Light": require('../../assets/fonts/Onest-Light.ttf')
  })

  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");



  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      console.log('Raw user from AsyncStorage:', user);  // This should log the raw string data

      if (user) {
        const parsedUser = JSON.parse(user);
        console.log('Fetched user:', parsedUser); // This should show the parsed user object
        setFirstName(parsedUser.first_name);
        setProfilePic(parsedUser.profile_pic);
      } else {
        console.log('No user found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);


  return (
    <SafeAreaView >
      <View className='w-full h-screen'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 142 }} >
          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Hello, {firstName}</Text>
              <Text className="text-gray-400 font-onest">Welcome to Itinera</Text>
            </View>
            <Image
              source={{ uri: `${API_URL}/${profilePic}` }}
              style={{ width: 50, height: 50, borderRadius: 25 }} // Added borderRadius for a circular image
              onError={(e) => console.log("Image URL:", `${API_URL}/${profilePic}`)}

            />
          </View>

          <View className='flex flex-row items-center justify-between p-4 bg-white rounded-xl mx-4'>
            <Image
              source={require('../../assets/images/search.png')} // adjust path to your image
              className='w-5 h-5 mr-3 opacity-60'
              resizeMode='contain'
            />
            <TextInput
              className='flex-1 text-base text-gray-800'
              placeholder="Search experiences"
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Adjustment

              className='w-5 h-5 mr-3 opacity-60'

            />
          </View>

          <View className="px-6 py-8 ">
            <Text className="text-normal text-xl font-onest-medium">Featured Experiences</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category, index) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full mr-3 mt-4 ${isSelected ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    <Text className={`text-base font-onest-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="  mt-8 min-h-fit">
              {filteredExperiences.length === 0 ? (
                <Text className="text-center text-gray-500 py-10">No experiences found</Text>
              ) : (
                filteredExperiences.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/(experience)/${item.id}`)}
                    className="w-full bg-white rounded-xl overflow-hidden mb-6"
                  >
                    <Image
                      source={item.image}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="text-base font-semibold">{item.title}</Text>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-sm text-gray-600">{item.location}</Text>
                        <Text className="text-sm text-gray-600">{item.distance}</Text>
                      </View>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-base font-bold text-blue-500">{item.price}</Text>
                        <Text className="text-xs text-gray-500">{item.unit}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
                ))}
            </View>
          </View>

        </ScrollView >

        <TouchableOpacity
          className="absolute bottom-48 right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
          onPress={() => console.log('Create Itinerary')}
        >
          <View className="flex-row items-center">
            <Image
              source={require('../../assets/icons/plus.png')} // adjust the path if needed
              className="w-5 h-5 mr-2 opacity-80"
              resizeMode="contain"
            />
            <Text className="text-gray-300 font-onest">Build My Trip</Text>
          </View>
        </TouchableOpacity>

      </View>

    </SafeAreaView >





  )
}

export default app

