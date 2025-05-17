import React from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import Option1 from '../../../assets/images/option1.svg';
import Option2 from '../../../assets/images/option2.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router'

const SelectionScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ padding: 16 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="text-center py-2">
                            <Text className="text-center text-xl font-onest-semibold my-4">Getting started</Text>
                            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                                You can either build your own itinerary step-by-step or let us generate one based on your travel preferences.
                            </Text>
                            <View className='flex flex-col items-center  w-11/12 m-auto'>
                                <TouchableOpacity onPress={() => router.push('/manual')} className='size-80  rounded-md bg-primary flex-col justify-center items-center gap-2 my-4'>
                                    <Option1 width={100} height={100} />
                                    <Text className='mt-8 font-onest text-gray-50'>Create My Own Itinerary</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => router.push('/generate')} className='size-80 rounded-md bg-yellow-200 flex-col justify-center items-center gap-2'>
                                    <Option2 width={100} height={100} />
                                    <Text className='mt-8 font-onest text-gray-950'>Generate Itinerary</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SelectionScreen;
