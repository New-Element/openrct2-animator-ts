/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import TileCoords from "../../../../game/tileCoords";
import {LiftDropTrackStepDesc} from "../../jsonTypes";
import {
    persistVehicleTargetFields,
    resolveTargetTrainCars,
    usesTriggerTarget
} from "../car/vehicleTarget";
import Step from "../step";
import StepRunContext from "../stepRunContext";
import {landHeightToPixels, readLiftDropLandHeight} from "../../liftDropHeights";

const VehicleState = {
    Empty: 0,
    Entering: 1,
    Locked: 2,
    Exiting: 3
} as const;

const LiftState = {
    Idle: 0,
    Traveling: 1,
    TargetReached: 2,
    Returning: 3
} as const;

interface VehicleStartDetails {
    x: number;
    y: number;
    z: number;
    velocity: number;
}

const VEHICLE_STATE_NAMES = ["Empty", "Entering", "Locked", "Exiting"];
const LIFT_STATE_NAMES = ["Idle", "Traveling", "TargetReached", "Returning"];

function liftLog(message: string): void {
    console.log(`[LiftDropTrack] ${message}`);
}

/**
 * Advanced Track Lift/Drop Track parity: fade-stop, travel with train, release,
 * wait for leave, return track empty.
 *
 * Heights are authored/stored as land units; pixel Z is used only while running.
 * Lock tile comes from the trigger when present; otherwise the train head’s
 * track tile at step start.
 */
export default class LiftDropTrackStep extends Step {
    /** Authored land units (persisted). */
    startHeight: number;
    endHeight: number;
    speed: number;
    reverseExitDirection: boolean;
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;

    /** Runtime pixel Z (land × 8). */
    private startZPx: number = 0;
    private endZPx: number = 0;

    private lockTile: TileCoords = {x: 0, y: 0};
    private vehicleState: number = VehicleState.Empty;
    private liftState: number = LiftState.Idle;
    private tickTimerCount: number = 0;
    private trainReleased: boolean = false;
    private vehicleStartDetails: VehicleStartDetails | null = null;
    private affectedTiles: TileCoords[] = [];
    private done: boolean = false;
    private noop: boolean = false;
    private tickCount: number = 0;
    private enteringTicks: number = 0;
    private lastLoggedVehicleState: number = -1;
    private lastLoggedLiftState: number = -1;
    private headCarId: number | null = null;
    private lastTravelT: number = 0;
    private returnFromT: number = 1;

    constructor(obj: LiftDropTrackStepDesc) {
        super(obj);
        this.startHeight = readLiftDropLandHeight(obj, "start");
        this.endHeight = readLiftDropLandHeight(obj, "end");
        this.startZPx = landHeightToPixels(this.startHeight);
        this.endZPx = landHeightToPixels(this.endHeight);
        this.speed = typeof obj.speed === "number" ? obj.speed : 100;
        this.reverseExitDirection = obj.reverseExitDirection === true;
        this.useTriggerTarget = usesTriggerTarget(obj);
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
        if (this.startHeight === this.endHeight) {
            console.log(
                `[LiftDropTrack] WARNING startHeight === endHeight (${this.startHeight}) — track will not move`
            );
        }
    }

    onStart(run: StepRunContext): void {
        this.done = false;
        this.noop = false;
        this.tickTimerCount = 0;
        this.affectedTiles = [];
        this.liftState = LiftState.Idle;
        this.vehicleState = VehicleState.Empty;
        this.vehicleStartDetails = null;
        this.trainReleased = false;
        this.tickCount = 0;
        this.enteringTicks = 0;
        this.lastLoggedVehicleState = -1;
        this.lastLoggedLiftState = -1;
        this.headCarId = null;
        this.lastTravelT = 0;
        this.returnFromT = 1;
        this.startZPx = landHeightToPixels(this.startHeight);
        this.endZPx = landHeightToPixels(this.endHeight);

        const cars = resolveTargetTrainCars(run, this);
        const head = cars.length > 0 ? cars[0] : null;
        if (!head || head.id === null) {
            liftLog(
                `onStart: no train (useTriggerTarget=${this.useTriggerTarget}, rideId=${this.rideId}, trainIndex=${this.trainIndex}) → noop`
            );
            this.noop = true;
            this.done = true;
            return;
        }

        this.headCarId = head.id;
        this.lockTile = resolveLockTile(run, head);
        this.vehicleStartDetails = {
            x: head.x,
            y: head.y,
            z: head.z,
            velocity: head.velocity
        };
        this.gatherAffectedTiles(head);
        this.vehicleState = VehicleState.Entering;
        // Validity runs at the start of every tick. During Entering/Locked the
        // train can briefly report trackLocation (0,0) even while still on the
        // lock — without this the run aborts before the stop finishes.
        run.triggerContext.allowOffTile = true;

        const triggerTile = run.triggerContext.tile;
        const lockMapTile = MapTile.at(this.lockTile);
        const lockTrack = lockMapTile ? lockMapTile.firstTrack() : null;
        const lockBasePx = lockTrack ? lockTrack.baseHeight * 8 : -1;
        liftLog(
            `onStart: head=${head.id} cars=${cars.length} lock=(${this.lockTile.x},${this.lockTile.y}) ` +
                `triggerTile=${triggerTile ? `(${triggerTile.x},${triggerTile.y})` : "none"} ` +
                `startHeight=${this.startHeight} endHeight=${this.endHeight} ` +
                `startZPx=${this.startZPx} endZPx=${this.endZPx} lockTrackZ=${lockBasePx} ` +
                `speed=${this.speed} affectedTiles=${this.affectedTiles.length} ` +
                `entryVel=${head.velocity} reverseExit=${this.reverseExitDirection}`
        );
        if (lockBasePx >= 0 && Math.abs(lockBasePx - this.startZPx) > 8) {
            liftLog(
                `onStart: WARNING lock track Z ${lockBasePx} != startZPx ${this.startZPx}`
            );
        }
    }

    onTick(run: StepRunContext): void {
        if (this.noop || this.done) {
            return;
        }

        this.tickCount += 1;

        // Leave sensing only while Exiting (AT ramps velocity immediately — no hold).
        if (this.vehicleState === VehicleState.Exiting && !this.trainReleased) {
            this.updateCollisionSensing(run);
        }

        let car: Car | null = null;
        if (!this.trainReleased) {
            car = this.resolveHeadCar(run);
            if (!car) {
                this.handleTrainLost(run);
            }
        }

        this.logStateIfChanged();

        let time = 0;
        let easeFunc: (x: number) => number = easeSine;

        switch (this.vehicleState) {
            case VehicleState.Entering: {
                if (!car || !this.vehicleStartDetails) {
                    break;
                }
                this.enteringTicks += 1;
                const distanceTravelled =
                    Math.abs(this.vehicleStartDetails.x - car.x) +
                    Math.abs(this.vehicleStartDetails.y - car.y);
                const fadeProgress = Math.min(
                    16,
                    Math.max(distanceTravelled, this.enteringTicks)
                );

                car.acceleration = 0;
                if (fadeProgress >= 16 || car.velocity === 0 || this.enteringTicks >= 16) {
                    car.velocity = 0;
                    this.vehicleState = VehicleState.Locked;
                    liftLog(
                        `tick ${this.tickCount}: Entering → Locked ` +
                            `(distance=${distanceTravelled}, enteringTicks=${this.enteringTicks})`
                    );
                } else {
                    car.velocity =
                        this.vehicleStartDetails.velocity * (1 - fadeProgress / 32);
                }
                break;
            }
            case VehicleState.Locked: {
                if (!car) {
                    break;
                }
                car.velocity = 0;
                car.acceleration = 0;
                // Keep the whole train in a normal on-track status while held.
                this.forceTrainTravelling(car);

                if (this.liftState === LiftState.Idle) {
                    if (this.tickTimerUpdate(50) === 1) {
                        // Keep the onStart tile set — re-gathering here can pick up
                        // stale trackLocation values and drag half the ride down.
                        this.liftState = LiftState.Traveling;
                        this.logRideVehicles(run, "travel-start");
                        liftLog(
                            `tick ${this.tickCount}: Locked idle wait done → Traveling ` +
                                `(durationTicks=${this.travelDurationTicks()}) ` +
                                `headStatus=${car.status} affectedTiles=${this.affectedTiles.length}`
                        );
                    }
                }
                break;
            }
            case VehicleState.Exiting: {
                // AT: ramp velocity only — cars already re-seated on last travel tick.
                if (!car || !this.vehicleStartDetails) {
                    break;
                }
                this.forceTrainTravelling(car);
                const targetVelocity = this.resolveExitVelocity();
                if (targetVelocity >= 0) {
                    if (car.velocity < targetVelocity) {
                        car.velocity += targetVelocity / 8;
                    } else {
                        car.velocity = targetVelocity;
                    }
                } else {
                    if (car.velocity > targetVelocity) {
                        car.velocity -= -targetVelocity / 8;
                    } else {
                        car.velocity = targetVelocity;
                    }
                }
                break;
            }
            case VehicleState.Empty: {
                if (this.liftState === LiftState.Idle) {
                    liftLog(`tick ${this.tickCount}: abort Empty/Idle before travel`);
                    this.done = true;
                    break;
                }
                if (this.liftState === LiftState.TargetReached) {
                    if (this.tickTimerUpdate(50) === 1) {
                        this.liftState = LiftState.Returning;
                        liftLog(`tick ${this.tickCount}: post-leave wait done → Returning`);
                    }
                }
                break;
            }
        }

        this.logStateIfChanged();

        switch (this.liftState) {
            case LiftState.Traveling: {
                time = this.tickTimerUpdate(this.travelDurationTicks());
                this.lastTravelT = time;
                if (this.endZPx < this.startZPx) {
                    easeFunc = easeCubic;
                }
                this.updatePosition(time, car, easeFunc);
                if (this.tickCount % 20 === 0 || time === 1) {
                    liftLog(
                        `tick ${this.tickCount}: Traveling t=${time.toFixed(3)} carZ=${car ? car.z : "n/a"}`
                    );
                }
                if (time === 1) {
                    this.liftState = LiftState.TargetReached;
                    this.returnFromT = 1;
                    // AT: Traveling done → Exiting immediately (no exit wait).
                    this.vehicleState = VehicleState.Exiting;
                    if (car) {
                        this.prepareTrainForExit(car, run);
                    }
                    liftLog(
                        `tick ${this.tickCount}: Traveling done → Exiting ` +
                            `(targetVel=${this.resolveExitVelocity()})`
                    );
                }
                break;
            }
            case LiftState.Returning: {
                time = this.tickTimerUpdate(this.travelDurationTicks());
                const returnT = this.returnFromT * (1 - time);
                this.updatePosition(returnT, car, easeSine);
                if (time === 1) {
                    this.liftState = LiftState.Idle;
                    this.done = true;
                    liftLog(`tick ${this.tickCount}: Returning done → step complete`);
                }
                break;
            }
        }
    }

    private logStateIfChanged(): void {
        if (
            this.vehicleState === this.lastLoggedVehicleState &&
            this.liftState === this.lastLoggedLiftState
        ) {
            return;
        }
        liftLog(
            `tick ${this.tickCount}: state ` +
                `${VEHICLE_STATE_NAMES[this.vehicleState]}/${LIFT_STATE_NAMES[this.liftState]}`
        );
        this.lastLoggedVehicleState = this.vehicleState;
        this.lastLoggedLiftState = this.liftState;
    }

    isComplete(_run: StepRunContext): boolean {
        return this.done;
    }

    getDataToPersist(): object {
        return {
            type: "liftDropTrack",
            startHeight: this.startHeight,
            endHeight: this.endHeight,
            speed: this.speed,
            reverseExitDirection: this.reverseExitDirection,
            ...persistVehicleTargetFields(this)
        };
    }

    private resolveExitVelocity(): number {
        const entry = this.vehicleStartDetails ? this.vehicleStartDetails.velocity : 0;
        return this.reverseExitDirection ? -entry : entry;
    }

    private travelDurationTicks(): number {
        const speed = this.speed <= 0 ? 1 : this.speed;
        // AT duration uses pixel Z span.
        return Math.abs(this.endZPx - this.startZPx) * (100 / speed);
    }

    private tickTimerUpdate(goal: number): number {
        this.tickTimerCount += 1;
        const denom = Math.floor(goal);
        const value = denom <= 0 ? 1 : Math.min(this.tickTimerCount / denom, 1);
        if (value === 1) {
            this.tickTimerCount = 0;
            return 1;
        }
        return value;
    }

    /**
     * AT-style bbox from lock tile + each car's x/y only.
     * Do not use trackLocation — it can be (0,0) or point elsewhere on the
     * circuit while the train is held, which expands the rectangle to dozens
     * of unrelated track pieces.
     */
    private gatherAffectedTiles(head: Car): void {
        let minX = this.lockTile.x;
        let minY = this.lockTile.y;
        let maxX = this.lockTile.x;
        let maxY = this.lockTile.y;
        let thisCar: Car | null = head;

        while (thisCar != null) {
            const tileX = Math.floor(thisCar.x / 32);
            const tileY = Math.floor(thisCar.y / 32);
            minX = Math.min(minX, tileX);
            minY = Math.min(minY, tileY);
            maxX = Math.max(maxX, tileX);
            maxY = Math.max(maxY, tileY);
            if (thisCar.nextCarOnTrain == null) {
                break;
            }
            const next = map.getEntity(thisCar.nextCarOnTrain);
            if (!next || next.type !== "car") {
                break;
            }
            thisCar = next as Car;
        }

        // +1 tile pad on the long axis: nose often overhangs the next track piece.
        const spanX = maxX - minX;
        const spanY = maxY - minY;
        if (spanX >= spanY) {
            minX -= 1;
            maxX += 1;
        }
        if (spanY >= spanX) {
            minY -= 1;
            maxY += 1;
        }

        // Only move track that starts at the lock height (the flat lift section).
        const lockMapTile = MapTile.at(this.lockTile);
        const lockTrack = lockMapTile ? lockMapTile.firstTrack() : null;
        const lockBaseHeight = lockTrack ? lockTrack.baseHeight : -1;

        this.affectedTiles = [];
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const mapTile = MapTile.atXY(i, j);
                const track = mapTile ? mapTile.firstTrack() : null;
                if (!track) {
                    continue;
                }
                if (lockBaseHeight >= 0 && track.baseHeight !== lockBaseHeight) {
                    continue;
                }
                this.affectedTiles.push({x: i, y: j});
            }
        }

        liftLog(
            `gatherAffectedTiles: lock=(${this.lockTile.x},${this.lockTile.y}) ` +
                `bbox=(${minX},${minY})-(${maxX},${maxY}) lockBase=${lockBaseHeight} ` +
                `trackTiles=${this.affectedTiles.length} ` +
                `[${this.affectedTiles.map((t) => `${t.x},${t.y}`).join(" | ")}]`
        );
    }

    /**
     * True when no car still sits on a tile we will raise/lower.
     * AT only watches the lock tile (fires when the trailing edge leaves it),
     * which returns the track under a multi-tile train mid-exit — so we wait
     * until the whole train has cleared every affected tile.
     */
    private isTrainClearOfAffectedTiles(cars: Car[]): boolean {
        if (this.affectedTiles.length === 0) {
            return true;
        }
        for (let i = 0; i < cars.length; i++) {
            if (this.isCarOnAffectedTiles(cars[i])) {
                return false;
            }
        }
        return true;
    }

    private isCarOnAffectedTiles(car: Car): boolean {
        // Prefer live x/y; ignore bogus trackLocation (0,0).
        const tiles: Array<{x: number; y: number}> = [
            {x: Math.floor(car.x / 32), y: Math.floor(car.y / 32)}
        ];
        const trackX = Math.floor(car.trackLocation.x / 32);
        const trackY = Math.floor(car.trackLocation.y / 32);
        if (trackX !== 0 || trackY !== 0) {
            tiles.push({x: trackX, y: trackY});
        }
        for (let t = 0; t < tiles.length; t++) {
            const tile = tiles[t];
            for (let i = 0; i < this.affectedTiles.length; i++) {
                const affected = this.affectedTiles[i];
                if (affected.x === tile.x && affected.y === tile.y) {
                    return true;
                }
            }
        }
        return false;
    }

    private updateCollisionSensing(run: StepRunContext): void {
        const cars = resolveTargetTrainCars(run, this);
        if (cars.length === 0) {
            liftLog(`tick ${this.tickCount}: train unresolved during exit → clear`);
            this.onTrainExit();
            return;
        }

        if (this.isTrainClearOfAffectedTiles(cars)) {
            liftLog(
                `tick ${this.tickCount}: train clear of ${this.affectedTiles.length} affected tiles → leave`
            );
            this.onTrainExit();
        }
    }

    private onTrainExit(): void {
        liftLog(
            `tick ${this.tickCount}: onTrainExit from ` +
                `${VEHICLE_STATE_NAMES[this.vehicleState]}/${LIFT_STATE_NAMES[this.liftState]}`
        );
        this.tickTimerCount = 0;
        this.trainReleased = true;
        this.vehicleStartDetails = null;
        this.vehicleState = VehicleState.Empty;
    }

    private handleTrainLost(run: StepRunContext): void {
        if (this.vehicleState === VehicleState.Empty && this.trainReleased) {
            return;
        }
        liftLog(
            `tick ${this.tickCount}: train lost while ` +
                `${VEHICLE_STATE_NAMES[this.vehicleState]}/${LIFT_STATE_NAMES[this.liftState]}`
        );
        this.trainReleased = true;
        this.vehicleStartDetails = null;
        this.vehicleState = VehicleState.Empty;
        run.triggerContext.allowOffTile = true;

        if (this.liftState === LiftState.Idle) {
            this.done = true;
            return;
        }
        if (this.liftState === LiftState.Traveling) {
            this.returnFromT = this.lastTravelT > 0 ? this.lastTravelT : 1;
            this.tickTimerCount = 0;
            this.liftState = LiftState.Returning;
            liftLog(
                `tick ${this.tickCount}: Traveling interrupted → Returning from t=${this.returnFromT.toFixed(3)}`
            );
            return;
        }
        if (this.liftState === LiftState.Returning) {
            return;
        }
        this.tickTimerCount = 0;
        liftLog(`tick ${this.tickCount}: train lost at destination → wait then Returning`);
    }

    private resolveHeadCar(run: StepRunContext): Car | null {
        if (this.headCarId !== null) {
            const cached = map.getEntity(this.headCarId);
            if (cached && cached.type === "car") {
                return cached as Car;
            }
        }
        const cars = resolveTargetTrainCars(run, this);
        if (cars.length === 0) {
            return null;
        }
        const head = cars[0];
        if (!head || head.id === null) {
            return null;
        }
        this.headCarId = head.id;
        return head;
    }

    /** Force every car onto normal track-travel status (clears boat/station glitches). */
    private forceTrainTravelling(head: Car): void {
        let thisCar: Car | null = head;
        while (thisCar != null) {
            if (thisCar.isCrashed) {
                thisCar.isCrashed = false;
            }
            if (thisCar.status !== "travelling") {
                thisCar.status = "travelling";
            }
            if (thisCar.nextCarOnTrain == null) {
                break;
            }
            const next = map.getEntity(thisCar.nextCarOnTrain);
            if (!next || next.type !== "car") {
                break;
            }
            thisCar = next as Car;
        }
    }

    /**
     * Final AT-style seat + status before exit velocity ramp.
     */
    private prepareTrainForExit(head: Car, run: StepRunContext): void {
        this.logRideVehicles(run, "before-exit-prepare");
        this.forceTrainTravelling(head);
        const heightDifference = this.endZPx - this.startZPx;
        let thisCar: Car | null = head;
        let carIndex = 0;
        while (thisCar != null) {
            const tileX = Math.floor(thisCar.x / 32);
            const tileY = Math.floor(thisCar.y / 32);
            const mapTile = MapTile.atXY(tileX, tileY);
            const elemIndex = mapTile ? mapTile.firstTrackIndex() : null;
            if (elemIndex != null) {
                thisCar.moveToTrack(tileX, tileY, elemIndex);
            }
            if (this.vehicleStartDetails) {
                thisCar.z = this.vehicleStartDetails.z + heightDifference;
            }
            liftLog(
                `prepareTrainForExit: car[${carIndex}] id=${thisCar.id} ` +
                    `status=${thisCar.status} crashed=${thisCar.isCrashed} ` +
                    `xy=(${thisCar.x},${thisCar.y}) z=${thisCar.z} ` +
                    `track=(${Math.floor(thisCar.trackLocation.x / 32)},${Math.floor(thisCar.trackLocation.y / 32)})`
            );
            if (thisCar.nextCarOnTrain == null) {
                break;
            }
            const next = map.getEntity(thisCar.nextCarOnTrain);
            if (!next || next.type !== "car") {
                break;
            }
            thisCar = next as Car;
            carIndex += 1;
        }
        this.logRideVehicles(run, "after-exit-prepare");
    }

    private logRideVehicles(run: StepRunContext, label: string): void {
        const rideId = run.triggerContext.rideId;
        if (typeof rideId !== "number") {
            liftLog(`${label}: no rideId on context`);
            return;
        }
        const ride = map.getRide(rideId);
        if (!ride) {
            liftLog(`${label}: ride ${rideId} missing`);
            return;
        }
        liftLog(
            `${label}: ride.vehicles=[${ride.vehicles.join(",")}] ` +
                `trainIndex=${run.triggerContext.trainIndex}`
        );
    }

    /**
     * AT updatePosition: ease time, move track heights, then moveToTrack + z
     * for each car. Keeps cars seated on the moving track.
     */
    private updatePosition(
        time: number,
        car: Car | null,
        ease: (x: number) => number
    ): void {
        time = ease(time);

        const heightDifference = (this.endZPx - this.startZPx) * time;
        const currentZ = this.startZPx + heightDifference;
        const newBaseZ = Math.round(currentZ / 8);
        const verbose = this.tickCount <= 3 || this.tickCount % 20 === 0;

        let heightDelta = 0;
        let heightDeltaReady = false;
        for (let i = 0; i < this.affectedTiles.length; i++) {
            const tileCoords = this.affectedTiles[i];
            const mapTile = MapTile.at(tileCoords);
            const track = mapTile ? mapTile.firstTrack() : null;
            if (mapTile && track) {
                if (!heightDeltaReady) {
                    heightDelta = newBaseZ - track.baseHeight;
                    heightDeltaReady = true;
                }
                const before = track.baseHeight;
                mapTile.adjustTrackHeight(track, heightDelta);
                if (verbose) {
                    liftLog(
                        `updatePosition: tile (${tileCoords.x},${tileCoords.y}) ` +
                            `baseHeight ${before}→${track.baseHeight} delta=${heightDelta}`
                    );
                }
            }
        }

        if (car == null || !this.vehicleStartDetails) {
            return;
        }

        this.forceTrainTravelling(car);

        let thisCar: Car | null = car;
        while (thisCar != null) {
            const tileX = Math.floor(thisCar.x / 32);
            const tileY = Math.floor(thisCar.y / 32);
            const mapTile = MapTile.atXY(tileX, tileY);
            if (!mapTile) {
                break;
            }
            const elemIndex = mapTile.firstTrackIndex();
            if (elemIndex == null) {
                break;
            }
            thisCar.moveToTrack(tileX, tileY, elemIndex);
            thisCar.z = this.vehicleStartDetails.z + heightDifference;

            if (thisCar.nextCarOnTrain == null) {
                break;
            }
            const next = map.getEntity(thisCar.nextCarOnTrain);
            if (!next || next.type !== "car") {
                break;
            }
            thisCar = next as Car;
        }
    }
}

function resolveLockTile(run: StepRunContext, head: Car): TileCoords {
    const triggerTile = run.triggerContext.tile;
    if (
        triggerTile &&
        typeof triggerTile.x === "number" &&
        typeof triggerTile.y === "number"
    ) {
        return {x: triggerTile.x, y: triggerTile.y};
    }
    return {
        x: Math.floor(head.trackLocation.x / 32),
        y: Math.floor(head.trackLocation.y / 32)
    };
}

function easeCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}
