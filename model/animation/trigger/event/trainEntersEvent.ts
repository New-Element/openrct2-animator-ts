/// <reference path="./../../../../openrct2.d.ts" />

import {TrainEntersEventDesc, TravelDirection} from "../../jsonTypes";
import {getRideTrainHeadSnapshot} from "../rideCarSnapshot";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import {
    collectTileEnterContexts,
    copyTiles,
    loadTilesFromDesc,
    loadTravelDirection,
    occupiedTileKey
} from "./eventTiles";
import {TileEventPollClock} from "./tileEventPoll";
import TriggerEvent from "./triggerEvent";
import TileCoords from "../../../../game/tileCoords";

export default class TrainEntersEvent extends TriggerEvent {
    type: "trainEnters" = "trainEnters";
    rideId: number;
    tiles: TileCoords[];
    direction: TravelDirection;
    private poll: TileEventPollClock;

    /**
     * Lead cars currently on which tiles.
     * Prevents re-firing while the train head remains on the same tile.
     */
    private static trainsOnTiles: {[key: string]: boolean} = {};

    constructor(obj: TrainEntersEventDesc) {
        super(obj);
        this.type = "trainEnters";
        this.rideId = obj.rideId;
        this.tiles = loadTilesFromDesc(obj);
        this.direction = loadTravelDirection(obj.direction);
        this.poll = new TileEventPollClock(obj.checkEveryTicks);
    }

    get checkEveryTicks(): number {
        return this.poll.checkEveryTicks;
    }

    setCheckEveryTicks(ticks: number): void {
        this.poll.setCheckEveryTicks(ticks);
    }

    advancePollClock(): void {
        this.poll.advance();
    }

    isPollDue(): boolean {
        return this.poll.isDue();
    }

    /**
     * Snapshot of train heads currently marked as on a tile (lead entity id + tile).
     * Used for park save/load; callers rematch entity ids as needed.
     */
    static getTrainsOnTilesEntries(): Array<{carId: number; tileX: number; tileY: number}> {
        const entries: Array<{carId: number; tileX: number; tileY: number}> = [];
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
        entries: Array<{carId: number; tileX: number; tileY: number}>
    ): void {
        TrainEntersEvent.trainsOnTiles = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const key = occupiedTileKey(entry.carId, entry.tileX, entry.tileY);
            TrainEntersEvent.trainsOnTiles[key] = true;
        }
    }

    tryFire(): TriggerContext[] {
        if (!this.poll.isDue()) {
            return [];
        }
        return collectTileEnterContexts(
            getRideTrainHeadSnapshot(this.rideId),
            this.tiles,
            TrainEntersEvent.trainsOnTiles,
            (pos) =>
                withContextLists({
                    target: {carId: pos.carId},
                    rideId: this.rideId,
                    trainIndex: pos.trainIndex,
                    carIndex: 0,
                    tile: {x: pos.tileX, y: pos.tileY}
                }),
            this.direction
        );
    }

    getDataToPersist(): object {
        return {
            type: "trainEnters",
            rideId: this.rideId,
            tiles: copyTiles(this.tiles),
            direction: this.direction,
            checkEveryTicks: this.poll.checkEveryTicks
        };
    }
}
