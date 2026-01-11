import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AnimatedHeartButtonProps {
    isSaved: boolean;
    onPress: () => void;
    size?: number;
}

const AnimatedHeartButton: React.FC<AnimatedHeartButtonProps> = ({
    isSaved,
    onPress,
    size = 28
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const particleAnims = useRef(
        Array(6).fill(0).map(() => ({
            scale: new Animated.Value(0),
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(0),
        }))
    ).current;
    const ringScale = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSaved) {
            // Main heart animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Ring animation
            Animated.parallel([
                Animated.timing(ringScale, {
                    toValue: 1.5,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(ringOpacity, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => {
                // Reset ring values after animation completes
                ringScale.setValue(0);
                ringOpacity.setValue(0);
            });

            // Particle animations
            particleAnims.forEach((anim, index) => {
                const angle = (index * 60) * Math.PI / 180;
                const distance = 40;

                Animated.parallel([
                    Animated.timing(anim.scale, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.translateX, {
                        toValue: Math.cos(angle) * distance,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.translateY, {
                        toValue: Math.sin(angle) * distance,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(anim.opacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.opacity, {
                            toValue: 0,
                            duration: 200,
                            delay: 100,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start(() => {
                    // Reset particle values
                    anim.scale.setValue(0);
                    anim.translateX.setValue(0);
                    anim.translateY.setValue(0);
                    anim.opacity.setValue(0);
                });
            });
        } else {
            // When unsaved, just do a simple scale animation without particles/ring
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Ensure particles and ring are hidden
            ringScale.setValue(0);
            ringOpacity.setValue(0);
            particleAnims.forEach((anim) => {
                anim.scale.setValue(0);
                anim.translateX.setValue(0);
                anim.translateY.setValue(0);
                anim.opacity.setValue(0);
            });
        }
    }, [isSaved]);

    const handlePress = () => {
        onPress();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            style={styles.container}
        >
            <View style={styles.animationContainer}>
                {/* Ring effect */}
                <Animated.View
                    style={[
                        styles.ring,
                        {
                            transform: [{ scale: ringScale }],
                            opacity: ringOpacity,
                        },
                    ]}
                />

                {/* Particles */}
                {particleAnims.map((anim, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                transform: [
                                    { translateX: anim.translateX },
                                    { translateY: anim.translateY },
                                    { scale: anim.scale },
                                ],
                                opacity: anim.opacity,
                            },
                        ]}
                    />
                ))}

                {/* Main heart */}
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                    }}
                >
                    <Ionicons
                        name={isSaved ? "heart" : "heart-outline"}
                        size={size}
                        color={isSaved ? "#fff" : "#fff"}
                    />
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        // Removed padding so parent can control it
    },
    animationContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    ring: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#EF4444',
    },
});

export default AnimatedHeartButton;