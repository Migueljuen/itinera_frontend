// Updated parent component with save button and section-based save functionality
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
import API_URL from '../../../constants/api';

// Step components
import Step1EditExperienceDetails from "./(steps)/Step1ExperienceDetails";
import Step2EditAvailability from "./(steps)/Step2Availability";
import Step3EditTags from './(steps)/Step3Tags';
import Step4EditDestination from './(steps)/Step4Destination';
import Step5EditImages from './(steps)/Step5Images';

// Types
import { ExperienceFormData, TravelCompanionType } from '../../../types/types';

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
    travel_companions?: TravelCompanionType[]; // New field
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

    const [step, setStep] = useState<number>(1);
    const stepCount = 5;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
        travel_companions: [], // Initialize the new field
        useExistingDestination: false,
        destination_id: null,
        destination_name: '',
        city: '',
        destination_description: '',
        latitude: '',
        longitude: '',
        images: [],
    });

    // Track deleted images at parent level
    const [deletedImages, setDeletedImages] = useState<string[]>([]);

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

                // Load availability data
                const availabilityResponse = await fetch(`${API_URL}/experience/${experienceId}/availability`);
                const availabilityData = await availabilityResponse.json();

                const tagsResponse = await fetch(`${API_URL}/tags`);
                const tagsData = await tagsResponse.json();

                let selectedTagIds = [];
                if (tagsResponse.ok && tagsData && tagsData.tags && data.tags) {
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

                // Handle travel companions - convert from old format if needed
                let companions: TravelCompanionType[] = [];
                if (data.travel_companions && Array.isArray(data.travel_companions)) {
                    companions = data.travel_companions;
                } else if (data.travel_companion) {
                    companions = [data.travel_companion as TravelCompanionType];
                }

                // Populate form data with existing experience data
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price || '',
                    unit: data.unit || '',
                    availability: transformedAvailability,
                    tags: selectedTagIds,
                    travel_companion: data.travel_companion || '',
                    travel_companions: companions, // Set the array
                    useExistingDestination: true,
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

    // Save current step data
    const handleSaveCurrentStep = async () => {
        if (!experience) return;

        try {
            setIsSaving(true);

            const formDataObj = new FormData();
            let section = '';

            // Determine what to save based on current step
            switch (step) {
                case 1: // Basic details
                    section = 'basic';
                    formDataObj.append('section', section);
                    formDataObj.append('title', formData.title);
                    formDataObj.append('description', formData.description);
                    formDataObj.append('price', Number(formData.price).toString());
                    formDataObj.append('unit', formData.unit);
                    break;

                case 2: // Availability
                    section = 'availability';
                    formDataObj.append('section', section);
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
                    formDataObj.append('availability', JSON.stringify(transformedAvailability));
                    break;

                case 3: // Tags and travel companions
                    section = 'tags';
                    formDataObj.append('section', section);
                    formDataObj.append('tags', JSON.stringify(formData.tags));
                    formDataObj.append('travel_companion', formData.travel_companion);
                    // Add the new travel_companions array
                    formDataObj.append('travel_companions', JSON.stringify(formData.travel_companions || []));
                    break;

                case 4: // Destination
                    section = 'destination';
                    formDataObj.append('section', section);
                    if (formData.useExistingDestination && formData.destination_id) {
                        formDataObj.append('destination_id', formData.destination_id.toString());
                    } else {
                        formDataObj.append('destination_name', formData.destination_name);
                        formDataObj.append('city', formData.city);
                        formDataObj.append('destination_description', formData.destination_description);
                        formDataObj.append('latitude', formData.latitude);
                        formDataObj.append('longitude', formData.longitude);
                    }
                    break;

                case 5: // Images
                    section = 'images';
                    formDataObj.append('section', section);

                    // Use the deletedImages state that's tracked at parent level
                    if (deletedImages.length > 0) {
                        formDataObj.append('images_to_delete', JSON.stringify(deletedImages));
                        console.log('Images to delete:', deletedImages);
                    }

                    // Handle new image uploads
                    if (formData.images && formData.images.length > 0) {
                        let newImageCount = 0;
                        formData.images.forEach((img, index) => {
                            // Only upload new images (not original URLs)
                            if (typeof img === 'object' && img !== null) {
                                const fileObj: any = {
                                    uri: img.uri,
                                    name: img.name || `image${index}.jpg`,
                                    type: img.type || 'image/jpeg',
                                };
                                formDataObj.append('images', fileObj as any);
                                newImageCount++;
                            }
                        });
                        console.log('New images to upload:', newImageCount);
                    }
                    break;
            }

            // Call the section update endpoint
            const response = await fetch(`${API_URL}/experience/${experienceId}/section`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                },
                body: formDataObj,
            });

            const responseData = await response.json();
            console.log('Save response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to save changes');
            }

            Alert.alert('Success', 'Changes saved successfully!');

            // Update the original experience data with new values
            if (step === 1) {
                setExperience({
                    ...experience,
                    title: formData.title,
                    description: formData.description,
                    price: formData.price,
                    unit: formData.unit
                });
            } else if (step === 3) {
                // Update tags and travel companions
                setExperience({
                    ...experience,
                    travel_companion: formData.travel_companion,
                    travel_companions: formData.travel_companions
                });
            } else if (step === 5) {
                // Update the experience images after successful save
                setExperience({
                    ...experience,
                    images: formData.images.filter(img => typeof img === 'string') as string[]
                });
                // Clear the deleted images list after successful save
                setDeletedImages([]);
            }

        } catch (err) {
            console.error('Save error:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    // Check if current step has changes
    const hasChangesInCurrentStep = () => {
        if (!experience) return false;

        switch (step) {
            case 1:
                return (
                    formData.title !== experience.title ||
                    formData.description !== experience.description ||
                    formData.price !== experience.price ||
                    formData.unit !== experience.unit
                );
            case 2:
                // Check availability changes (simplified)
                return true; // You can implement more detailed comparison
            case 3:
                // Check tags and travel companions changes
                const originalCompanions = experience.travel_companions ||
                    (experience.travel_companion ? [experience.travel_companion] : []);
                const currentCompanions = formData.travel_companions || [];

                return JSON.stringify(currentCompanions.sort()) !== JSON.stringify(originalCompanions.sort());
            case 4:
                // Check destination changes - including coordinates
                return (
                    formData.destination_name !== experience.destination?.name ||
                    formData.city !== experience.destination?.city ||
                    formData.destination_description !== experience.destination?.description ||
                    formData.latitude !== experience.destination?.latitude?.toString() ||
                    formData.longitude !== experience.destination?.longitude?.toString()
                );
            case 5:
                // Check image changes
                return deletedImages.length > 0 ||
                    formData.images?.some(img => typeof img === 'object') ||
                    formData.images?.length !== experience.images?.length;
            default:
                return false;
        }
    };

    // Step navigation
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    const renderStep = () => {
        if (!experience) return <View />;

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
                    deletedImages={deletedImages}
                    setDeletedImages={setDeletedImages}
                />;
            default:
                return null;
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
            {/* Header with Save button */}
            <View className="px-6 py-4 border-b border-gray-200 bg-white">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-blue-500 font-medium">Cancel</Text>
                    </TouchableOpacity>

                    <Text className="text-lg font-semibold">Edit Experience</Text>

                    {/* Save button */}
                    <TouchableOpacity
                        onPress={handleSaveCurrentStep}
                        disabled={isSaving || !hasChangesInCurrentStep()}
                        className={`px-4 py-2 rounded-lg ${hasChangesInCurrentStep() && !isSaving
                            ? 'bg-primary'
                            : 'bg-gray-200'
                            }`}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className={`font-medium ${hasChangesInCurrentStep() ? 'text-white' : 'text-gray-400'
                                }`}>
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
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

// Progress bar styles
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