// app/(creator)/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CreatorIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(creator)/(tabs)');
    }, []);

    return null;
}
