/// <reference path="./../../../../openrct2.d.ts" />

import {button, checkbox, dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {walkRide} from "../../../../model/animation/trigger/rideCarSnapshot";
import {pickRide} from "../../../ui/pickRide";
import {RideSelectFields} from "./rideSelectFields";

export type VehicleTargetDescSlice = {
    useTriggerTarget?: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
};

export function createVehicleTargetFields(
    rideSelect: RideSelectFields,
    onPersist: () => void
) {
    const sectionVisibility = store<"visible" | "none">("none");
    const vehicleTargetVisibility = store<"visible" | "none">("none");
    const vehicleCarVisibility = store<"visible" | "none">("none");
    const useTriggerTargetChecked = store<boolean>(true);
    const applyToTriggerLabel = store<string>("Apply To Trigger Car");
    const vehicleSelectTitle = store<string>("Select Car");
    const trainDropdownItems = store<string[]>(["(No Trains)"]);
    const trainSelectedIndex = store<number>(0);
    const carDropdownItems = store<string[]>(["(No Cars)"]);
    const carSelectedIndex = store<number>(0);
    let isCarStep = false;

    function refreshTrainOptions(rideId: number, preferredIndex?: number): void {
        const ride = map.getRide(rideId);
        const count = ride ? ride.vehicles.length : 0;
        if (count === 0) {
            trainDropdownItems.set(["(No Trains)"]);
            trainSelectedIndex.set(0);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
            labels.push(`Train ${i + 1}`);
        }
        trainDropdownItems.set(labels);
        let index = typeof preferredIndex === "number" ? preferredIndex : trainSelectedIndex.get();
        if (index < 0 || index >= count) {
            index = 0;
        }
        trainSelectedIndex.set(index);
    }

    function refreshCarOptions(rideId: number, trainIndex: number, preferredIndex?: number): void {
        const cars = walkRide(rideId);
        let count = 0;
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].trainIndex === trainIndex) {
                count += 1;
            }
        }
        if (count === 0) {
            carDropdownItems.set(["(No Cars)"]);
            carSelectedIndex.set(0);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
            labels.push(`Car ${i + 1}`);
        }
        carDropdownItems.set(labels);
        let index = typeof preferredIndex === "number" ? preferredIndex : carSelectedIndex.get();
        if (index < 0 || index >= count) {
            index = 0;
        }
        carSelectedIndex.set(index);
    }

    function syncVehicleTargetVisibility(): void {
        const useTrigger = useTriggerTargetChecked.get();
        vehicleTargetVisibility.set(useTrigger ? "none" : "visible");
        vehicleCarVisibility.set(!useTrigger && isCarStep ? "visible" : "none");
    }

    function hide(): void {
        sectionVisibility.set("none");
        vehicleTargetVisibility.set("none");
        vehicleCarVisibility.set("none");
    }

    function load(desc: VehicleTargetDescSlice, carStep: boolean): void {
        isCarStep = carStep;
        sectionVisibility.set("visible");
        applyToTriggerLabel.set(carStep ? "Apply To Trigger Car" : "Apply To Trigger Train");
        vehicleSelectTitle.set(carStep ? "Select Car" : "Select Train");
        useTriggerTargetChecked.set(desc.useTriggerTarget !== false);
        syncVehicleTargetVisibility();
        rideSelect.refreshRideOptions();
        const rideId =
            typeof desc.rideId === "number" ? desc.rideId : rideSelect.selectedRideId();
        rideSelect.setSelectedByRideId(rideId);
        const resolvedRideId = rideSelect.selectedRideId();
        refreshTrainOptions(
            resolvedRideId,
            typeof desc.trainIndex === "number" ? desc.trainIndex : 0
        );
        if (carStep) {
            refreshCarOptions(
                resolvedRideId,
                trainSelectedIndex.get(),
                typeof desc.carIndex === "number" ? desc.carIndex : 0
            );
        }
    }

    function readTarget(): VehicleTargetDescSlice {
        const useTrigger = useTriggerTargetChecked.get();
        if (useTrigger) {
            return {useTriggerTarget: true};
        }
        const result: VehicleTargetDescSlice = {
            useTriggerTarget: false,
            rideId: rideSelect.selectedRideId(),
            trainIndex: trainSelectedIndex.get()
        };
        if (isCarStep) {
            result.carIndex = carSelectedIndex.get();
        }
        return result;
    }

    const widgets = [
        groupbox({
            text: vehicleSelectTitle,
            visibility: sectionVisibility,
            content: [
                checkbox({
                    text: applyToTriggerLabel,
                    isChecked: twoway(useTriggerTargetChecked),
                    visibility: sectionVisibility,
                    onChange: (checked) => {
                        useTriggerTargetChecked.set(checked);
                        syncVehicleTargetVisibility();
                        if (!checked) {
                            rideSelect.refreshRideOptions();
                            refreshTrainOptions(rideSelect.selectedRideId(), trainSelectedIndex.get());
                            if (isCarStep) {
                                refreshCarOptions(
                                    rideSelect.selectedRideId(),
                                    trainSelectedIndex.get(),
                                    carSelectedIndex.get()
                                );
                            }
                        }
                        onPersist();
                    }
                }),
                label({
                    text: "Ride",
                    visibility: vehicleTargetVisibility
                }),
                horizontal([
                    dropdown({
                        items: rideSelect.rideDropdownItems,
                        selectedIndex: twoway(rideSelect.rideSelectedIndex),
                        visibility: vehicleTargetVisibility,
                        onChange: (index) => {
                            rideSelect.rideSelectedIndex.set(index);
                            refreshTrainOptions(rideSelect.selectedRideId(), 0);
                            if (isCarStep) {
                                refreshCarOptions(rideSelect.selectedRideId(), trainSelectedIndex.get(), 0);
                            }
                            onPersist();
                        }
                    }),
                    button({
                        text: "Pick Ride",
                        width: 70,
                        height: 14,
                        visibility: vehicleTargetVisibility,
                        onClick: () => {
                            pickRide((rideId) => {
                                rideSelect.refreshRideOptions();
                                if (!rideSelect.selectRideId(rideId)) {
                                    return;
                                }
                                refreshTrainOptions(rideSelect.selectedRideId(), 0);
                                if (isCarStep) {
                                    refreshCarOptions(
                                        rideSelect.selectedRideId(),
                                        trainSelectedIndex.get(),
                                        0
                                    );
                                }
                                onPersist();
                            });
                        }
                    })
                ]),
                label({
                    text: "Train",
                    visibility: vehicleTargetVisibility
                }),
                dropdown({
                    items: trainDropdownItems,
                    selectedIndex: twoway(trainSelectedIndex),
                    visibility: vehicleTargetVisibility,
                    onChange: (index) => {
                        trainSelectedIndex.set(index);
                        if (isCarStep) {
                            refreshCarOptions(rideSelect.selectedRideId(), trainSelectedIndex.get(), 0);
                        }
                        onPersist();
                    }
                }),
                label({
                    text: "Car",
                    visibility: vehicleCarVisibility
                }),
                dropdown({
                    items: carDropdownItems,
                    selectedIndex: twoway(carSelectedIndex),
                    visibility: vehicleCarVisibility,
                    onChange: (index) => {
                        carSelectedIndex.set(index);
                        onPersist();
                    }
                })
            ]
        })
    ];

    return {hide, load, readTarget, widgets};
}

export type VehicleTargetFields = ReturnType<typeof createVehicleTargetFields>;
