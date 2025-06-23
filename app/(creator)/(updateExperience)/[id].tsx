import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
import API_URL from '../../../constants/api';

// Step components (you'll need to create these)
import Step1EditExperienceDetails from "./(steps)/Step1ExperienceDetails";
import Step2EditAvailability from "./(steps)/Step2Availability";
import Step3EditTags from './(steps)/Step3Tags';
import Step4EditDestination from './(steps)/Step4Destination';
import Step5EditImages from './(steps)/Step5Images';

// Types
import { ExperienceFormData } from '../../../types/types';

// Experience type for the fetched data
type Experience = {
    experience_id: number;
    creator_id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    destination_id: number;
    status: string;
    travel_companion: string;
    created_at: string;
    tags: string[];
    images: string[];
    destination: {
        destination_id: number;
        name: string;
        city: string;
        longitude: number;
        latitude: number;
        description: string;
    };
};

// Progress bar component
interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ currentStep, totalSteps, labels = [] }) => {
    return (
        <View className="px-6 my-4">
            <StepIndicator
                customStyles={loadingBarStyles}
                currentPosition={currentStep - 1}
                stepCount={totalSteps}
                labels={labels}
            />
        </View>
    );
});

const ExperienceEditForm: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const experienceId = id ? String(id).replace('updateExperience', '') : '';

    // Debug the route params
    console.log('RAW id param:', id);
    console.log('Type of id:', typeof id);
    console.log('Array.isArray(id):', Array.isArray(id));

    // const experienceId = '1';
    console.log('Processed experienceId:', experienceId);

    const [step, setStep] = useState<number>(1);
    const stepCount = 5;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [formData, setFormData] = useState<ExperienceFormData>({
        title: '',
        description: '',
        price: '',
        unit: '',
        availability: [],
        tags: [],
        travel_companion: '',
        useExistingDestination: false,
        destination_id: null,
        destination_name: '',
        city: '',
        destination_description: '',
        latitude: '',
        longitude: '',
        images: [],
    });

    // Check authorization and load experience data

    useEffect(() => {
        const loadExperienceData = async () => {
            if (!experienceId) {
                Alert.alert('Error', 'Invalid experience ID');
                router.back();
                return;
            }

            try {
                // Get current user
                const user = await AsyncStorage.getItem('user');
                if (!user) {
                    Alert.alert('Error', 'User not found. Please login again.');
                    router.back();
                    return;
                }
                const parsedUser = JSON.parse(user);
                setCurrentUserId(parsedUser.user_id);

                // Fetch experience data
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load experience');
                }

                // Check if user is the creator
                if (data.creator_id !== parsedUser.user_id) {
                    Alert.alert('Unauthorized', 'You can only edit experiences you created.', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                    return;
                }

                setExperience(data);

                // Also load availability data
                // Also load availability data
                const availabilityResponse = await fetch(`${API_URL}/experience/${experienceId}/availability`);
                const availabilityData = await availabilityResponse.json();

                const tagsResponse = await fetch(`${API_URL}/tags`);
                const tagsData = await tagsResponse.json();

                let selectedTagIds = [];
                if (tagsResponse.ok && tagsData && tagsData.tags && data.tags) {
                    // Convert tag names to tag IDs
                    selectedTagIds = data.tags.map((tagName: string) => {
                        const tag = tagsData.tags.find((t: any) => t.name === tagName);
                        return tag ? tag.tag_id : null;
                    }).filter((id: number | null) => id !== null);
                }

                let transformedAvailability = [];
                if (availabilityResponse.ok && availabilityData && availabilityData.availability) {
                    transformedAvailability = availabilityData.availability.map((item: any) => ({
                        availability_id: item.availability_id,
                        experience_id: item.experience_id,
                        day_of_week: item.day_of_week,
                        time_slots: item.time_slots.map((slot: any) => ({
                            slot_id: slot.slot_id,
                            availability_id: slot.availability_id,
                            start_time: slot.start_time,
                            end_time: slot.end_time
                        }))
                    }));
                }

                // Populate form data with existing experience data
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price || '',
                    unit: data.unit || '',
                    availability: transformedAvailability, // ← Now loads actual availability data
                    tags: selectedTagIds,
                    travel_companion: data.travel_companion || '',
                    useExistingDestination: true, // Existing experiences always have destinations
                    destination_id: data.destination_id || null,
                    destination_name: data.destination?.name || data.destination_name || '',
                    city: data.destination?.city || '',
                    destination_description: data.destination?.description || '',
                    latitude: data.destination?.latitude?.toString() || '',
                    longitude: data.destination?.longitude?.toString() || '',
                    images: data.images || [],
                });

            } catch (error) {
                console.error('Error loading experience:', error);
                Alert.alert('Error', 'Failed to load experience data', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadExperienceData();
    }, [experienceId]);

    const validateFormData = () => {
        const requiredUnits = ['Entry', 'Hour', 'Day', 'Package'];

        if (
            !formData.title ||
            !formData.description ||
            !formData.price ||
            isNaN(Number(formData.price)) ||
            !requiredUnits.includes(formData.unit) ||
            !Array.isArray(formData.tags) ||
            formData.tags.length === 0 ||
            !Array.isArray(formData.availability) ||
            formData.availability.length === 0
        ) {
            console.log('Basic form data validation failed');
            return false;
        }

        for (const day of formData.availability) {
            if (!day.day_of_week) {
                console.log('Missing day_of_week:', day);
                return false;
            }
            if (!Array.isArray(day.time_slots)) {
                console.log('Missing or invalid time_slots:', day);
                return false;
            }
            if (day.time_slots.length === 0) {
                console.log('Empty time_slots array:', day);
                return false;
            }

            for (const slot of day.time_slots) {
                if (!slot.start_time || !slot.end_time) {
                    console.log('Missing start or end time in slot:', slot, 'Day:', day.day_of_week);
                    return false;
                }

                const startTime = new Date(`2000-01-01T${slot.start_time}`);
                const endTime = new Date(`2000-01-01T${slot.end_time}`);
                if (endTime <= startTime) {
                    Alert.alert('Invalid Time', `End time must be after start time for ${day.day_of_week}`);
                    return false;
                }
            }
        }

        // For editing, we can skip destination validation since it already exists
        if (!formData.useExistingDestination) {
            if (
                !formData.destination_name ||
                !formData.city ||
                !formData.destination_description ||
                !formData.latitude ||
                !formData.longitude
            ) {
                console.log('Missing destination info');
                return false;
            }
        } else if (!formData.destination_id) {
            console.log('Missing destination_id');
            return false;
        }

        return true;
    };

    const handleSubmit = async (status = 'draft') => {
        console.log('Updating formData:', formData);

        if (!validateFormData()) {
            Alert.alert('Validation Error', 'Please fill out all required fields.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Create FormData object for multipart/form-data
            const formDataObj = new FormData();

            // Add text fields
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('price', Number(formData.price).toString());
            formDataObj.append('unit', formData.unit);
            formDataObj.append('status', status);

            // Add tags
            formDataObj.append('tags', JSON.stringify(formData.tags));

            // Add travel companion
            formDataObj.append('travel_companion', formData.travel_companion);

            // Transform availability with the proper structure
            const transformedAvailability = formData.availability.map((day) => ({
                availability_id: day.availability_id,
                experience_id: parseInt(experienceId),
                day_of_week: day.day_of_week,
                time_slots: day.time_slots.map(slot => ({
                    slot_id: slot.slot_id,
                    availability_id: slot.availability_id,
                    start_time: slot.start_time.length === 5 ? slot.start_time + ':00' : slot.start_time,
                    end_time: slot.end_time.length === 5 ? slot.end_time + ':00' : slot.end_time,
                })),
            }));

            console.log('Transformed availability:', JSON.stringify(transformedAvailability));
            formDataObj.append('availability', JSON.stringify(transformedAvailability));

            // Handle destination data
            if (formData.useExistingDestination && formData.destination_id) {
                formDataObj.append('destination_id', formData.destination_id.toString());
            } else {
                formDataObj.append('destination_name', formData.destination_name);
                formDataObj.append('city', formData.city);
                formDataObj.append('destination_description', formData.destination_description);
                formDataObj.append('latitude', formData.latitude);
                formDataObj.append('longitude', formData.longitude);
            }

            // Add image files
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((img, index) => {
                    if (typeof img === 'string') {
                        // Handle existing images (URLs) - you might want to skip these
                        // or handle them differently for updates
                        if (!img.startsWith('http')) {
                            const uriParts = img.split('/');
                            const name = uriParts[uriParts.length - 1];
                            const fileExtension = name.split('.').pop() || '';
                            const type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

                            const fileObj: any = {
                                uri: img,
                                name,
                                type,
                            };
                            formDataObj.append('images', fileObj as any);
                        }
                    } else {
                        // Handle new format (object with uri, name, type)
                        const fileObj: any = {
                            uri: img.uri,
                            name: img.name || `image${index}.jpg`,
                            type: img.type || 'image/jpeg',
                        };
                        formDataObj.append('images', fileObj as any);
                    }
                });
            }

            console.log('Updating experience data:', formDataObj);

            // API call for updating
            const response = await fetch(`${API_URL}/experience/${experienceId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                },
                body: formDataObj,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update experience');
            }

            const successMessage = status === 'active'
                ? 'Experience published successfully!'
                : 'Experience updated successfully!';

            Alert.alert('Success', successMessage, [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (err) {
            console.error('Update error:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update experience');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step navigation
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    const renderStep = () => {
        if (!experience) return <View />; // ← Change to return empty View

        switch (step) {
            case 1:
                return <Step1EditExperienceDetails
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    experience={experience}
                />;

            case 2:
                return <Step2EditAvailability
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                    experienceId={parseInt(experienceId)}
                />;

            case 3:
                return <Step3EditTags
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                />;
            case 4:
                return <Step4EditDestination
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                    experience={experience}
                />;
            case 5:
                return <Step5EditImages
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                    experience={experience}
                />;
            // case 6:
            //     return <ReviewEditSubmit
            //         formData={formData}
            //         experience={experience}
            //         onBack={handleBack}
            //         onSubmit={handleSubmit}
            //         isSubmitting={isSubmitting}
            //     />;
            default:
                return null; // ← Change this from null to <View />
        }
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#376a63" />
                <Text className="mt-4 text-gray-600">Loading experience data...</Text>
            </SafeAreaView>
        );
    }

    // Error state
    if (!experience) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-600">Experience not found.</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
                >
                    <Text className="text-white font-medium">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200 bg-white">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-blue-500 font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold">Edit Experience</Text>
                    <View style={{ width: 64 }} />{/* Spacer for centering */}
                </View>
            </View>

            {/* Step content */}
            <View className="flex-1 px-6 py-4">
                <ProgressBar currentStep={step} totalSteps={stepCount} />
                {renderStep()}
            </View>

        </SafeAreaView>
    );
};

// Progress bar styles (same as your create form)
const loadingBarStyles = {
    stepIndicatorSize: 0,
    currentStepIndicatorSize: 0,
    separatorStrokeWidth: 6,
    separatorStrokeUnfinishedWidth: 6,
    separatorStrokeFinishedWidth: 6,
    separatorFinishedColor: '#376a63',
    separatorUnFinishedColor: '#E5E7EB',
    labelSize: 0,
    stepStrokeWidth: 0,
    currentStepStrokeWidth: 0
};

export default ExperienceEditForm;