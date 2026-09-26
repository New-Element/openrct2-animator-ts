/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, store, twoway} from "openrct2-flexui";
import {goToRideButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickRide} from "../../../ui/pickRide";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../rideOptions";

const TRIGGER_RIDE_LABEL = "(Trigger Ride)";

export function createConditionRideFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const rideDropdownItems = store<string[]>([TRIGGER_RIDE_LABEL]);
    const rideSelectedIndex = store<number>(0);
    let rideOptions: RideOption[] = [];

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set([TRIGGER_RIDE_LABEL]);
            return;
        }
        rideDropdownItems.set([TRIGGER_RIDE_LABEL].concat(rideNames(rideOptions)));
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
        if (rideIndex < 0) {
            rideSelectedIndex.set(0);
            return;
        }
        rideSelectedIndex.set(rideIndex + 1);
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

export type ConditionRideFields = ReturnType<typeof createConditionRideFields>;
