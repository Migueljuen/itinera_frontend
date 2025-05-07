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
        <View className="gap-4">
            <Text className="text-xl font-bold">Select Tags</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <View className="flex-row flex-wrap gap-2">
                    {availableTags.map((tag) => (
                        <Pressable
                            key={tag.tag_id}
                            onPress={() => toggleTag(tag.tag_id)}
                            className={`px-4 py-2 rounded-full border ${formData.tags.includes(tag.tag_id) ? 'bg-blue-600' : 'border-gray-300'}`}
                        >
                            <Text className={formData.tags.includes(tag.tag_id) ? 'text-white' : 'text-black'}>{tag.name}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            <View className="flex-row justify-between mt-4">
                <Pressable onPress={onBack} className="bg-gray-400 px-4 py-3 rounded-xl">
                    <Text className="text-white">Back</Text>
                </Pressable>
                <Pressable
                    onPress={formData.tags.length > 0 ? onNext : null}
                    className={`px-4 py-3 rounded-xl ${formData.tags.length > 0 ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <Text className="text-white">Next</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default Step3Tags;
