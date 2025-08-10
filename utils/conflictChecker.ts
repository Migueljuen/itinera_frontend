import type { ItineraryItem } from '../types/itineraryTypes';

interface TimeConflict {
    item1: ItineraryItem;
    item2: ItineraryItem;
    type: 'overlap' | 'no-gap' | 'insufficient-gap';
    gapMinutes?: number;
}

const getMinutesBetween = (endTime1: string, startTime2: string) => {
    const end1 = new Date(`2000-01-01T${endTime1}`);
    const start2 = new Date(`2000-01-01T${startTime2}`);
    return (start2.getTime() - end1.getTime()) / (1000 * 60);
};

export const checkTimeConflicts = (items: ItineraryItem[]): TimeConflict[] => {
    const conflicts: TimeConflict[] = [];

    const itemsByDay = items.reduce((acc, item) => {
        if (!acc[item.day_number]) acc[item.day_number] = [];
        acc[item.day_number].push(item);
        return acc;
    }, {} as Record<number, ItineraryItem[]>);

    Object.values(itemsByDay).forEach(dayItems => {
        const sortedItems = [...dayItems].sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
        );

        for (let i = 0; i < sortedItems.length - 1; i++) {
            const current = sortedItems[i];
            const next = sortedItems[i + 1];
            const gapMinutes = getMinutesBetween(current.end_time, next.start_time);

            if (gapMinutes < 0) {
                conflicts.push({ item1: current, item2: next, type: 'overlap' });
            } else if (gapMinutes === 0) {
                conflicts.push({
                    item1: current,
                    item2: next,
                    type: 'no-gap',
                    gapMinutes: 0
                });
            } else if (gapMinutes < 30) {
                conflicts.push({
                    item1: current,
                    item2: next,
                    type: 'insufficient-gap',
                    gapMinutes
                });
            }
        }
    });

    return conflicts;
};

export const getItemWarningStatus = (
    item: ItineraryItem,
    allItems: ItineraryItem[]
) => {
    const conflicts = checkTimeConflicts(allItems);
    const itemConflicts = conflicts.filter(
        c => c.item1.item_id === item.item_id || c.item2.item_id === item.item_id
    );

    if (itemConflicts.some(c => c.type === 'overlap')) {
        return { type: 'error', message: 'Time overlap!' };
    }
    if (itemConflicts.some(c => c.type === 'no-gap')) {
        return { type: 'warning', message: 'No travel time' };
    }
    if (itemConflicts.some(c => c.type === 'insufficient-gap')) {
        const minGap = Math.min(
            ...itemConflicts.filter(c => c.gapMinutes).map(c => c.gapMinutes!)
        );
        return { type: 'warning', message: `Only ${minGap}min gap` };
    }
    return null;
};

export const hasCriticalConflicts = (items: ItineraryItem[]) => {
    const conflicts = checkTimeConflicts(items);
    return conflicts.some(c => c.type === 'overlap');
};