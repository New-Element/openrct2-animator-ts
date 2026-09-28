/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {NumberSourceOrigin, TrackPositionOverTimeStepDesc} from "../../jsonTypes";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import TimedStep from "../timedStep";
import {travelForTrackPixels} from "./trackPixelTravel";
import {
    persistVehicleTargetFields,
    resolveTargetTrainCars,
    usesTriggerTarget
} from "./vehicleTarget";

interface CarTrackSnap {
    carId: number;
    travel: number;
    applied: number;
}

/**
 * Slides every car in a train along the track.
 * The front car moves by `position` pixels. Each car behind moves `spacing` pixels less,
 * so a positive spacing opens the gaps.
 */
export default class TrackPositionOverTimeStep extends TimedStep {
    position: number;
    positionOrigin?: NumberSourceOrigin;
    positionVariableId?: string;
    spacing: number;
    spacingOrigin?: NumberSourceOrigin;
    spacingVariableId?: string;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;

    private storedDurationTicks: number;
    private snaps: CarTrackSnap[] = [];

    constructor(obj: TrackPositionOverTimeStepDesc) {
        super(obj, typeof obj.durationTicks === "number" ? obj.durationTicks : 1);
        this.position = typeof obj.position === "number" ? obj.position : 0;
        this.positionOrigin = obj.positionOrigin;
        this.positionVariableId = obj.positionVariableId;
        this.spacing = typeof obj.spacing === "number" ? obj.spacing : 0;
        this.spacingOrigin = obj.spacingOrigin;
        this.spacingVariableId = obj.spacingVariableId;
        this.durationTicksOrigin = obj.durationTicksOrigin;
        this.durationTicksVariableId = obj.durationTicksVariableId;
        this.storedDurationTicks = this.durationTicks;
        this.useTriggerTarget = usesTriggerTarget(obj);
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
    }

    protected onTimedStart(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const position = resolveNumberSource(
            this.position,
            this.positionOrigin,
            this.positionVariableId,
            "int",
            "Track Position",
            meta
        );
        const spacing = resolveNumberSource(
            this.spacing,
            this.spacingOrigin,
            this.spacingVariableId,
            "int",
            "Track Spacing",
            meta
        );
        const duration = resolveNumberSource(
            this.storedDurationTicks,
            this.durationTicksOrigin,
            this.durationTicksVariableId,
            "int",
            "Track Position Duration",
            meta
        );
        const positionPixels = position === null ? 0 : position;
        const spacingPixels = spacing === null ? 0 : spacing;
        this.durationTicks = duration === null ? this.storedDurationTicks : Math.max(0, duration | 0);

        this.snaps = [];
        const cars = resolveTargetTrainCars(run, this);
        if (cars.length === 0) {
            error("step", "Track Position Over Time: no train", undefined, meta);
            return;
        }
        let warnedOffTrack = false;
        let warnedShort = false;
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            if (car.id === null) {
                continue;
            }
            const pixels = positionPixels - i * spacingPixels;
            const planned = travelForTrackPixels(car, pixels);
            if (!planned) {
                if (!warnedOffTrack) {
                    warnedOffTrack = true;
                    error("step", "Track Position Over Time: a car is not on track", undefined, meta);
                }
                continue;
            }
            if (!planned.reached && !warnedShort) {
                warnedShort = true;
                error("step", "Track Position Over Time: the track ended before the move finished", undefined, meta);
            }
            if (planned.settle !== 0) {
                car.travelBy(planned.settle);
            }
            car.velocity = 0;
            car.acceleration = 0;
            this.snaps.push({
                carId: car.id,
                travel: planned.travel,
                applied: 0
            });
        }
    }

    protected onProgress(_run: StepRunContext, t: number): void {
        for (let i = 0; i < this.snaps.length; i++) {
            const snap = this.snaps[i];
            const entity = map.getEntity(snap.carId);
            if (!entity || entity.type !== "car") {
                continue;
            }
            const car = entity as Car;
            const desired = Math.round(snap.travel * t);
            const delta = desired - snap.applied;
            if (delta !== 0) {
                car.travelBy(delta);
                snap.applied = desired;
            }
            car.velocity = 0;
            car.acceleration = 0;
        }
    }

    getDataToPersist(): object {
        const data: TrackPositionPersist = {
            type: "trackPositionOverTime",
            durationTicks: this.storedDurationTicks,
            ...persistVehicleTargetFields(this)
        };
        writeNamedNumber(data, "position", this.position, this.positionOrigin, this.positionVariableId, true);
        writeNamedNumber(data, "spacing", this.spacing, this.spacingOrigin, this.spacingVariableId, true);
        writeNamedNumber(
            data,
            "durationTicks",
            this.storedDurationTicks,
            this.durationTicksOrigin,
            this.durationTicksVariableId,
            false
        );
        return data;
    }
}

interface TrackPositionPersist {
    type: "trackPositionOverTime";
    position?: number;
    positionOrigin?: NumberSourceOrigin;
    positionVariableId?: string;
    spacing?: number;
    spacingOrigin?: NumberSourceOrigin;
    spacingVariableId?: string;
    durationTicks: number;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
    useTriggerTarget?: boolean;
    rideId?: number;
    trainIndex?: number;
}

function writeNamedNumber(
    data: TrackPositionPersist,
    field: "position" | "spacing" | "durationTicks",
    hardcoded: number,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined,
    omitZeroHardcoded: boolean
): void {
    const source = persistNumberSource(hardcoded, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    if (omitZeroHardcoded && source.origin !== "variable" && source.value === 0) {
        return;
    }
    if (field === "position") {
        data.position = source.value;
        if (source.origin === "variable") {
            data.positionOrigin = "variable";
            data.positionVariableId = source.variableId || "";
        }
        return;
    }
    if (field === "spacing") {
        data.spacing = source.value;
        if (source.origin === "variable") {
            data.spacingOrigin = "variable";
            data.spacingVariableId = source.variableId || "";
        }
        return;
    }
    data.durationTicks = source.value;
    if (source.origin === "variable") {
        data.durationTicksOrigin = "variable";
        data.durationTicksVariableId = source.variableId || "";
    }
}
