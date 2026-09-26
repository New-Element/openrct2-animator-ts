/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, twoway, WritableStore} from "openrct2-flexui";
import TileCoords from "../../../../game/tileCoords";
import {TileTargetDesc} from "../../../../model/animation/jsonTypes";
import {goToRideButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickRide} from "../../../ui/pickRide";
import {RideSelectFields} from "./rideSelectFields";
import {createTileTargetFields} from "./tileTargetFields";

/**
 * Shared Ride + Tile pickers for track steps that target a map tile.
 */
export function createRideTileFields(
    rideSelect: RideSelectFields,
    onPersist: () => void,
    visibility: WritableStore<"visible" | "none">
) {
    const tileTarget = createTileTargetFields(onPersist, visibility);

    function load(target: TileTargetDesc, rideId: number): void {
        rideSelect.refreshRideOptions();
        tileTarget.load(target);
        rideSelect.setSelectedByRideId(rideId);
    }

    function readTarget(): TileTargetDesc {
        return tileTarget.readTarget();
    }

    function getRideId(): number {
        return rideSelect.selectedRideId();
    }

    function isRelative(): boolean {
        return tileTarget.isRelative();
    }

    function setAbsoluteTile(tile: TileCoords): void {
        tileTarget.setAbsoluteTile(tile);
    }

    const widgets = [
        label({
            text: "Ride",
            visibility
        }),
        horizontal([
            dropdown({
                items: rideSelect.rideDropdownItems,
                selectedIndex: twoway(rideSelect.rideSelectedIndex),
                visibility,
                onChange: (index) => {
                    rideSelect.rideSelectedIndex.set(index);
                    onPersist();
                }
            }),
            pickIconButton({
                tooltip: "Pick Ride",
                visibility,
                onClick: () => {
                    pickRide((rideId) => {
                        rideSelect.refreshRideOptions();
                        if (!rideSelect.selectRideId(rideId)) {
                            return;
                        }
                        onPersist();
                    });
                }
            }),
            goToRideButton({
                visibility,
                getRideId: () => rideSelect.selectedRideId()
            })
        ]),
        ...tileTarget.widgets
    ];

    return {load, readTarget, getRideId, isRelative, setAbsoluteTile, widgets};
}

export type RideTileFields = ReturnType<typeof createRideTileFields>;
