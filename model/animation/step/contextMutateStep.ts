/// <reference path="./../../../openrct2.d.ts" />

import TileCoords from "../../../game/tileCoords";
import {CarIdentity, TrainIdentity} from "../entityRematch";
import {
    ContextMutateStepDesc,
    ContextOperation,
    ContextSelectorKind,
    ContextSlot
} from "../jsonTypes";
import {log} from "../../logger";
import {
    carsOfTrain,
    contextRideIds,
    contextTiles,
    contextTrains,
    guestsOnTiles,
    staffOnTiles,
    subtractCars,
    subtractNumbers,
    subtractTiles,
    subtractTrains,
    trainsOfRide,
    unionCars,
    unionNumbers,
    unionTiles,
    unionTrains
} from "../trigger/contextLists";
import InstantStep from "./instantStep";
import {logMetaFromRun} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

function copyTile(tile: TileCoords): TileCoords {
    return {x: tile.x, y: tile.y};
}

export default class ContextMutateStep extends InstantStep {
    operation: ContextOperation;
    slot: ContextSlot;
    selector: ContextSelectorKind;
    useContextRide: boolean;
    useContextTiles: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    guestId?: number;
    staffId?: number;
    tile?: TileCoords;

    constructor(obj: ContextMutateStepDesc) {
        super(obj);
        this.operation = obj.operation;
        this.slot = obj.slot;
        this.selector = obj.selector;
        this.useContextRide = obj.useContextRide !== false;
        this.useContextTiles = obj.useContextTiles !== false;
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
        if (typeof obj.carIndex === "number") {
            this.carIndex = obj.carIndex;
        }
        if (typeof obj.guestId === "number") {
            this.guestId = obj.guestId;
        }
        if (typeof obj.staffId === "number") {
            this.staffId = obj.staffId;
        }
        if (obj.tile) {
            this.tile = copyTile(obj.tile);
        }
    }

    protected apply(run: StepRunContext): void {
        const ctx = run.triggerContext;
        if (!ctx.rides) {
            ctx.rides = [];
        }
        if (!ctx.trains) {
            ctx.trains = [];
        }
        if (!ctx.cars) {
            ctx.cars = [];
        }
        if (!ctx.guests) {
            ctx.guests = [];
        }
        if (!ctx.staff) {
            ctx.staff = [];
        }
        if (!ctx.tiles) {
            ctx.tiles = [];
        }

        if (this.slot === "ride") {
            ctx.rides = this.applyNumbers(ctx.rides, this.queryRides());
        } else if (this.slot === "train") {
            ctx.trains = this.applyTrains(ctx.trains, this.queryTrains(run));
        } else if (this.slot === "car") {
            ctx.cars = this.applyCars(ctx.cars, this.queryCars(run));
        } else if (this.slot === "guest") {
            ctx.guests = this.applyNumbers(ctx.guests, this.queryGuests(run));
        } else if (this.slot === "staff") {
            ctx.staff = this.applyNumbers(ctx.staff, this.queryStaff(run));
        } else {
            ctx.tiles = this.applyTiles(ctx.tiles, this.queryTiles());
        }

        log(
            "step",
            `${this.operationLabel()} ${this.slot} context (${this.slotCount(ctx)})`,
            logMetaFromRun(run)
        );
    }

    getDataToPersist(): object {
        const data: ContextMutateStepDesc = {
            type: "contextMutate",
            operation: this.operation,
            slot: this.slot,
            selector: this.selector
        };
        if (this.selector === "allTrainsOfRide") {
            data.useContextRide = this.useContextRide;
        }
        if (this.selector === "onTile") {
            data.useContextTiles = this.useContextTiles;
        }
        if (typeof this.rideId === "number") {
            data.rideId = this.rideId;
        }
        if (typeof this.trainIndex === "number") {
            data.trainIndex = this.trainIndex;
        }
        if (typeof this.carIndex === "number") {
            data.carIndex = this.carIndex;
        }
        if (typeof this.guestId === "number") {
            data.guestId = this.guestId;
        }
        if (typeof this.staffId === "number") {
            data.staffId = this.staffId;
        }
        if (this.tile) {
            data.tile = copyTile(this.tile);
        }
        return data;
    }

    private operationLabel(): string {
        if (this.operation === "set") {
            return "Set";
        }
        if (this.operation === "add") {
            return "Add To";
        }
        return "Remove From";
    }

    private slotCount(ctx: StepRunContext["triggerContext"]): number {
        if (this.slot === "ride") {
            return ctx.rides ? ctx.rides.length : 0;
        }
        if (this.slot === "train") {
            return ctx.trains ? ctx.trains.length : 0;
        }
        if (this.slot === "car") {
            return ctx.cars ? ctx.cars.length : 0;
        }
        if (this.slot === "guest") {
            return ctx.guests ? ctx.guests.length : 0;
        }
        if (this.slot === "staff") {
            return ctx.staff ? ctx.staff.length : 0;
        }
        return ctx.tiles ? ctx.tiles.length : 0;
    }

    private applyNumbers(current: number[], next: number[]): number[] {
        if (this.operation === "set") {
            return next.slice();
        }
        if (this.operation === "add") {
            return unionNumbers(current, next);
        }
        return subtractNumbers(current, next);
    }

    private applyTrains(current: TrainIdentity[], next: TrainIdentity[]): TrainIdentity[] {
        if (this.operation === "set") {
            return next.slice();
        }
        if (this.operation === "add") {
            return unionTrains(current, next);
        }
        return subtractTrains(current, next);
    }

    private applyCars(current: CarIdentity[], next: CarIdentity[]): CarIdentity[] {
        if (this.operation === "set") {
            return next.slice();
        }
        if (this.operation === "add") {
            return unionCars(current, next);
        }
        return subtractCars(current, next);
    }

    private applyTiles(current: TileCoords[], next: TileCoords[]): TileCoords[] {
        if (this.operation === "set") {
            return next.slice();
        }
        if (this.operation === "add") {
            return unionTiles(current, next);
        }
        return subtractTiles(current, next);
    }

    private queryRides(): number[] {
        if (typeof this.rideId === "number") {
            return [this.rideId];
        }
        return [];
    }

    private queryTrains(run: StepRunContext): TrainIdentity[] {
        if (this.selector === "allTrainsOfRide") {
            const rideIds = this.useContextRide
                ? contextRideIds(run.triggerContext)
                : (typeof this.rideId === "number" ? [this.rideId] : []);
            const out: TrainIdentity[] = [];
            for (let i = 0; i < rideIds.length; i++) {
                const trains = trainsOfRide(rideIds[i]);
                for (let j = 0; j < trains.length; j++) {
                    out.push(trains[j]);
                }
            }
            return out;
        }
        if (typeof this.rideId === "number" && typeof this.trainIndex === "number") {
            return [{rideId: this.rideId, trainIndex: this.trainIndex}];
        }
        return [];
    }

    private queryCars(run: StepRunContext): CarIdentity[] {
        if (this.selector === "carsOfContextTrains") {
            const trains = contextTrains(run.triggerContext);
            const out: CarIdentity[] = [];
            for (let i = 0; i < trains.length; i++) {
                const cars = carsOfTrain(trains[i].rideId, trains[i].trainIndex);
                for (let j = 0; j < cars.length; j++) {
                    out.push(cars[j]);
                }
            }
            return out;
        }
        if (this.selector === "carsOfTrain") {
            if (typeof this.rideId !== "number" || typeof this.trainIndex !== "number") {
                return [];
            }
            return carsOfTrain(this.rideId, this.trainIndex);
        }
        if (
            typeof this.rideId === "number" &&
            typeof this.trainIndex === "number" &&
            typeof this.carIndex === "number"
        ) {
            return [
                {
                    rideId: this.rideId,
                    trainIndex: this.trainIndex,
                    carIndex: this.carIndex
                }
            ];
        }
        return [];
    }

    private queryGuests(run: StepRunContext): number[] {
        if (this.selector === "onTile") {
            return guestsOnTiles(this.tilesForQuery(run));
        }
        if (typeof this.guestId === "number") {
            return [this.guestId];
        }
        return [];
    }

    private queryStaff(run: StepRunContext): number[] {
        if (this.selector === "onTile") {
            return staffOnTiles(this.tilesForQuery(run));
        }
        if (typeof this.staffId === "number") {
            return [this.staffId];
        }
        return [];
    }

    private queryTiles(): TileCoords[] {
        if (this.tile) {
            return [copyTile(this.tile)];
        }
        return [];
    }

    private tilesForQuery(run: StepRunContext): TileCoords[] {
        if (this.useContextTiles) {
            return contextTiles(run.triggerContext);
        }
        if (this.tile) {
            return [copyTile(this.tile)];
        }
        return [];
    }
}
