import { ExperienceImage } from "@/types/experienceDetails";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getFormattedImageUrl } from "../utils/formatters";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 320;

type HeroImageCarouselProps = {
    images: ExperienceImage[];
    scrollY: Animated.Value;
};

export const HeroImageCarousel: React.FC<HeroImageCarouselProps> = ({
    images,
    scrollY,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fullscreenFlatListRef = useRef<FlatList>(null);

    const imageScale = scrollY.interpolate({
        inputRange: [-150, 0],
        outputRange: [1.5, 1],
        extrapolate: "clamp",
    });

    const imageTranslateY = scrollY.interpolate({
        inputRange: [-150, 0, 150],
        outputRange: [-50, 0, -75],
        extrapolate: "clamp",
    });

    const handleScroll = (event: any) => {
        const { contentOffset, layoutMeasurement } = event.nativeEvent;
        const index = Math.round(contentOffset.x / layoutMeasurement.width);
        setActiveIndex(index);
    };

    const handleFullscreenScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(index);
    };

    const handleFullscreenLayout = () => {
        if (activeIndex > 0 && fullscreenFlatListRef.current) {
            setTimeout(() => {
                fullscreenFlatListRef.current?.scrollToOffset({
                    offset: SCREEN_WIDTH * activeIndex,
                    animated: false,
                });
            }, 50);
        }
    };

    // No images or error state
    if (!images || images.length === 0 || imageError) {
        return (
            <View className="w-full h-80 justify-center items-center bg-gray-100">
                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 font-onest mt-2">
                    {imageError ? "Failed to load image" : "No image available"}
                </Text>
            </View>
        );
    }

    return (
        <>
            <Animated.View style={{ height: IMAGE_HEIGHT, overflow: "hidden" }}>
                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setIsFullscreen(true)}
                        >
                            <Animated.Image
                                source={{ uri: getFormattedImageUrl(item.image_url)! }}
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: IMAGE_HEIGHT,
                                    transform: [
                                        { translateY: imageTranslateY },
                                        { scale: imageScale },
                                    ],
                                }}
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        </TouchableOpacity>
                    )}
                />

                {/* Image Indicators */}
                {images.length > 1 && (
                    <ImageIndicators
                        count={images.length}
                        activeIndex={activeIndex}
                        bottom={32}
                    />
                )}
            </Animated.View>

            {/* Fullscreen Modal */}
            <Modal
                visible={isFullscreen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsFullscreen(false)}
            >
                <View style={{ flex: 1, backgroundColor: "black" }}>
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top: 50,
                            right: 20,
                            zIndex: 10,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            borderRadius: 20,
                            padding: 8,
                        }}
                        onPress={() => setIsFullscreen(false)}
                    >
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>

                    <FlatList
                        ref={fullscreenFlatListRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onLayout={handleFullscreenLayout}
                        onScroll={handleFullscreenScroll}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: "100%",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Image
                                    source={{ uri: getFormattedImageUrl(item.image_url)! }}
                                    style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    />

                    {images.length > 1 && (
                        <ImageIndicators
                            count={images.length}
                            activeIndex={activeIndex}
                            bottom={40}
                        />
                    )}
                </View>
            </Modal>
        </>
    );
};

// Extracted sub-component for indicators
type ImageIndicatorsProps = {
    count: number;
    activeIndex: number;
    bottom: number;
};

const ImageIndicators: React.FC<ImageIndicatorsProps> = ({
    count,
    activeIndex,
    bottom,
}) => (
    <View
        style={{
            position: "absolute",
            bottom,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
        }}
    >
        {Array.from({ length: count }).map((_, index) => (
            <View
                key={index}
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                        index === activeIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                }}
            />
        ))}
    </View>
);

export default HeroImageCarousel;