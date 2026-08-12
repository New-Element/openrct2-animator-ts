/// <reference path="./../../../../openrct2.d.ts" />

import TileCoords from "../../../../game/tileCoords";
import {TrainEntersEventDesc} from "../../jsonTypes";
import {getRideTrainHeadSnapshot} from "../rideCarSnapshot";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

export default class TrainEntersEvent extends TriggerEvent {
    type: "trainEnters" = "trainEnters";
    rideId: number;
    tile: TileCoords;

    /**
     * Lead cars currently on which tiles.
     * Prevents re-firing while the train head remains on the same tile.
     */
    private static trainsOnTiles: { [key: string]: boolean } = {};

    constructor(obj: TrainEntersEventDesc) {
        super(obj);
        this.type = "trainEnters";
        this.rideId = obj.rideId;
        this.tile = { x: obj.tile.x, y: obj.tile.y };
    }

    private static makeKey(carId: number, tileX: number, tileY: number): string {
        return `${carId}-${tileX}-${tileY}`;
    }

    /**
     * Snapshot of train heads currently marked as on a tile (lead entity id + tile).
     * Used for park save/load; callers rematch entity ids as needed.
     */
    static getTrainsOnTilesEntries(): Array<{ carId: number; tileX: number; tileY: number }> {
        const entries: Array<{ carId: number; tileX: number; tileY: number }> = [];
        for (const key in TrainEntersEvent.trainsOnTiles) {
            if (!TrainEntersEvent.trainsOnTiles[key]) {
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

    static setTrainsOnTilesEntries(
        entries: Array<{ carId: number; tileX: number; tileY: number }>
    ): void {
        TrainEntersEvent.trainsOnTiles = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const key = TrainEntersEvent.makeKey(entry.carId, entry.tileX, entry.tileY);
            TrainEntersEvent.trainsOnTiles[key] = true;
        }
    }

    tryFire(): TriggerContext[] {
        const fired: TriggerContext[] = [];
        const trains = getRideTrainHeadSnapshot(this.rideId);
        const trainsOnThisTileThisTick: { [carId: number]: boolean } = {};

        for (let i = 0; i < trains.length; i++) {
            const pos = trains[i];
            if (pos.tileX !== this.tile.x || pos.tileY !== this.tile.y) {
                continue;
            }

            trainsOnThisTileThisTick[pos.carId] = true;

            const tileKey = TrainEntersEvent.makeKey(pos.carId, this.tile.x, this.tile.y);
            if (!TrainEntersEvent.trainsOnTiles[tileKey]) {
                TrainEntersEvent.trainsOnTiles[tileKey] = true;
                fired.push({
                    target: { carId: pos.carId },
                    rideId: this.rideId,
                    trainIndex: pos.trainIndex,
                    carIndex: 0,
                    tile: { x: this.tile.x, y: this.tile.y }
                });
            }
        }

        for (const key in TrainEntersEvent.trainsOnTiles) {
            const keyParts = key.split("-");
            const keyTileX = parseInt(keyParts[1]);
            const keyTileY = parseInt(keyParts[2]);

            if (keyTileX === this.tile.x && keyTileY === this.tile.y) {
                const carId = parseInt(keyParts[0]);
                if (!trainsOnThisTileThisTick[carId]) {
                    delete TrainEntersEvent.trainsOnTiles[key];
                }
            }
        }

        return fired;
    }

    getDataToPersist(): object {
        return {
            type: "trainEnters",
            rideId: this.rideId,
            tile: { x: this.tile.x, y: this.tile.y }
        };
    }
}
