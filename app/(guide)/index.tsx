// app/(guide)/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function GuideIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(guide)/(tabs)');
    }, []);

    return null;
}
