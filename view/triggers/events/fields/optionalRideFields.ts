/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, store, twoway} from "openrct2-flexui";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";
import {goToRideButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickRide} from "../../../ui/pickRide";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../rideOptions";

export type OptionalRideEvent = {
    rideId?: number;
    setRideId(rideId: number | undefined): void;
};

const ANY_RIDE_LABEL = "(Any Ride)";

export function createOptionalRideFields(
    getTrigger: () => Trigger | null,
    getEvent: (trigger: Trigger) => OptionalRideEvent | null,
    canPersist: () => boolean = () => true
) {
    const visibility = store<"visible" | "none">("none");
    const rideDropdownItems = store<string[]>([ANY_RIDE_LABEL]);
    const rideSelectedIndex = store<number>(0);
    let rideOptions: RideOption[] = [];

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set([ANY_RIDE_LABEL]);
            return;
        }
        rideDropdownItems.set([ANY_RIDE_LABEL].concat(rideNames(rideOptions)));
    }

    function hide(): void {
        visibility.set("none");
    }

    function save(trigger: Trigger): void {
        const event = getEvent(trigger);
        if (!event) {
            return;
        }
        const idx = rideSelectedIndex.get();
        if (idx <= 0 || idx > rideOptions.length) {
            event.setRideId(undefined);
        }
        else {
            event.setRideId(rideOptions[idx - 1].id);
        }
        getConductor().triggersArray.save();
    }

    function persistFromUi(): void {
        if (!canPersist()) {
            return;
        }
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        refreshRideOptions();
        const event = getEvent(trigger);
        if (!event) {
            hide();
            return;
        }
        visibility.set("visible");
        if (typeof event.rideId !== "number") {
            rideSelectedIndex.set(0);
            return;
        }
        let rideIndex = -1;
        for (let i = 0; i < rideOptions.length; i++) {
            if (rideOptions[i].id === event.rideId) {
                rideIndex = i;
                break;
            }
        }
        if (rideIndex < 0) {
            rideSelectedIndex.set(0);
            event.setRideId(undefined);
            getConductor().triggersArray.save();
            return;
        }
        rideSelectedIndex.set(rideIndex + 1);
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
                    persistFromUi();
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
                        persistFromUi();
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

    return {hide, load, save, widgets};
}

export type OptionalRideFields = ReturnType<typeof createOptionalRideFields>;
