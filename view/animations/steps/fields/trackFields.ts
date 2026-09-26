/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {TrackSetHeightStepDesc} from "../../../../model/animation/jsonTypes";
import {createNumberSourceFields} from "./numberSourceFields";
import {createRideTileFields} from "./rideTileFields";
import {RideSelectFields} from "./rideSelectFields";

export function createTrackFields(rideSelect: RideSelectFields, onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const rideTile = createRideTileFields(rideSelect, onPersist, visibility);
    const trackType = store<number>(0);
    const baseHeightFields = createNumberSourceFields({
        valueType: "int",
        label: "Height",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: visibility
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: TrackSetHeightStepDesc): void {
        visibility.set("visible");
        rideTile.load(desc, desc.rideId);
        trackType.set(desc.trackType);
        baseHeightFields.load(desc.baseHeight, desc.baseHeightOrigin, desc.baseHeightVariableId);
    }

    function persist(): TrackSetHeightStepDesc {
        const source = baseHeightFields.read();
        return {
            type: "trackSetHeight",
            ...rideTile.readTarget(),
            rideId: rideTile.getRideId(),
            trackType: trackType.get(),
            baseHeight: source.value,
            ...(source.origin === "variable" ? {baseHeightOrigin: "variable", baseHeightVariableId: source.variableId || ""} : {})
        };
    }

    const widgets = [
        groupbox({
            text: "Track",
            visibility,
            content: [
                ...rideTile.widgets,
                horizontal([
                    label({
                        text: "Track Type",
                        width: 70,
                        visibility
                    }),
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
                    })
                ]),
                ...baseHeightFields.widgets
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type TrackFields = ReturnType<typeof createTrackFields>;
