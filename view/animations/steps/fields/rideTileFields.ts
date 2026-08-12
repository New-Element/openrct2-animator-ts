/// <reference path="./../../../../openrct2.d.ts" />

import {button, dropdown, horizontal, label, spinner, store, twoway, WritableStore} from "openrct2-flexui";
import TileCoords from "../../../../game/tileCoords";
import {pickRide} from "../../../ui/pickRide";
import {pickTile} from "../../../ui/pickTile";
import {RideSelectFields} from "./rideSelectFields";

/**
 * Shared Ride + Tile pickers for track steps that target a map tile.
 */
export function createRideTileFields(
    rideSelect: RideSelectFields,
    onPersist: () => void,
    visibility: WritableStore<"visible" | "none">
) {
    const tileX = store<number>(0);
    const tileY = store<number>(0);

    function load(tile: TileCoords, rideId: number): void {
        rideSelect.refreshRideOptions();
        tileX.set(tile.x);
        tileY.set(tile.y);
        rideSelect.setSelectedByRideId(rideId);
    }

    function getTile(): TileCoords {
        return {x: tileX.get(), y: tileY.get()};
    }

    function getRideId(): number {
        return rideSelect.selectedRideId();
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
            button({
                text: "Pick Ride",
                width: 70,
                height: 14,
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
            })
        ]),
        label({
            text: "Tile",
            visibility
        }),
        horizontal([
            label({
                text: "X",
                width: 12,
                visibility
            }),
            spinner({
                value: twoway(tileX),
                minimum: 0,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    tileX.set(value);
                    onPersist();
                }
            }),
            label({
                text: "Y",
                width: 12,
                visibility
            }),
            spinner({
                value: twoway(tileY),
                minimum: 0,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    tileY.set(value);
                    onPersist();
                }
            }),
            button({
                text: "Pick Tile",
                width: 70,
                height: 14,
                visibility,
                onClick: () => {
                    pickTile((tile) => {
                        tileX.set(tile.x);
                        tileY.set(tile.y);
                        onPersist();
                    });
                }
            })
        ])
    ];

    return {load, getTile, getRideId, widgets};
}

export type RideTileFields = ReturnType<typeof createRideTileFields>;
