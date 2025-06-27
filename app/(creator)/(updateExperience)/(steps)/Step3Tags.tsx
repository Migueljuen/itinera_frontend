import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, Text, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import API_URL from '../../../../constants/api';
import { ExperienceFormData, TravelCompanionType } from '../../../../types/types';

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

const TRAVEL_COMPANIONS: TravelCompanionType[] = ['Solo', 'Partner', 'Family', 'Friends', 'Group', 'Any'];

const Step3EditTags: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [originalTags, setOriginalTags] = useState<number[]>([]);
    const [originalTravelCompanion, setOriginalTravelCompanion] = useState<ExperienceFormData['travel_companion']>('');
    const [originalTravelCompanions, setOriginalTravelCompanions] = useState<TravelCompanionType[]>([]);
    const [showAllSelected, setShowAllSelected] = useState(false);
    const [showAllAvailable, setShowAllAvailable] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_URL}/tags`);
                const data = await response.json();
                setAvailableTags(data.tags);

                // Store original values for comparison
                setOriginalTags([...formData.tags]);
                setOriginalTravelCompanion(formData.travel_companion);
                setOriginalTravelCompanions([...(formData.travel_companions || [])]);

                // Initialize travel_companions if it doesn't exist
                if (!formData.travel_companions && formData.travel_companion) {
                    setFormData({
                        ...formData,
                        travel_companions: [formData.travel_companion]
                    });
                }
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

    const toggleCompanion = (companion: TravelCompanionType) => {
        const currentCompanions = formData.travel_companions || [];

        if (currentCompanions.includes(companion)) {
            setFormData({
                ...formData,
                travel_companions: currentCompanions.filter((c) => c !== companion),
                travel_companion: '' // Clear the old single value
            });
        } else {
            setFormData({
                ...formData,
                travel_companions: [...currentCompanions, companion],
                travel_companion: '' // Clear the old single value
            });
        }
    };

    const selectedCompanions = formData.travel_companions || [];

    const hasChanges = () => {
        const tagsChanged = JSON.stringify(formData.tags.sort()) !== JSON.stringify(originalTags.sort());
        const companionsChanged = JSON.stringify((formData.travel_companions || []).sort()) !==
            JSON.stringify(originalTravelCompanions.sort());
        return tagsChanged || companionsChanged;
    };

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
                            travel_companion: originalTravelCompanion,
                            travel_companions: [...originalTravelCompanions]
                        });
                    }
                }
            ]
        );
    };

    const getTagNames = (tagIds: number[]) => {
        return availableTags
            .filter(tag => tagIds.includes(tag.tag_id))
            .map(tag => tag.name);
    };

    // Filter tags based on search
    const filteredTags = searchQuery
        ? availableTags.filter(tag =>
            tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : availableTags;

    // Get selected tags
    const selectedTags = availableTags.filter(tag => formData.tags.includes(tag.tag_id));
    const displayedSelectedTags = showAllSelected ? selectedTags : selectedTags.slice(0, 6);

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="px-4 py-6">
                <Text className="text-center text-xl font-onest-semibold mb-2">Edit Tags & Preferences</Text>
                <Text className="text-center text-sm text-gray-500 font-onest mb-6">
                    Update the tags and travel companion preferences for your experience.
                </Text>

                {/* Changes indicator */}
                {hasChanges() && (
                    <View className="bg-blue-50 p-3 rounded-xl mb-4">
                        <Text className="text-blue-600 text-sm text-center font-onest-medium">
                            ✓ Changes detected - ready to continue
                        </Text>
                    </View>
                )}

                {/* Travel Companion Selection */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-onest-medium text-base">Travel Companion Preferences</Text>
                        <Text className="text-sm text-gray-500">
                            {selectedCompanions.length} selected
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2">
                            {TRAVEL_COMPANIONS.map((option) => (
                                <Pressable
                                    key={option}
                                    onPress={() => toggleCompanion(option)}
                                    className={`px-4 py-2 rounded-full border ${selectedCompanions.includes(option)
                                            ? 'bg-primary border-primary'
                                            : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <View className="flex-row items-center">
                                        {selectedCompanions.includes(option) && (
                                            <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 4 }} />
                                        )}
                                        <Text className={`font-onest-medium ${selectedCompanions.includes(option) ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {option}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                    {JSON.stringify((formData.travel_companions || []).sort()) !==
                        JSON.stringify(originalTravelCompanions.sort()) && (
                            <Text className="text-xs text-gray-400 mt-2">
                                Original: {originalTravelCompanions.length > 0 ? originalTravelCompanions.join(', ') : 'None'}
                            </Text>
                        )}
                </View>

                {/* Selected Tags Summary */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-onest-medium text-base">
                            Selected Tags ({formData.tags.length})
                        </Text>
                        {selectedTags.length > 6 && (
                            <Pressable onPress={() => setShowAllSelected(!showAllSelected)}>
                                <Text className="text-primary font-onest-medium text-sm">
                                    {showAllSelected ? 'Show Less' : `Show All (${selectedTags.length})`}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {selectedTags.length === 0 ? (
                        <View className="bg-gray-50 p-4 rounded-xl">
                            <Text className="text-gray-500 text-center">No tags selected yet</Text>
                        </View>
                    ) : (
                        <View className="bg-gray-50 p-3 rounded-xl">
                            <View className="flex-row flex-wrap gap-2">
                                {displayedSelectedTags.map((tag) => (
                                    <Pressable
                                        key={tag.tag_id}
                                        onPress={() => toggleTag(tag.tag_id)}
                                        className="flex-row items-center bg-primary px-4 py-2 rounded-full border border-primary"
                                    >
                                        <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 4 }} />
                                        <Text className="text-white font-onest">{tag.name}</Text>
                                        <Pressable
                                            onPress={() => toggleTag(tag.tag_id)}
                                            className="ml-2"
                                        >
                                            <Ionicons name="close-circle" size={16} color="white" />
                                        </Pressable>
                                    </Pressable>
                                ))}
                                {!showAllSelected && selectedTags.length > 6 && (
                                    <View className="bg-gray-300 px-4 py-2 rounded-full border border-gray-300">
                                        <Text className="text-gray-700 font-onest">
                                            +{selectedTags.length - 6} more
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* All Available Tags */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-onest-medium text-base">All Available Tags</Text>
                        {!searchQuery && filteredTags.length > 12 && (
                            <Pressable onPress={() => setShowAllAvailable(!showAllAvailable)}>
                                <Text className="text-primary font-onest-medium text-sm">
                                    {showAllAvailable ? 'Show Less' : `Show All (${filteredTags.length})`}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Search Bar */}
                    <View className="mb-3">
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Ionicons name="search" size={20} color="#6B7280" />
                            <TextInput
                                placeholder="Search tags..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="flex-1 ml-2 font-onest"
                                placeholderTextColor="#9CA3AF"
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <View>
                            <View className="flex-row flex-wrap gap-2">
                                {(searchQuery || showAllAvailable ? filteredTags : filteredTags.slice(0, 12)).map((tag) => {
                                    const isSelected = formData.tags.includes(tag.tag_id);
                                    return (
                                        <Pressable
                                            key={tag.tag_id}
                                            onPress={() => toggleTag(tag.tag_id)}
                                            className={`px-4 py-2 rounded-full border ${isSelected
                                                ? 'bg-primary border-primary'
                                                : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            <View className="flex-row items-center">
                                                {isSelected && (
                                                    <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 4 }} />
                                                )}
                                                <Text className={`font-onest ${isSelected ? 'text-white' : 'text-gray-700'
                                                    }`}>
                                                    {tag.name}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                                {!searchQuery && !showAllAvailable && filteredTags.length > 12 && (
                                    <View className="bg-gray-300 px-4 py-2 rounded-full border border-gray-300">
                                        <Text className="text-gray-700 font-onest">
                                            +{filteredTags.length - 12} more
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {searchQuery && filteredTags.length === 0 && (
                        <Text className="text-gray-500 text-center mt-4">No tags found matching "{searchQuery}"</Text>
                    )}
                </View>

                {/* Changes Summary - Compact Version */}
                {hasChanges() && (
                    <View className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4">
                        <Text className="font-onest-medium text-amber-800 text-sm mb-1">Unsaved Changes:</Text>
                        {JSON.stringify((formData.travel_companions || []).sort()) !==
                            JSON.stringify(originalTravelCompanions.sort()) && (
                                <Text className="text-amber-700 text-xs">
                                    • Companions: {originalTravelCompanions.length} → {selectedCompanions.length} selected
                                </Text>
                            )}
                        {JSON.stringify(formData.tags.sort()) !== JSON.stringify(originalTags.sort()) && (
                            <Text className="text-amber-700 text-xs">
                                • Tags: {originalTags.length} → {formData.tags.length} selected
                            </Text>
                        )}
                    </View>
                )}

                {/* Reset button */}
                {hasChanges() && (
                    <Pressable
                        onPress={resetToOriginal}
                        className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50"
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
                        onPress={formData.tags.length > 0 && selectedCompanions.length > 0 ? onNext : undefined}
                        className={`p-4 px-6 rounded-xl ${formData.tags.length > 0 && selectedCompanions.length > 0
                                ? 'bg-primary'
                                : 'bg-gray-200'
                            }`}
                        disabled={!(formData.tags.length > 0 && selectedCompanions.length > 0)}
                    >
                        <Text className={`text-center font-onest-medium text-base ${formData.tags.length > 0 && selectedCompanions.length > 0
                                ? 'text-white'
                                : 'text-gray-400'
                            }`}>
                            {hasChanges() ? 'Continue with changes' : 'Next step'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default Step3EditTags;