/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {
    BlockBrakeStepDesc,
    NumberSourceOrigin,
    OnOffToggle,
    TrackBrakeSpeedStepDesc,
    TrackColourSchemeStepDesc,
    TrackHighlightedStepDesc,
    TrackInvertedStepDesc,
    TrackSeatRotationStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {
    applyOnOffToggle,
    logMetaFromRun,
    persistTrackPiece,
    resolveStepMapTiles,
    resolveStepTracks
} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget} from "../tileTarget";

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

export class TrackColourSchemeStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    colourScheme: number;
    colourSchemeOrigin?: NumberSourceOrigin;
    colourSchemeVariableId?: string;

    constructor(obj: TrackColourSchemeStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.colourScheme = typeof obj.colourScheme === "number" ? obj.colourScheme : 0;
        this.colourSchemeOrigin = obj.colourSchemeOrigin;
        this.colourSchemeVariableId = obj.colourSchemeVariableId;
    }

    protected apply(run: StepRunContext): void {
        const colourScheme = resolveNumberSource(
            this.colourScheme,
            this.colourSchemeOrigin,
            this.colourSchemeVariableId,
            "int",
            "Track Colour Scheme",
            logMetaFromRun(run)
        );
        if (colourScheme === null) {
            return;
        }
        const tracks = resolveStepTracks(run, this.tileTarget, this.rideId, this.trackType, "Track Colour Scheme");
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].colourScheme === null) {
                continue;
            }
            tracks[i].colourScheme = colourScheme;
        }
    }

    getDataToPersist(): object {
        return {
            type: "trackColourScheme",
            ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType),
            ...persistNamedNumber("colourScheme", this.colourScheme, this.colourSchemeOrigin, this.colourSchemeVariableId)
        };
    }
}

export class TrackSeatRotationStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    seatRotation: number;
    seatRotationOrigin?: NumberSourceOrigin;
    seatRotationVariableId?: string;

    constructor(obj: TrackSeatRotationStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.seatRotation = typeof obj.seatRotation === "number" ? obj.seatRotation : 0;
        this.seatRotationOrigin = obj.seatRotationOrigin;
        this.seatRotationVariableId = obj.seatRotationVariableId;
    }

    protected apply(run: StepRunContext): void {
        const seatRotation = resolveNumberSource(
            this.seatRotation,
            this.seatRotationOrigin,
            this.seatRotationVariableId,
            "int",
            "Seat Rotation",
            logMetaFromRun(run)
        );
        if (seatRotation === null) {
            return;
        }
        const tracks = resolveStepTracks(run, this.tileTarget, this.rideId, this.trackType, "Seat Rotation");
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].seatRotation === null) {
                error("step", "Seat Rotation: piece has no seat rotation", undefined, logMetaFromRun(run));
                continue;
            }
            tracks[i].seatRotation = seatRotation;
        }
    }

    getDataToPersist(): object {
        return {
            type: "trackSeatRotation",
            ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType),
            ...persistNamedNumber("seatRotation", this.seatRotation, this.seatRotationOrigin, this.seatRotationVariableId)
        };
    }
}

export class TrackInvertedStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    mode: OnOffToggle;

    constructor(obj: TrackInvertedStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const tracks = resolveStepTracks(run, this.tileTarget, this.rideId, this.trackType, "Track Inverted");
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].isInverted = applyOnOffToggle(tracks[i].isInverted, this.mode);
        }
    }

    getDataToPersist(): object {
        return {type: "trackInverted", ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType), mode: this.mode};
    }
}

export class TrackBrakeSpeedStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: TrackBrakeSpeedStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
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
            "Brake / Booster Speed",
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        const tracks = resolveStepTracks(run, this.tileTarget, this.rideId, this.trackType, "Brake / Booster Speed");
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].brakeBoosterSpeed === null) {
                error("step", "Brake / Booster Speed: piece has no speed", undefined, logMetaFromRun(run));
                continue;
            }
            tracks[i].brakeBoosterSpeed = value;
        }
    }

    getDataToPersist(): object {
        return {
            type: "trackBrakeSpeed",
            ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType),
            ...persistNamedNumber("value", this.value, this.valueOrigin, this.valueVariableId)
        };
    }
}

export class TrackHighlightedStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    mode: OnOffToggle;

    constructor(obj: TrackHighlightedStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const tracks = resolveStepTracks(run, this.tileTarget, this.rideId, this.trackType, "Track Highlighted");
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].isHighlighted = applyOnOffToggle(tracks[i].isHighlighted, this.mode);
        }
    }

    getDataToPersist(): object {
        return {type: "trackHighlighted", ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType), mode: this.mode};
    }
}

export class BlockBrakeStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    mode: OnOffToggle;

    constructor(obj: BlockBrakeStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Block Brake");
        for (let i = 0; i < mapTiles.length; i++) {
            const mapTile = mapTiles[i];
            const index = mapTile.findTrackIndex(this.rideId, this.trackType);
            if (index === null) {
                error("step", "Block Brake: track piece not found", undefined, logMetaFromRun(run));
                continue;
            }
            const closed = applyOnOffToggle(mapTile.isBlockBrakeClosed(index), this.mode);
            mapTile.setBlockBrakeClosed(index, closed);
        }
    }

    getDataToPersist(): object {
        return {type: "blockBrake", ...persistTrackPiece(this.tileTarget, this.rideId, this.trackType), mode: this.mode};
    }
}
