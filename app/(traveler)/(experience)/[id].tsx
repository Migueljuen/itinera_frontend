// //experience/[id].tsx

// import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import React, { useState, useEffect } from 'react';
// import API_URL from '../../../constants/api'; // Your API base URL
// import { SafeAreaView } from 'react-native-safe-area-context';

// // Update Experience type to match the API data structure
// type Experience = {
//     id: number;
//     title: string;
//     description: string;
//     price: string;
//     unit: string;
//     destination_name: string;
//     location: string;
//     tags: string[]; // ✅ this must be an array of strings
//     images: string[];
// };

// export default function ExperienceDetail() {
//     const { id } = useLocalSearchParams();
//     const experienceId = Number(id);
//     const [experience, setExperience] = useState<Experience | null>(null); // Single object instead of an array
//     const [loading, setLoading] = useState(true);
//     const [expanded, setExpanded] = useState(false);
//     const [imageError, setImageError] = useState(false);

//     // Fetch experience data
//     useEffect(() => {
//         const fetchExperience = async () => {
//             try {
//                 const response = await fetch(`${API_URL}/experience/${experienceId}`);
//                 const data = await response.json();
//                 setExperience(data); // Set experience data

//                 // Log image data for debugging
//                 if (data && data.images) {

//                 }
//             } catch (error) {
//                 console.error('Error fetching experience data:', error);
//             } finally {
//                 setLoading(false); // Stop loading
//             }
//         };

//         fetchExperience();
//     }, [experienceId]);

//     // Handle image URL formatting
//     const getFormattedImageUrl = (imageUrl: string) => {
//         if (!imageUrl) return null;

//         // If it already starts with http, use as is
//         if (imageUrl.startsWith('http')) {
//             return imageUrl;
//         }

//         // Make sure path starts with '/'
//         const formattedPath = imageUrl.startsWith('/')
//             ? imageUrl
//             : `/${imageUrl}`;

//         return `${API_URL}${formattedPath}`;
//     };

//     if (loading) {
//         return (
//             <SafeAreaView className="flex-1 justify-center items-center">
//                 <ActivityIndicator size="large" color="#0000ff" />
//             </SafeAreaView>
//         );
//     }

//     if (!experience) {
//         return (
//             <SafeAreaView className="flex-1 justify-center items-center">
//                 <Text>Experience not found.</Text>
//             </SafeAreaView>
//         );
//     }

//     return (

//         <ScrollView className=''>
//             {/* Display image */}
//             <View className="w-full h-80  overflow-hidden bg-gray-200">
//                 {experience.images && experience.images.length > 0 && !imageError ? (
//                     <Image
//                         source={{ uri: getFormattedImageUrl(experience.images[0])! }}
//                         className="w-full h-full"
//                         resizeMode="cover"

//                     />
//                 ) : (
//                     <View className="w-full h-full justify-center items-center">
//                         <Text>{imageError ? 'Failed to load image' : 'No image available'}</Text>
//                     </View>
//                 )}
//             </View>

//             <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
//                 <View className='flex-row justify-between '>
//                     <Text className="text-2xl font-semibold mt-4 w-9/12">{experience.title}</Text>

//                     <Text className="my-4 text-gray-600 ">{experience.unit}</Text>
//                 </View>


//                 <Text className="text-lg font-bold text-blue-500 my-2 ">{experience.price ? `$${experience.price}` : 'Price not available'}</Text>
//                 <View className="flex-row flex-wrap mt-4">
//                     {experience.tags && experience.tags.map((tag) => (
//                         <Text key={tag} className="bg-blue-100 text-blue-600 text-xs rounded-full px-3 py-1 mr-2 mb-2">
//                             {tag}
//                         </Text>
//                     ))}
//                 </View>
//                 <Text className="text-lg font-semibold mt-6 mb-2">Description</Text>
//                 <Text className="text-gray-600">
//                     {expanded
//                         ? experience.description
//                         : (experience.description?.length > 150
//                             ? `${experience.description.substring(0, 150)}...`
//                             : experience.description)
//                     }
//                 </Text>

//                 {experience.description?.length > 150 && (
//                     <TouchableOpacity onPress={() => setExpanded(!expanded)}>
//                         <Text className="text-blue-500 mt-2">{expanded ? 'Read Less' : 'Read More'}</Text>
//                     </TouchableOpacity>
//                 )}



//                 {/* Location Button (you can add navigation logic for map) */}
//                 <TouchableOpacity
//                     className="mt-6 bg-blue-500 py-3 rounded-lg items-center"
//                     onPress={() => {/* Open map */ }}
//                 >
//                     <Text className="text-white font-semibold">Open Location on Map</Text>
//                 </TouchableOpacity>
//             </View>
//         </ScrollView>

//     );
// }

import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import API_URL from '../../../constants/api'; // Your API base URL
import { SafeAreaView } from 'react-native-safe-area-context';
import AvailabilityCalendar from '../../../components/AvailablityCalendar'; // Import the calendar component

// Update Experience type to match the API data structure
type Experience = {
    id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[]; // ✅ this must be an array of strings
    images: string[];
};

export default function ExperienceDetail() {
    const { id } = useLocalSearchParams();
    const experienceId = Number(id);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'availability'

    // Fetch experience data
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
                setExperience(data);

                // Log image data for debugging
                if (data && data.images) {
                    // Debugging code here if needed
                }
            } catch (error) {
                console.error('Error fetching experience data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId]);

    // Handle image URL formatting
    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;

        // If it already starts with http, use as is
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // Make sure path starts with '/'
        const formattedPath = imageUrl.startsWith('/')
            ? imageUrl
            : `/${imageUrl}`;

        return `${API_URL}${formattedPath}`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    if (!experience) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Experience not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScrollView className='flex-1'>
            {/* Display image */}
            <View className="w-full h-80 overflow-hidden bg-gray-200">
                {experience.images && experience.images.length > 0 && !imageError ? (
                    <Image
                        source={{ uri: getFormattedImageUrl(experience.images[0])! }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View className="w-full h-full justify-center items-center">
                        <Text>{imageError ? 'Failed to load image' : 'No image available'}</Text>
                    </View>
                )}
            </View>

            <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
                <View className='flex-row justify-between'>
                    <Text className="text-2xl font-semibold mt-4 w-9/12">{experience.title}</Text>
                    <Text className="my-4 text-gray-600">{experience.unit}</Text>
                </View>

                <Text className="text-lg font-bold text-blue-500 my-2">{experience.price ? `$${experience.price}` : 'Price not available'}</Text>

                {/* Tab navigation */}
                <View className="flex-row border-b border-gray-200 mt-4">
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text className={`${activeTab === 'details' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'availability' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('availability')}
                    >
                        <Text className={`${activeTab === 'availability' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>Availability</Text>
                    </TouchableOpacity>
                </View>

                {/* Content based on active tab */}
                {activeTab === 'details' ? (
                    // Details content
                    <View className="py-4">
                        <View className="flex-row flex-wrap">
                            {experience.tags && experience.tags.map((tag) => (
                                <Text key={tag} className="bg-blue-100 text-blue-600 text-xs rounded-full px-3 py-1 mr-2 mb-2">
                                    {tag}
                                </Text>
                            ))}
                        </View>
                        <Text className="text-lg font-semibold mt-4 mb-2">Description</Text>
                        <Text className="text-gray-600">
                            {expanded
                                ? experience.description
                                : (experience.description?.length > 150
                                    ? `${experience.description.substring(0, 150)}...`
                                    : experience.description)
                            }
                        </Text>

                        {experience.description?.length > 150 && (
                            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                <Text className="text-blue-500 mt-2">{expanded ? 'Read Less' : 'Read More'}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Location Button */}
                        <TouchableOpacity
                            className="mt-6 bg-blue-500 py-3 rounded-lg items-center"
                            onPress={() => {/* Open map */ }}
                        >
                            <Text className="text-white font-semibold">Open Location on Map</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Availability calendar
                    <View className="py-4">
                        <AvailabilityCalendar experienceId={experienceId} />
                    </View>
                )}
            </View>
        </ScrollView>
    );
}