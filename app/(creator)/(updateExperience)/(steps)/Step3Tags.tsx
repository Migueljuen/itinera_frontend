import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import API_URL from '../../../../constants/api';
import { ExperienceFormData } from '../../../../types/types';

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
}

type Tag = {
    tag_id: number;
    name: string;
};

const TRAVEL_COMPANIONS = ['Solo', 'Partner', 'Family', 'Friends', 'Group', 'Any'] as const;

const Step3EditTags: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [originalTags, setOriginalTags] = useState<number[]>([]);
    const [originalTravelCompanion, setOriginalTravelCompanion] = useState<ExperienceFormData['travel_companion']>('');

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_URL}/tags`);
                const data = await response.json();
                setAvailableTags(data.tags);

                // Store original values for comparison
                setOriginalTags([...formData.tags]);
                setOriginalTravelCompanion(formData.travel_companion);
            } catch (err) {
                console.error('Failed to load tags:', err);
                Alert.alert('Error', 'Failed to load available tags');
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, []);

    const toggleTag = (tagId: number) => {
        if (formData.tags.includes(tagId)) {
            setFormData({
                ...formData,
                tags: formData.tags.filter((id) => id !== tagId),
            });
        } else {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagId],
            });
        }
    };

    const setCompanion = (value: ExperienceFormData['travel_companion']) => {
        setFormData({
            ...formData,
            travel_companion: value,
        });
    };

    // Check if there are changes from original
    const hasChanges = () => {
        const tagsChanged = JSON.stringify(formData.tags.sort()) !== JSON.stringify(originalTags.sort());
        const companionChanged = formData.travel_companion !== originalTravelCompanion;
        return tagsChanged || companionChanged;
    };

    // Reset to original values
    const resetToOriginal = () => {
        Alert.alert(
            'Reset Changes',
            'Are you sure you want to reset all tag and travel companion changes?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        setFormData({
                            ...formData,
                            tags: [...originalTags],
                            travel_companion: originalTravelCompanion
                        });
                    }
                }
            ]
        );
    };

    // Get tag names from IDs for comparison display
    const getTagNames = (tagIds: number[]) => {
        return availableTags
            .filter(tag => tagIds.includes(tag.tag_id))
            .map(tag => tag.name);
    };

    return (
        <ScrollView className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">Edit Tags & Preferences</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                Update the tags and travel companion preferences for your experience.
            </Text>

            {/* Changes indicator */}
            {hasChanges() && (
                <View className="bg-blue-50 p-3 rounded-xl mb-4 mx-4">
                    <Text className="text-blue-600 text-sm text-center font-onest-medium">
                        ✓ Changes detected - ready to continue
                    </Text>
                </View>
            )}

            {/* Travel Companion Selection */}
            <View className="mb-6 mx-4">
                <Text className="font-onest-medium text-base mb-2">What's this experience best suited with?</Text>
                <View className="flex-row flex-wrap gap-2 justify-start">
                    {TRAVEL_COMPANIONS.map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setCompanion(option)}
                            className={`px-4 py-2 rounded-full border ${formData.travel_companion === option
                                ? 'bg-gray-700 border-primary'
                                : 'bg-white border-gray-300'
                                }`}
                        >
                            <Text className={formData.travel_companion === option ? 'text-white' : 'text-gray-800'}>
                                {option}
                                {/* Show original indicator */}
                                {option === originalTravelCompanion && option !== formData.travel_companion && (
                                    <Text className="text-xs"> (original)</Text>
                                )}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Show original travel companion if changed */}
                {formData.travel_companion !== originalTravelCompanion && (
                    <Text className="text-xs text-gray-400 mt-2 px-1">
                        Original: {originalTravelCompanion}
                    </Text>
                )}
            </View>

            <View className="flex justify-evenly gap-4 border-t pt-8 border-gray-200 mx-4">
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <View className="bg-white pb-4">
                        <Text className="font-onest-medium py-2">Available tags</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {availableTags.map((tag) => (
                                <Pressable
                                    key={tag.tag_id}
                                    onPress={() => toggleTag(tag.tag_id)}
                                    className={`px-4 py-2 rounded-full border ${formData.tags.includes(tag.tag_id)
                                        ? 'bg-gray-700'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={formData.tags.includes(tag.tag_id) ? 'text-white' : 'text-gray-800'}>
                                        {tag.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Current Selected Tags */}
                <View className="bg-white pb-4 mt-4">
                    <Text className="font-onest-medium py-2">
                        Currently selected ({formData.tags.length})
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {availableTags
                            .filter(tag => formData.tags.includes(tag.tag_id))
                            .map((tag) => (
                                <View key={tag.tag_id} className="flex-row items-center bg-gray-700 px-4 py-2 rounded-full">
                                    <Text className="text-white">{tag.name}</Text>
                                    <Pressable
                                        onPress={() => toggleTag(tag.tag_id)}
                                        className="ml-2"
                                    >
                                        <Text className="text-white text-xs">✕</Text>
                                    </Pressable>
                                </View>
                            ))}
                    </View>

                    {formData.tags.length === 0 && (
                        <Text className="text-gray-400 text-sm mt-2">No tags selected</Text>
                    )}
                </View>

                {/* Original vs Current Comparison */}
                {hasChanges() && (
                    <View className="bg-gray-50 p-4 rounded-xl mt-4">
                        <Text className="font-onest-semibold text-gray-700 mb-2">Changes Summary:</Text>

                        {formData.travel_companion !== originalTravelCompanion && (
                            <View className="mb-2">
                                <Text className="text-sm text-gray-600">
                                    Travel Companion: {originalTravelCompanion} → {formData.travel_companion}
                                </Text>
                            </View>
                        )}

                        {JSON.stringify(formData.tags.sort()) !== JSON.stringify(originalTags.sort()) && (
                            <View>
                                <Text className="text-sm text-gray-600 mb-1">Tags changed:</Text>
                                <Text className="text-xs text-gray-500">
                                    Before: {getTagNames(originalTags).join(', ') || 'None'}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    After: {getTagNames(formData.tags).join(', ') || 'None'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Reset button */}
                {hasChanges() && (
                    <Pressable
                        onPress={resetToOriginal}
                        className="mt-2 p-3 rounded-xl border border-red-200 bg-red-50"
                    >
                        <Text className="text-center font-onest-medium text-sm text-red-600">
                            Reset to Original Values
                        </Text>
                    </Pressable>
                )}

                {/* Navigation buttons */}
                <View className="flex-row justify-between mt-6">
                    <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                        <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                    </Pressable>
                    <Pressable
                        onPress={formData.tags.length > 0 && formData.travel_companion ? onNext : undefined}
                        className={`p-4 px-6 rounded-xl ${formData.tags.length > 0 && formData.travel_companion ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        disabled={!(formData.tags.length > 0 && formData.travel_companion)}
                    >
                        <Text className="text-center font-onest-medium text-base text-gray-300">
                            {hasChanges() ? 'Continue with changes' : 'Next step'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default Step3EditTags;