/// <reference path="./../../../../openrct2.d.ts" />

import {horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {TileTargetDesc} from "../../../../model/animation/jsonTypes";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickTrack} from "../../../ui/pickTrack";
import {ConditionTileFields} from "./conditionTileFields";

export function createConditionTrackFields(tile: ConditionTileFields, onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const rideId = store<number>(0);
    const trackType = store<number>(0);

    function hide(): void {
        visibility.set("none");
        tile.hide();
    }

    function load(desc: TileTargetDesc & {rideId: number; trackType: number}): void {
        visibility.set("visible");
        tile.load(desc);
        rideId.set(desc.rideId);
        trackType.set(desc.trackType);
    }

    function read(): TileTargetDesc & {rideId: number; trackType: number} {
        return {
            ...tile.read(),
            rideId: rideId.get(),
            trackType: trackType.get()
        };
    }

    const widgets = [
        horizontal([
            label({
                text: "Ride Id",
                width: 50,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(rideId),
                minimum: 0,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    rideId.set(value);
                    onPersist();
                }
            }),
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
                        tile.setAbsoluteTile(picked.tile);
                        rideId.set(picked.rideId);
                        trackType.set(picked.trackType);
                        onPersist();
                    });
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type ConditionTrackFields = ReturnType<typeof createConditionTrackFields>;
