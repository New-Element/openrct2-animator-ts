/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    CarMoveToTrackStepDesc,
    CarNumberStepDesc,
    CarStatusStepDesc,
    CarToggleStepDesc,
    OnOffToggle
} from "../../../../model/animation/jsonTypes";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickTrack} from "../../../ui/pickTrack";
import {
    indexOfValue,
    labelsForValues,
    ON_OFF_TOGGLE,
    ON_OFF_TOGGLE_LABELS,
    VEHICLE_STATUSES
} from "../../../triggers/conditions/labels";
import {createNumberSourceFields} from "./numberSourceFields";
import {createTileTargetFields} from "./tileTargetFields";
import {VehicleTargetDescSlice} from "./vehicleTargetFields";

const STATUS_LABELS = labelsForValues(VEHICLE_STATUSES);

export function createCarNumberFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const valueFields = createNumberSourceFields({
        valueType: "int",
        label: "Value",
        minimum: -100000,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: CarNumberStepDesc): void {
        visibility.set("visible");
        valueFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
    }

    function read() {
        return valueFields.read();
    }

    const widgets = [
        groupbox({
            text: "Value",
            visibility,
            content: [
                ...valueFields.widgets
            ]
        })
    ];

    return {hide, load, read, widgets};
}

export function createCarToggleFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const modeIndex = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: CarToggleStepDesc): void {
        visibility.set("visible");
        modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
    }

    function readMode(): OnOffToggle {
        return ON_OFF_TOGGLE[modeIndex.get()] || "on";
    }

    const widgets = [
        groupbox({
            text: "Mode",
            visibility,
            content: [
                dropdown({
                    items: ON_OFF_TOGGLE_LABELS,
                    selectedIndex: twoway(modeIndex),
                    visibility,
                    onChange: (index) => {
                        modeIndex.set(index);
                        onPersist();
                    }
                })
            ]
        })
    ];

    return {hide, load, readMode, widgets};
}

export function createCarStatusFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const statusIndex = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: CarStatusStepDesc): void {
        visibility.set("visible");
        statusIndex.set(indexOfValue(VEHICLE_STATUSES, desc.status));
    }

    function readStatus(): VehicleStatus {
        return VEHICLE_STATUSES[statusIndex.get()] || VEHICLE_STATUSES[0];
    }

    const widgets = [
        groupbox({
            text: "Status",
            visibility,
            content: [
                dropdown({
                    items: STATUS_LABELS,
                    selectedIndex: twoway(statusIndex),
                    visibility,
                    onChange: (index) => {
                        statusIndex.set(index);
                        onPersist();
                    }
                })
            ]
        })
    ];

    return {hide, load, readStatus, widgets};
}

export function createCarMoveToTrackFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const rideId = store<number>(0);
    const trackType = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: CarMoveToTrackStepDesc): void {
        visibility.set("visible");
        tileTarget.load(desc);
        rideId.set(typeof desc.rideId === "number" ? desc.rideId : 0);
        trackType.set(desc.trackType);
    }

    function persist(target: VehicleTargetDescSlice): CarMoveToTrackStepDesc {
        const desc: CarMoveToTrackStepDesc = {
            type: "carMoveToTrack",
            useTriggerTarget: target.useTriggerTarget,
            trainIndex: target.trainIndex,
            carIndex: target.carIndex,
            ...tileTarget.readTarget(),
            trackType: trackType.get()
        };
        if (target.useTriggerTarget === false && typeof target.rideId === "number") {
            desc.rideId = target.rideId;
        } else if (rideId.get()) {
            desc.rideId = rideId.get();
        }
        return desc;
    }

    const widgets = [
        groupbox({
            text: "Track Piece",
            visibility,
            content: [
                ...tileTarget.widgets,
                horizontal([
                    label({text: "Track Type", width: 70, visibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(trackType),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            trackType.set(value);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Track",
                        visibility,
                        onClick: () => {
                            pickTrack((picked) => {
                                tileTarget.setAbsoluteTile(picked.tile);
                                rideId.set(picked.rideId);
                                trackType.set(picked.trackType);
                                onPersist();
                            });
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type CarNumberFields = ReturnType<typeof createCarNumberFields>;
export type CarToggleFields = ReturnType<typeof createCarToggleFields>;
export type CarStatusFields = ReturnType<typeof createCarStatusFields>;
export type CarMoveToTrackFields = ReturnType<typeof createCarMoveToTrackFields>;
