/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {
    NumberSourceOrigin,
    RideBreakdownStepDesc,
    RideFixBreakdownStepDesc,
    RideMusicStepDesc,
    RideNumberStepDesc,
    RideStatusStepDesc,
    RideTrackColoursStepDesc,
    RideVehicleColoursStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun, persistRideIdFields, resolveStepRides} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {findMusicObjectByIdentifier, findMusicObjectByIndex} from "./musicObjects";

/** RideSetSetting::music. 0 is off, 1 is on. */
const RIDE_SETTING_MUSIC = 6;

const RIDE_STATUS_TO_ACTION: {[status in RideStatus]: number} = {
    closed: 0,
    open: 1,
    testing: 2,
    simulating: 3
};

function writeRideNumber(ride: Ride, type: RideNumberStepDesc["type"], value: number): void {
    if (type === "rideStationStyle") {
        ride.stationStyle = value;
        return;
    }
    if (type === "rideMode") {
        ride.mode = value;
        return;
    }
    if (type === "rideDepartFlags") {
        ride.departFlags = value;
        return;
    }
    if (type === "rideMinWait") {
        ride.minimumWaitingTime = value;
        return;
    }
    if (type === "rideMaxWait") {
        ride.maximumWaitingTime = value;
        return;
    }
    ride.liftHillSpeed = value;
}

export class RideStatusStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    status: RideStatus;

    constructor(obj: RideStatusStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.status = obj.status;
    }

    protected apply(run: StepRunContext): void {
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Ride Status");
        for (let i = 0; i < rides.length; i++) {
            context.executeAction("ridesetstatus", {
                ride: rides[i].id,
                status: RIDE_STATUS_TO_ACTION[this.status]
            });
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideStatus",
            status: this.status,
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

function persistNamedNumber(
    field: string,
    hardcoded: number,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): {[key: string]: number | NumberSourceOrigin | string} {
    const source = persistNumberSource(hardcoded, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    return {
        [field]: source.value,
        ...(source.origin === "variable" ? {[`${field}Origin`]: "variable", [`${field}VariableId`]: source.variableId || ""} : {})
    };
}

function persistOriginOnly(
    field: string,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): {[key: string]: NumberSourceOrigin | string} {
    return origin === "variable"
        ? {[`${field}Origin`]: "variable", [`${field}VariableId`]: variableId || ""}
        : {};
}

export class RideVehicleColoursStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    colourIndex: number;
    colourIndexOrigin?: NumberSourceOrigin;
    colourIndexVariableId?: string;
    value: VehicleColour;
    bodyOrigin?: NumberSourceOrigin;
    bodyVariableId?: string;
    trimOrigin?: NumberSourceOrigin;
    trimVariableId?: string;
    tertiaryOrigin?: NumberSourceOrigin;
    tertiaryVariableId?: string;

    constructor(obj: RideVehicleColoursStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.colourIndex = typeof obj.colourIndex === "number" ? obj.colourIndex : 0;
        this.colourIndexOrigin = obj.colourIndexOrigin;
        this.colourIndexVariableId = obj.colourIndexVariableId;
        this.value = obj.value;
        this.bodyOrigin = obj.bodyOrigin;
        this.bodyVariableId = obj.bodyVariableId;
        this.trimOrigin = obj.trimOrigin;
        this.trimVariableId = obj.trimVariableId;
        this.tertiaryOrigin = obj.tertiaryOrigin;
        this.tertiaryVariableId = obj.tertiaryVariableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const colourIndex = resolveNumberSource(
            this.colourIndex,
            this.colourIndexOrigin,
            this.colourIndexVariableId,
            "int",
            "Ride Vehicle Colours Index",
            meta
        );
        if (colourIndex === null) {
            return;
        }
        const body = resolveNumberSource(this.value.body, this.bodyOrigin, this.bodyVariableId, "int", "Ride Vehicle Colours Body", meta);
        const trim = resolveNumberSource(this.value.trim, this.trimOrigin, this.trimVariableId, "int", "Ride Vehicle Colours Trim", meta);
        const tertiary = resolveNumberSource(this.value.tertiary, this.tertiaryOrigin, this.tertiaryVariableId, "int", "Ride Vehicle Colours Tertiary", meta);
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Ride Vehicle Colours");
        for (let i = 0; i < rides.length; i++) {
            const ride = rides[i];
            // vehicleColours_get returns a copy. Index writes are dropped unless the array is assigned back.
            const colours = ride.vehicleColours;
            if (colourIndex < 0 || colourIndex >= colours.length) {
                error(
                    "step",
                    `Ride Vehicle Colours: index ${colourIndex} out of range`,
                    undefined,
                    meta
                );
                continue;
            }
            const current = colours[colourIndex];
            colours[colourIndex] = {
                body: body === null ? current.body : body,
                trim: trim === null ? current.trim : trim,
                tertiary: tertiary === null ? current.tertiary : tertiary
            };
            ride.vehicleColours = colours;
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideVehicleColours",
            ...persistNamedNumber("colourIndex", this.colourIndex, this.colourIndexOrigin, this.colourIndexVariableId),
            value: this.value,
            ...persistOriginOnly("body", this.bodyOrigin, this.bodyVariableId),
            ...persistOriginOnly("trim", this.trimOrigin, this.trimVariableId),
            ...persistOriginOnly("tertiary", this.tertiaryOrigin, this.tertiaryVariableId),
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

export class RideTrackColoursStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    schemeIndex: number;
    schemeIndexOrigin?: NumberSourceOrigin;
    schemeIndexVariableId?: string;
    main: number;
    mainOrigin?: NumberSourceOrigin;
    mainVariableId?: string;
    additional: number;
    additionalOrigin?: NumberSourceOrigin;
    additionalVariableId?: string;
    supports: number;
    supportsOrigin?: NumberSourceOrigin;
    supportsVariableId?: string;

    constructor(obj: RideTrackColoursStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.schemeIndex = typeof obj.schemeIndex === "number" ? obj.schemeIndex : 0;
        this.schemeIndexOrigin = obj.schemeIndexOrigin;
        this.schemeIndexVariableId = obj.schemeIndexVariableId;
        this.main = typeof obj.main === "number" ? obj.main : 0;
        this.mainOrigin = obj.mainOrigin;
        this.mainVariableId = obj.mainVariableId;
        this.additional = typeof obj.additional === "number" ? obj.additional : 0;
        this.additionalOrigin = obj.additionalOrigin;
        this.additionalVariableId = obj.additionalVariableId;
        this.supports = typeof obj.supports === "number" ? obj.supports : 0;
        this.supportsOrigin = obj.supportsOrigin;
        this.supportsVariableId = obj.supportsVariableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const schemeIndex = resolveNumberSource(
            this.schemeIndex,
            this.schemeIndexOrigin,
            this.schemeIndexVariableId,
            "int",
            "Ride Track Colours Scheme",
            meta
        );
        if (schemeIndex === null) {
            return;
        }
        const main = resolveNumberSource(this.main, this.mainOrigin, this.mainVariableId, "int", "Ride Track Colours Main", meta);
        const additional = resolveNumberSource(this.additional, this.additionalOrigin, this.additionalVariableId, "int", "Ride Track Colours Additional", meta);
        const supports = resolveNumberSource(this.supports, this.supportsOrigin, this.supportsVariableId, "int", "Ride Track Colours Supports", meta);
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Ride Track Colours");
        for (let i = 0; i < rides.length; i++) {
            const ride = rides[i];
            // colourSchemes_get returns a copy. Index writes are dropped unless the array is assigned back.
            const schemes = ride.colourSchemes;
            if (schemeIndex < 0 || schemeIndex >= schemes.length) {
                error(
                    "step",
                    `Ride Track Colours: scheme ${schemeIndex} out of range`,
                    undefined,
                    meta
                );
                continue;
            }
            const current = schemes[schemeIndex];
            schemes[schemeIndex] = {
                main: main === null ? current.main : main,
                additional: additional === null ? current.additional : additional,
                supports: supports === null ? current.supports : supports
            };
            ride.colourSchemes = schemes;
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideTrackColours",
            ...persistNamedNumber("schemeIndex", this.schemeIndex, this.schemeIndexOrigin, this.schemeIndexVariableId),
            ...persistNamedNumber("main", this.main, this.mainOrigin, this.mainVariableId),
            ...persistNamedNumber("additional", this.additional, this.additionalOrigin, this.additionalVariableId),
            ...persistNamedNumber("supports", this.supports, this.supportsOrigin, this.supportsVariableId),
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

export class RideNumberStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: RideNumberStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.value = typeof obj.value === "number" ? obj.value : 0;
        this.valueOrigin = obj.valueOrigin;
        this.valueVariableId = obj.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveNumberSource(
            this.value,
            this.valueOrigin,
            this.valueVariableId,
            "int",
            this.type,
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, this.type);
        for (let i = 0; i < rides.length; i++) {
            writeRideNumber(rides[i], this.type as RideNumberStepDesc["type"], value);
        }
    }

    getDataToPersist(): object {
        return {
            type: this.type,
            ...persistNamedNumber("value", this.value, this.valueOrigin, this.valueVariableId),
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

export class RideMusicStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    musicObjectIdentifier?: string;
    value?: number;
    playMusic: boolean;

    constructor(obj: RideMusicStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.musicObjectIdentifier = obj.musicObjectIdentifier;
        this.value = typeof obj.value === "number" ? obj.value : undefined;
        this.playMusic = obj.playMusic !== false;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        let index: number | null = null;
        let styleOk = false;
        if (this.musicObjectIdentifier) {
            const object = findMusicObjectByIdentifier(this.musicObjectIdentifier);
            if (!object) {
                error(
                    "step",
                    `Ride Music: music object "${this.musicObjectIdentifier}" is not loaded`,
                    undefined,
                    meta
                );
            } else {
                index = object.index;
                styleOk = true;
            }
        } else if (typeof this.value === "number") {
            index = this.value;
            styleOk = true;
        } else if (this.playMusic) {
            error("step", "Ride Music: no music object", undefined, meta);
        }
        if (!styleOk && this.playMusic) {
            return;
        }
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Ride Music");
        for (let i = 0; i < rides.length; i++) {
            if (styleOk && index !== null) {
                rides[i].music = index;
            }
            context.executeAction("ridesetsetting", {
                ride: rides[i].id,
                setting: RIDE_SETTING_MUSIC,
                value: this.playMusic ? 1 : 0
            });
        }
    }

    getDataToPersist(): object {
        let musicObjectIdentifier = this.musicObjectIdentifier;
        if (!musicObjectIdentifier && typeof this.value === "number") {
            const object = findMusicObjectByIndex(this.value);
            if (object) {
                musicObjectIdentifier = object.identifier;
            }
        }
        return {
            type: "rideMusic",
            playMusic: this.playMusic,
            ...(musicObjectIdentifier
                ? {musicObjectIdentifier}
                : (typeof this.value === "number" ? {value: this.value} : {})),
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

export class RideBreakdownStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    breakdownType: BreakdownType;

    constructor(obj: RideBreakdownStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.breakdownType = obj.breakdownType;
    }

    protected apply(run: StepRunContext): void {
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Ride Breakdown");
        for (let i = 0; i < rides.length; i++) {
            rides[i].setBreakdown(this.breakdownType);
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideBreakdown",
            breakdownType: this.breakdownType,
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}

export class RideFixBreakdownStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;

    constructor(obj: RideFixBreakdownStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
    }

    protected apply(run: StepRunContext): void {
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, "Fix Breakdown");
        for (let i = 0; i < rides.length; i++) {
            rides[i].fixBreakdown();
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideFixBreakdown",
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}
