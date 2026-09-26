/// <reference path="./../../../../openrct2.d.ts" />

import {CarEntersEventDesc, TravelDirection} from "../../jsonTypes";
import {getRideCarSnapshot} from "../rideCarSnapshot";
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

export default class CarEntersEvent extends TriggerEvent {
    type: "carEnters" = "carEnters";
    rideId: number;
    tiles: TileCoords[];
    direction: TravelDirection;
    private poll: TileEventPollClock;

    /**
     * Static tracking of which cars are currently on which tiles.
     * Prevents re-firing while a car remains on the same tile.
     */
    private static carsOnTiles: {[key: string]: boolean} = {};

    constructor(obj: CarEntersEventDesc) {
        super(obj);
        this.type = "carEnters";
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
     * Snapshot of cars currently marked as on a tile (entity id + tile).
     * Used for park save/load; callers rematch entity ids as needed.
     */
    static getCarsOnTilesEntries(): Array<{carId: number; tileX: number; tileY: number}> {
        const entries: Array<{carId: number; tileX: number; tileY: number}> = [];
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
        entries: Array<{carId: number; tileX: number; tileY: number}>
    ): void {
        CarEntersEvent.carsOnTiles = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const key = occupiedTileKey(entry.carId, entry.tileX, entry.tileY);
            CarEntersEvent.carsOnTiles[key] = true;
        }
    }

    tryFire(): TriggerContext[] {
        if (!this.poll.isDue()) {
            return [];
        }
        return collectTileEnterContexts(
            getRideCarSnapshot(this.rideId),
            this.tiles,
            CarEntersEvent.carsOnTiles,
            (pos) =>
                withContextLists({
                    target: {carId: pos.carId},
                    rideId: this.rideId,
                    trainIndex: pos.trainIndex,
                    carIndex: pos.carIndex,
                    tile: {x: pos.tileX, y: pos.tileY}
                }),
            this.direction
        );
    }

    getDataToPersist(): object {
        return {
            type: "carEnters",
            rideId: this.rideId,
            tiles: copyTiles(this.tiles),
            direction: this.direction,
            checkEveryTicks: this.poll.checkEveryTicks
        };
    }
}
