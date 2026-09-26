/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {VehicleLocationMode} from "../../../../model/animation/jsonTypes";
import {indexOfValue, LOCATION_MODE_LABELS, LOCATION_MODES} from "../labels";
import {CompareFields} from "./compareFields";
import {ConditionTileFields} from "./conditionTileFields";

export function createVehicleLocationFields(
    onPersist: () => void,
    tile: ConditionTileFields,
    compare: CompareFields
) {
    const visibility = store<"visible" | "none">("none");
    const stationVisibility = store<"visible" | "none">("none");
    const modeIndex = store<number>(0);
    const stationIndex = store<number>(0);

    function syncMode(mode: VehicleLocationMode, tileDesc?: Parameters<ConditionTileFields["load"]>[0], compareValues?: {op: "eq" | "ne" | "lt" | "le" | "gt" | "ge"; value: number}): void {
        if (mode === "onTile") {
            tile.load(tileDesc || {});
            compare.hide();
            stationVisibility.set("none");
            return;
        }
        tile.hide();
        if (mode === "atStation") {
            compare.hide();
            stationVisibility.set("visible");
            return;
        }
        stationVisibility.set("none");
        compare.load(compareValues ? compareValues.op : "ge", compareValues ? compareValues.value : 0);
    }

    function hide(): void {
        visibility.set("none");
        stationVisibility.set("none");
    }

    function load(desc: {
        mode: VehicleLocationMode;
        stationIndex?: number;
        op?: "eq" | "ne" | "lt" | "le" | "gt" | "ge";
        value?: number;
        relativeToTrigger?: boolean;
        tile?: {x: number; y: number};
        offset?: {x: number; y: number};
    }): void {
        visibility.set("visible");
        modeIndex.set(indexOfValue(LOCATION_MODES, desc.mode));
        stationIndex.set(typeof desc.stationIndex === "number" ? desc.stationIndex : 0);
        syncMode(desc.mode, desc, desc.op && typeof desc.value === "number" ? {op: desc.op, value: desc.value} : undefined);
    }

    function read(): {
        mode: VehicleLocationMode;
        stationIndex: number;
    } {
        return {
            mode: LOCATION_MODES[modeIndex.get()] || "onTile",
            stationIndex: stationIndex.get()
        };
    }

    const widgets = [
        horizontal([
            label({
                text: "Location",
                width: 70,
                visibility
            }),
            dropdown({
                items: LOCATION_MODE_LABELS,
                selectedIndex: twoway(modeIndex),
                visibility,
                onChange: (index) => {
                    modeIndex.set(index);
                    const mode = LOCATION_MODES[index] || "onTile";
                    syncMode(mode);
                    onPersist();
                }
            })
        ]),
        horizontal([
            label({
                text: "Station",
                width: 70,
                visibility: stationVisibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(stationIndex),
                minimum: 0,
                maximum: 15,
                visibility: stationVisibility,
                onChange: (value) => {
                    stationIndex.set(value);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type VehicleLocationFields = ReturnType<typeof createVehicleLocationFields>;
