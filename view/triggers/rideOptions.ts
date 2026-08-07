/// <reference path="./../../openrct2.d.ts" />

export interface RideOption {
    id: number;
    name: string;
}

/**
 * Park rides for dropdowns, sorted by name (Ride Vehicle Editor style).
 */
export function listParkRides(): RideOption[] {
    const rides = map.rides.filter((ride) => ride.classification === "ride");
    rides.sort((a, b) => {
        const byName = a.name.localeCompare(b.name);
        if (byName !== 0) {
            return byName;
        }
        return a.id - b.id;
    });
    const options: RideOption[] = [];
    for (let i = 0; i < rides.length; i++) {
        options.push({
            id: rides[i].id,
            name: rides[i].name
        });
    }
    return options;
}

export function rideNames(options: RideOption[]): string[] {
    const names: string[] = [];
    for (let i = 0; i < options.length; i++) {
        names.push(options[i].name);
    }
    return names;
}

export function indexOfRideId(options: RideOption[], rideId: number): number {
    for (let i = 0; i < options.length; i++) {
        if (options[i].id === rideId) {
            return i;
        }
    }
    return options.length > 0 ? 0 : -1;
}
