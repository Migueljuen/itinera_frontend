import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { experiences } from '../../data/experiences';
import React, { useState } from 'react';
export default function ExperienceDetail() {
    const { id } = useLocalSearchParams();
    const experienceId = Number(id);
    const [expanded, setExpanded] = useState(false);
    const experience = experiences.find((exp) => exp.id === experienceId);

    if (!experience) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-xl font-semibold">Experience not found.</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white">
            <Image
                source={experience.image}
                className="w-full h-96"
                resizeMode="cover"
            />
            <View className="p-5">
                <View className='flex flex-row justify-between items-center'>
                    <Text className="text-2xl font-medium my-3 w-3/4">{experience.title} </Text>
                    <Text className="text-blue-600 text-xl font-bold mt-2">{experience.price}</Text>
                </View>
                <Text className="text-gray-600 mb-1">📍 {experience.location}  |  🛣 {experience.distance} away  |  {experience.unit}</Text>

                <View className='flex mt-4'>
                    <Text className="text-2xl font-medium my-3 ">Description </Text>

                    <View className="w-11/12">
                        <Text
                            className="text-base text-gray-700"
                            numberOfLines={expanded ? undefined : 2}
                        >
                            {experience.description}
                        </Text>
                        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                            <Text className="text-blue-500 mt-1">
                                {expanded ? 'Read Less' : 'Read More'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                <View className='flex flex-row mt-4 items-center justify-between '>
                    <Text className="text-2xl font-medium my-3 ">Location </Text>
                    <Text className=" text-base text-blue-600 flex">Open maps </Text>

                </View>
            </View>
        </ScrollView>
    );
}
