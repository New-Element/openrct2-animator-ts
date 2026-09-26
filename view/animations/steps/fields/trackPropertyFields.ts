/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    BlockBrakeStepDesc,
    OnOffToggle,
    TrackBrakeSpeedStepDesc,
    TrackColourSchemeStepDesc,
    TrackHighlightedStepDesc,
    TrackInvertedStepDesc,
    TrackSeatRotationStepDesc
} from "../../../../model/animation/jsonTypes";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickTrack} from "../../../ui/pickTrack";
import {ON_OFF_TOGGLE, ON_OFF_TOGGLE_LABELS, indexOfValue} from "../../../triggers/conditions/labels";
import {createNumberSourceFields} from "./numberSourceFields";
import {createRideTileFields} from "./rideTileFields";
import {RideSelectFields} from "./rideSelectFields";

type TrackPropertyType =
    | "trackColourScheme"
    | "trackSeatRotation"
    | "trackInverted"
    | "trackBrakeSpeed"
    | "trackHighlighted"
    | "blockBrake";

const TITLES: {[type in TrackPropertyType]: string} = {
    trackColourScheme: "Track Colour Scheme",
    trackSeatRotation: "Seat Rotation",
    trackInverted: "Track Inverted",
    trackBrakeSpeed: "Brake / Booster Speed",
    trackHighlighted: "Track Highlighted",
    blockBrake: "Block Brake"
};

export function createTrackPropertyFields(rideSelect: RideSelectFields, onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const title = store<string>("Track");
    const rideTile = createRideTileFields(rideSelect, onPersist, visibility);
    const trackType = store<number>(0);
    const modeIndex = store<number>(0);
    const schemeVisibility = store<"visible" | "none">("none");
    const seatVisibility = store<"visible" | "none">("none");
    const brakeVisibility = store<"visible" | "none">("none");
    const modeVisibility = store<"visible" | "none">("none");
    const schemeFields = createNumberSourceFields({
        valueType: "int",
        label: "Scheme",
        minimum: 0,
        maximum: 3,
        onPersist: onPersist,
        visibility: schemeVisibility
    });
    const seatFields = createNumberSourceFields({
        valueType: "int",
        label: "Rotation",
        minimum: 0,
        maximum: 15,
        onPersist: onPersist,
        visibility: seatVisibility
    });
    const brakeFields = createNumberSourceFields({
        valueType: "int",
        label: "Speed",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: brakeVisibility
    });
    let currentType: TrackPropertyType = "trackColourScheme";

    function hideExtras(): void {
        schemeVisibility.set("none");
        seatVisibility.set("none");
        brakeVisibility.set("none");
        modeVisibility.set("none");
    }

    function hide(): void {
        visibility.set("none");
        hideExtras();
    }

    function showForType(type: TrackPropertyType): void {
        hideExtras();
        if (type === "trackColourScheme") {
            schemeVisibility.set("visible");
        } else if (type === "trackSeatRotation") {
            seatVisibility.set("visible");
        } else if (type === "trackBrakeSpeed") {
            brakeVisibility.set("visible");
        } else {
            modeVisibility.set("visible");
        }
    }

    function loadTrack(
        type: TrackPropertyType,
        desc: {rideId: number; trackType: number} & Parameters<typeof rideTile.load>[0]
    ): void {
        currentType = type;
        visibility.set("visible");
        title.set(TITLES[type]);
        rideTile.load(desc, desc.rideId);
        trackType.set(desc.trackType);
        showForType(type);
    }

    function load(desc:
        | TrackColourSchemeStepDesc
        | TrackSeatRotationStepDesc
        | TrackInvertedStepDesc
        | TrackBrakeSpeedStepDesc
        | TrackHighlightedStepDesc
        | BlockBrakeStepDesc
    ): void {
        loadTrack(desc.type, desc);
        if (desc.type === "trackColourScheme") {
            schemeFields.load(desc.colourScheme, desc.colourSchemeOrigin, desc.colourSchemeVariableId);
        } else if (desc.type === "trackSeatRotation") {
            seatFields.load(desc.seatRotation, desc.seatRotationOrigin, desc.seatRotationVariableId);
        } else if (desc.type === "trackBrakeSpeed") {
            brakeFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
        } else {
            modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
        }
    }

    function persist():
        | TrackColourSchemeStepDesc
        | TrackSeatRotationStepDesc
        | TrackInvertedStepDesc
        | TrackBrakeSpeedStepDesc
        | TrackHighlightedStepDesc
        | BlockBrakeStepDesc {
        const base = {
            ...rideTile.readTarget(),
            rideId: rideTile.getRideId(),
            trackType: trackType.get()
        };
        const mode = ON_OFF_TOGGLE[modeIndex.get()] || "on";
        if (currentType === "trackColourScheme") {
            const source = schemeFields.read();
            return {
                type: "trackColourScheme",
                ...base,
                colourScheme: source.value,
                ...(source.origin === "variable" ? {colourSchemeOrigin: "variable", colourSchemeVariableId: source.variableId || ""} : {})
            };
        }
        if (currentType === "trackSeatRotation") {
            const source = seatFields.read();
            return {
                type: "trackSeatRotation",
                ...base,
                seatRotation: source.value,
                ...(source.origin === "variable" ? {seatRotationOrigin: "variable", seatRotationVariableId: source.variableId || ""} : {})
            };
        }
        if (currentType === "trackBrakeSpeed") {
            const source = brakeFields.read();
            return {
                type: "trackBrakeSpeed",
                ...base,
                value: source.value,
                ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {})
            };
        }
        if (currentType === "trackInverted") {
            return {type: "trackInverted", ...base, mode: mode as OnOffToggle};
        }
        if (currentType === "trackHighlighted") {
            return {type: "trackHighlighted", ...base, mode: mode as OnOffToggle};
        }
        return {type: "blockBrake", ...base, mode: mode as OnOffToggle};
    }

    const widgets = [
        groupbox({
            text: title,
            visibility,
            content: [
                ...rideTile.widgets,
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
                                rideSelect.refreshRideOptions();
                                rideSelect.setSelectedByRideId(picked.rideId);
                                rideTile.setAbsoluteTile(picked.tile);
                                trackType.set(picked.trackType);
                                onPersist();
                            });
                        }
                    })
                ]),
                ...schemeFields.widgets,
                ...seatFields.widgets,
                ...brakeFields.widgets,
                horizontal([
                    label({text: "Mode", width: 70, visibility: modeVisibility}),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility: modeVisibility,
                        onChange: (index) => {
                            modeIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type TrackPropertyFields = ReturnType<typeof createTrackPropertyFields>;
