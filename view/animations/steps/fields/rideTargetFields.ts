/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, compute, dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {goToRideButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickRide} from "../../../ui/pickRide";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../../triggers/rideOptions";

export function createRideTargetFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const useTrigger = store<boolean>(true);
    const pickVisibility = compute(visibility, useTrigger, (shown, trigger) => {
        return shown === "visible" && !trigger ? "visible" : "none";
    });
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
        rideDropdownItems.set(rideNames(rideOptions));
    }

    function hide(): void {
        visibility.set("none");
    }

    function load(useTriggerRide: boolean | undefined, rideId: number | undefined): void {
        visibility.set("visible");
        useTrigger.set(useTriggerRide !== false);
        refreshRideOptions();
        if (typeof rideId === "number") {
            const index = indexOfRideId(rideOptions, rideId);
            rideSelectedIndex.set(index < 0 ? 0 : index);
        }
    }

    function read(): {useTriggerRide: boolean; rideId?: number} {
        if (useTrigger.get()) {
            return {useTriggerRide: true};
        }
        const ride = rideOptions[rideSelectedIndex.get()];
        return {useTriggerRide: false, rideId: ride ? ride.id : 0};
    }

    const widgets = [
        groupbox({
            text: "Ride",
            visibility,
            content: [
                checkbox({
                    text: "Use Trigger Ride",
                    isChecked: twoway(useTrigger),
                    visibility,
                    onChange: (checked) => {
                        useTrigger.set(checked);
                        if (!checked) {
                            refreshRideOptions();
                        }
                        onPersist();
                    }
                }),
                horizontal({
                    content: [
                        dropdown({
                            items: rideDropdownItems,
                            selectedIndex: twoway(rideSelectedIndex),
                            visibility: pickVisibility,
                            onChange: (index) => {
                                rideSelectedIndex.set(index);
                                onPersist();
                            }
                        }),
                        pickIconButton({
                            tooltip: "Pick Ride",
                            visibility: pickVisibility,
                            onClick: () => {
                                pickRide((rideId) => {
                                    refreshRideOptions();
                                    const index = indexOfRideId(rideOptions, rideId);
                                    if (index < 0) {
                                        return;
                                    }
                                    rideSelectedIndex.set(index);
                                    onPersist();
                                });
                            }
                        }),
                        goToRideButton({
                            visibility: pickVisibility,
                            getRideId: () => {
                                const ride = rideOptions[rideSelectedIndex.get()];
                                return ride ? ride.id : undefined;
                            }
                        })
                    ]
                })
            ]
        })
    ];

    return {hide, load, read, widgets};
}

export type RideTargetFields = ReturnType<typeof createRideTargetFields>;

const NONE_RIDE_LABEL = "(None)";

export function createOptionalRidePickFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const rideDropdownItems = store<string[]>([NONE_RIDE_LABEL]);
    const rideSelectedIndex = store<number>(0);
    let rideOptions: RideOption[] = [];

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set([NONE_RIDE_LABEL]);
            return;
        }
        rideDropdownItems.set([NONE_RIDE_LABEL].concat(rideNames(rideOptions)));
    }

    function hide(): void {
        visibility.set("none");
    }

    function load(rideId: number | undefined): void {
        refreshRideOptions();
        visibility.set("visible");
        if (typeof rideId !== "number") {
            rideSelectedIndex.set(0);
            return;
        }
        const rideIndex = indexOfRideId(rideOptions, rideId);
        rideSelectedIndex.set(rideIndex < 0 ? 0 : rideIndex + 1);
    }

    function read(): number | undefined {
        const idx = rideSelectedIndex.get();
        if (idx <= 0 || idx > rideOptions.length) {
            return undefined;
        }
        return rideOptions[idx - 1].id;
    }

    const widgets = [
        label({
            text: "Ride",
            visibility
        }),
        horizontal([
            dropdown({
                items: rideDropdownItems,
                selectedIndex: twoway(rideSelectedIndex),
                visibility,
                onChange: (index) => {
                    rideSelectedIndex.set(index);
                    onPersist();
                }
            }),
            pickIconButton({
                tooltip: "Pick Ride",
                visibility,
                onClick: () => {
                    pickRide((rideId) => {
                        refreshRideOptions();
                        const rideIndex = indexOfRideId(rideOptions, rideId);
                        if (rideIndex < 0) {
                            return;
                        }
                        rideSelectedIndex.set(rideIndex + 1);
                        onPersist();
                    });
                }
            }),
            goToRideButton({
                visibility,
                disabled: compute(rideSelectedIndex, (index) => index <= 0),
                getRideId: () => {
                    const idx = rideSelectedIndex.get();
                    if (idx <= 0 || idx > rideOptions.length) {
                        return undefined;
                    }
                    return rideOptions[idx - 1].id;
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type OptionalRidePickFields = ReturnType<typeof createOptionalRidePickFields>;
