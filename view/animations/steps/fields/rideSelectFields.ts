/// <reference path="./../../../../openrct2.d.ts" />

import {store} from "openrct2-flexui";
import {indexOfRideId, listParkRides, RideOption} from "../../../triggers/rideOptions";

/** Shared ride dropdown state for vehicle-target and track step fields. */
export function createRideSelectFields() {
    const rideDropdownItems = store<string[]>(["(No Rides)"]);
    const rideSelectedIndex = store<number>(0);
    let rideOptions: RideOption[] = [];

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set(["(No Rides)"]);
            rideSelectedIndex.set(0);
            return;
        }
        const names: string[] = [];
        for (let i = 0; i < rideOptions.length; i++) {
            names.push(rideOptions[i].name);
        }
        rideDropdownItems.set(names);
    }

    function selectedRideId(): number {
        const ride = rideOptions[rideSelectedIndex.get()];
        return ride ? ride.id : 0;
    }

    function selectRideId(rideId: number): boolean {
        const rideIndex = indexOfRideId(rideOptions, rideId);
        if (rideIndex < 0) {
            return false;
        }
        rideSelectedIndex.set(rideIndex);
        return true;
    }

    function setSelectedByRideId(rideId: number): void {
        rideSelectedIndex.set(Math.max(0, indexOfRideId(rideOptions, rideId)));
    }

    return {
        rideDropdownItems,
        rideSelectedIndex,
        get rideOptions() {
            return rideOptions;
        },
        refreshRideOptions,
        selectedRideId,
        selectRideId,
        setSelectedByRideId
    };
}

export type RideSelectFields = ReturnType<typeof createRideSelectFields>;
