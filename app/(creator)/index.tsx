// app/(creator)/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function CreatorIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(creator)/(tabs)/dashboard');
    }, []);

    return null;
}
