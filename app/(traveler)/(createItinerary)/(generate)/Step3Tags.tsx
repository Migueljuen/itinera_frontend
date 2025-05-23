import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { ExperienceFormData } from '../../../../types/types';
import API_URL from '../../../../constants/api';
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

const Step3Tags: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_URL}/tags`);
                const data = await response.json();
                setAvailableTags(data.tags);
            } catch (err) {
                console.error('Failed to load tags:', err);
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

    return (
        <View className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">Select Tags</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">Choose tags to categorize and help others discover your experience.</Text>

            <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <View className="bg-white pb-4 h-96">
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


                <View className="bg-white h-40 pb-4 mt-4">
                    <Text className="font-onest-medium py-2">Selected tags ({formData.tags.length})</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {availableTags
                            .filter(tag => formData.tags.includes(tag.tag_id))
                            .map((tag) => (
                                <View key={tag.tag_id} className="flex-row items-center bg-gray-700 px-4 py-2 rounded-full">
                                    <Text className="text-white">{tag.name}</Text>
                                </View>
                            ))}
                    </View>
                </View>


                <View className="flex-row justify-between mt-4">
                    <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                        <Text className="text-gray-800">Previous step</Text>
                    </Pressable>
                    <Pressable
                        onPress={formData.tags.length > 0 ? onNext : undefined}
                        className={`p-4 px-6 rounded-xl ${formData.tags.length > 0 ? 'bg-primary' : 'bg-gray-200'
                            }`}
                    >
                        <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default Step3Tags;
