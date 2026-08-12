/// <reference path="./../../../../openrct2.d.ts" />

import TileCoords from "../../../../game/tileCoords";
import {CarEntersEventDesc} from "../../jsonTypes";
import {getRideCarSnapshot} from "../rideCarSnapshot";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

export default class CarEntersEvent extends TriggerEvent {
    type: "carEnters" = "carEnters";
    rideId: number;
    tile: TileCoords;

    /**
     * Static tracking of which cars are currently on which tiles.
     * Prevents re-firing while a car remains on the same tile.
     */
    private static carsOnTiles: { [key: string]: boolean } = {};

    constructor(obj: CarEntersEventDesc) {
        super(obj);
        this.type = "carEnters";
        this.rideId = obj.rideId;
        this.tile = { x: obj.tile.x, y: obj.tile.y };
    }

    private static makeKey(carId: number, tileX: number, tileY: number): string {
        return `${carId}-${tileX}-${tileY}`;
    }

    /**
     * Snapshot of cars currently marked as on a tile (entity id + tile).
     * Used for park save/load; callers rematch entity ids as needed.
     */
    static getCarsOnTilesEntries(): Array<{ carId: number; tileX: number; tileY: number }> {
        const entries: Array<{ carId: number; tileX: number; tileY: number }> = [];
        for (const key in CarEntersEvent.carsOnTiles) {
            if (!CarEntersEvent.carsOnTiles[key]) {
                continue;
            }
            const keyParts = key.split("-");
            if (keyParts.length < 3) {
                continue;
            }
            entries.push({
                carId: parseInt(keyParts[0]),
                tileX: parseInt(keyParts[1]),
                tileY: parseInt(keyParts[2])
            });
        }
        return entries;
    }

    static setCarsOnTilesEntries(
        entries: Array<{ carId: number; tileX: number; tileY: number }>
    ): void {
        CarEntersEvent.carsOnTiles = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const key = CarEntersEvent.makeKey(entry.carId, entry.tileX, entry.tileY);
            CarEntersEvent.carsOnTiles[key] = true;
        }
    }

    tryFire(): TriggerContext[] {
        const fired: TriggerContext[] = [];
        const cars = getRideCarSnapshot(this.rideId);
        const carsOnThisTileThisTick: { [carId: number]: boolean } = {};

        for (let i = 0; i < cars.length; i++) {
            const pos = cars[i];
            if (pos.tileX !== this.tile.x || pos.tileY !== this.tile.y) {
                continue;
            }

            carsOnThisTileThisTick[pos.carId] = true;

            const tileKey = CarEntersEvent.makeKey(pos.carId, this.tile.x, this.tile.y);
            if (!CarEntersEvent.carsOnTiles[tileKey]) {
                CarEntersEvent.carsOnTiles[tileKey] = true;
                fired.push({
                    target: { carId: pos.carId },
                    rideId: this.rideId,
                    trainIndex: pos.trainIndex,
                    carIndex: pos.carIndex,
                    tile: { x: this.tile.x, y: this.tile.y }
                });
            }
        }

        for (const key in CarEntersEvent.carsOnTiles) {
            const keyParts = key.split("-");
            const keyTileX = parseInt(keyParts[1]);
            const keyTileY = parseInt(keyParts[2]);

            if (keyTileX === this.tile.x && keyTileY === this.tile.y) {
                const carId = parseInt(keyParts[0]);
                if (!carsOnThisTileThisTick[carId]) {
                    delete CarEntersEvent.carsOnTiles[key];
                }
            }
        }

        return fired;
    }

    getDataToPersist(): object {
        return {
            type: "carEnters",
            rideId: this.rideId,
            tile: { x: this.tile.x, y: this.tile.y }
        };
    }
}
