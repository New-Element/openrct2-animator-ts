/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {TrackSetHeightStepDesc} from "../../../../model/animation/jsonTypes";
import {createRideTileFields} from "./rideTileFields";
import {RideSelectFields} from "./rideSelectFields";

export function createTrackFields(rideSelect: RideSelectFields, onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const rideTile = createRideTileFields(rideSelect, onPersist, visibility);
    const trackType = store<number>(0);
    const trackBaseHeight = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: TrackSetHeightStepDesc): void {
        visibility.set("visible");
        rideTile.load(desc.tile, desc.rideId);
        trackType.set(desc.trackType);
        trackBaseHeight.set(desc.baseHeight);
    }

    function persist(): TrackSetHeightStepDesc {
        return {
            type: "trackSetHeight",
            tile: rideTile.getTile(),
            rideId: rideTile.getRideId(),
            trackType: trackType.get(),
            baseHeight: trackBaseHeight.get()
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
                        value: twoway(trackType),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            trackType.set(value);
                            onPersist();
                        }
                    }),
                    label({
                        text: "Height",
                        width: 45,
                        visibility
                    }),
                    spinner({
                        value: twoway(trackBaseHeight),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            trackBaseHeight.set(value);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type TrackFields = ReturnType<typeof createTrackFields>;
