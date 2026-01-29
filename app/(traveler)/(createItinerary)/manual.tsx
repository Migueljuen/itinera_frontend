import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// auth
import { useAuth } from "@/contexts/AuthContext";

// MANUAL steps
import Step1SelectLocation from "./(manual)/Step1SelectLocation";
import Step2DaySelection from "./(manual)/Step2DaySelection";

// SHARED steps
import MeetingPointStep from "./(generate)/MeetingPointStep";
import Step3aReviewServices from "./(generate)/Step3aReviewServices";
import Step4PaymentConfirmation from "./(generate)/step4PaymentConfirmation";

// --------------------
// Types (same pattern as generate.tsx)
// --------------------
interface LocationData {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
    experience_name?: string;
    experience_description?: string;
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
    price?: number;
    unit?: string;
}

interface TourGuide {
    guide_id: number;
    user_id: number;
    name: string;
    languages: string[] | string;
    bio: string | null;
    areas_covered: string;
    experience_years: number;
    availability_days: string[] | string;
    city: string;
    price_per_day: string | number;
    profile_pic?: string;
    avg_rating: string | number;
    review_count: number;
}

interface CarService {
    vehicle_id: number;
    vehicle_type: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    passenger_capacity: number;
    vehicle_photos?: string[] | string;
    price_per_day: string | number;
    city: string;
    driver_name: string;
    driver_id: number;
    driver_user_id: number;
    avg_rating: string | number;
    review_count: number;
}

interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    preferences?: {
        experiences: any[];
        travelerCount: number;
        travelCompanions?: any[];
        includeFoodSuggestions?: boolean,

    };
    tourGuide?: TourGuide | null;
    carService?: CarService | null;
    foodSuggestions?: any[]
}

// --------------------

const ManualItineraryForm: React.FC = () => {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuth();

    const [step, setStep] = useState(1);
    const stepCount = 4;

    const [savedItineraryId, setSavedItineraryId] = useState<number>(0);

    const [meetingPoint, setMeetingPoint] = useState<LocationData | null>(null);
    const [showMeetingPointModal, setShowMeetingPointModal] = useState(false);

    const [formData, setFormData] = useState<ItineraryFormData>({
        traveler_id: 0,
        start_date: "",
        end_date: "",
        title: "",
        notes: "Add notes here...",
        city: "",
        items: [],
        foodSuggestions: [],
        preferences: {
            experiences: [],
            travelerCount: 1,
            travelCompanions: [],
            includeFoodSuggestions: false,
        },

    });

    // --------------------
    // Sync traveler
    // --------------------
    useEffect(() => {
        if (user?.user_id && formData.traveler_id !== user.user_id) {
            setFormData((prev) => ({
                ...prev,
                traveler_id: user.user_id,
            }));
        }
    }, [user]);

    // --------------------
    // Navigation
    // --------------------
    const next = () => setStep((s) => Math.min(s + 1, stepCount));
    const back = () => setStep((s) => Math.max(s - 1, 1));

    // --------------------
    // Meeting point
    // --------------------
    const handleSelectMeetingPoint = () => setShowMeetingPointModal(true);

    const handleMeetingPointConfirmed = (loc: LocationData) => {
        setMeetingPoint(loc);
        setShowMeetingPointModal(false);
    };

    // --------------------
    // Cost calculations
    // --------------------
    const activityCost = () => {
        const count = formData.preferences?.travelerCount || 1;
        return formData.items.reduce((sum, item) => {
            const price = Number(item.price || 0);
            if (!price) return sum;
            if (item.unit?.toLowerCase() === "entry" || item.unit?.toLowerCase() === "person") {
                return sum + price * count;
            }
            return sum + price;
        }, 0);
    };

    const servicesCost = () => {
        let total = 0;
        if (formData.tourGuide?.price_per_day) {
            total += Number(formData.tourGuide.price_per_day);
        }
        if (formData.carService?.price_per_day) {
            total += Number(formData.carService.price_per_day);
        }
        return total;
    };

    const totalCost = () => activityCost() + servicesCost();

    // --------------------
    // Handle Step3a save - matches the signature expected by Step3aReviewServices
    // Step3aReviewServices handles itinerary creation internally and passes back the ID
    // --------------------
    const handleStep3aSave = (itineraryId: number) => {
        setSavedItineraryId(itineraryId);
        setStep(4);
    };

    // --------------------
    // Final completion
    // --------------------
    const handleFinalCompletion = () => {
        console.log("Itinerary process fully completed");
        router.replace("/");
    };

    // --------------------
    // Render steps
    // --------------------
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Step1SelectLocation
                        formData={formData}
                        setFormData={setFormData}
                        onNext={next}
                    />
                );

            case 2:
                return (
                    <Step2DaySelection
                        formData={formData}
                        setFormData={setFormData}
                        onNext={next}
                        onBack={back}
                    />
                );

            case 3:
                return (
                    <Step3aReviewServices
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleStep3aSave}
                        onBack={back}
                        onSelectMeetingPoint={handleSelectMeetingPoint}
                        meetingPoint={meetingPoint}
                    />
                );

            case 4:
                return (
                    <Step4PaymentConfirmation
                        formData={formData}
                        itineraryId={savedItineraryId}
                        totalCost={totalCost()}
                        onNext={handleFinalCompletion}
                        onBack={back}
                    />
                );

            default:
                return null;
        }
    };

    // --------------------
    // Guards
    // --------------------
    if (authLoading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>You must be logged in.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
                {renderStep()}
            </View>

            <Modal visible={showMeetingPointModal} animationType="slide" presentationStyle="fullScreen">
                <MeetingPointStep
                    initialLocation={meetingPoint}
                    onConfirm={handleMeetingPointConfirmed}
                    onBack={() => setShowMeetingPointModal(false)}
                />
            </Modal>
        </SafeAreaView>
    );
};

export default ManualItineraryForm;