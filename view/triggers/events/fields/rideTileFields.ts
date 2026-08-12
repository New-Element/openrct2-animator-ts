/// <reference path="./../../../../openrct2.d.ts" />

import {button, dropdown, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import TileCoords from "../../../../game/tileCoords";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";
import {pickRide} from "../../../ui/pickRide";
import {pickTile} from "../../../ui/pickTile";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../rideOptions";

/** Events that store a ride + tile (carEnters, trainEnters). */
export type RideTileEvent = {
    rideId: number;
    tile: TileCoords;
};

export function createRideTileFields(
    getTrigger: () => Trigger | null,
    getRideTileEvent: (trigger: Trigger) => RideTileEvent | null
) {
    const visibility = store<"visible" | "none">("none");
    const rideDropdownItems = store<string[]>(["(No Rides)"]);
    const rideSelectedIndex = store<number>(0);
    const tileX = store<number>(0);
    const tileY = store<number>(0);
    let rideOptions: RideOption[] = [];

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set(["(No Rides)"]);
            rideSelectedIndex.set(0);
            return;
        }
        rideDropdownItems.set(rideNames(rideOptions));
    }

    function hide(): void {
        visibility.set("none");
    }

    function save(trigger: Trigger): void {
        const event = getRideTileEvent(trigger);
        if (!event) {
            return;
        }
        if (rideOptions.length > 0) {
            const idx = rideSelectedIndex.get();
            if (idx >= 0 && idx < rideOptions.length) {
                event.rideId = rideOptions[idx].id;
            }
        }
        event.tile = {x: tileX.get(), y: tileY.get()};
        getConductor().triggersArray.save();
    }

    function persistFromUi(): void {
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        refreshRideOptions();
        const event = getRideTileEvent(trigger);
        if (!event) {
            hide();
            return;
        }
        visibility.set("visible");
        tileX.set(event.tile.x);
        tileY.set(event.tile.y);
        const rideIndex = indexOfRideId(rideOptions, event.rideId);
        rideSelectedIndex.set(rideIndex < 0 ? 0 : rideIndex);
    }

    const widgets = [
        label({
            text: "Ride",
            visibility
        }),
        horizontal([
            dropdown({
                items: rideDropdownItems,
                selectedIndex: twoway(rideSelectedIndex),
                visibility,
                onChange: (index) => {
                    rideSelectedIndex.set(index);
                    persistFromUi();
                }
            }),
            button({
                text: "Pick Ride",
                width: 70,
                height: 14,
                visibility,
                onClick: () => {
                    pickRide((rideId) => {
                        refreshRideOptions();
                        const rideIndex = indexOfRideId(rideOptions, rideId);
                        if (rideIndex < 0) {
                            return;
                        }
                        rideSelectedIndex.set(rideIndex);
                        persistFromUi();
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
                    persistFromUi();
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
                    persistFromUi();
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
                        persistFromUi();
                    });
                }
            })
        ])
    ];

    return {hide, load, save, widgets};
}

export type RideTileFields = ReturnType<typeof createRideTileFields>;
