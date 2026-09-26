/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    TrackChainLiftMode,
    TrackChainLiftStepDesc
} from "../../../../model/animation/jsonTypes";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickTrack} from "../../../ui/pickTrack";
import {createRideTileFields} from "./rideTileFields";
import {RideSelectFields} from "./rideSelectFields";

const MODE_LABELS = ["On", "Off", "Toggle"];
const MODE_VALUES: TrackChainLiftMode[] = ["on", "off", "toggle"];

function modeToIndex(mode: TrackChainLiftMode): number {
    for (let i = 0; i < MODE_VALUES.length; i++) {
        if (MODE_VALUES[i] === mode) {
            return i;
        }
    }
    return 0;
}

export function createTrackChainLiftFields(
    rideSelect: RideSelectFields,
    onPersist: () => void
) {
    const visibility = store<"visible" | "none">("none");
    const rideTile = createRideTileFields(rideSelect, onPersist, visibility);
    const trackType = store<number>(0);
    const modeIndex = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: TrackChainLiftStepDesc): void {
        visibility.set("visible");
        rideTile.load(desc, desc.rideId);
        trackType.set(desc.trackType);
        modeIndex.set(modeToIndex(desc.mode));
    }

    function persist(): TrackChainLiftStepDesc {
        const index = modeIndex.get();
        const mode = MODE_VALUES[index] || "on";
        return {
            type: "trackChainLift",
            ...rideTile.readTarget(),
            rideId: rideTile.getRideId(),
            trackType: trackType.get(),
            mode: mode
        };
    }

    const widgets = [
        groupbox({
            text: "Chain Lift",
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
                horizontal([
                    label({
                        text: "Mode",
                        width: 70,
                        visibility
                    }),
                    dropdown({
                        items: MODE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility,
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

export type TrackChainLiftFields = ReturnType<typeof createTrackChainLiftFields>;
