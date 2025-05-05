// app/(traveler)/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TravelerIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(traveler)/(tabs)');
    }, []);

    return null;
}
