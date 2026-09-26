/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {error} from "../../../logger";
import {
    EdgeStyleStepDesc,
    GrassLengthStepDesc,
    LandHeightStepDesc,
    LandSlopeStepDesc,
    NumberSourceOrigin,
    SurfaceStyleStepDesc,
    WaterHeightStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun, resolveStepMapTiles} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";

function applySurface(
    run: StepRunContext,
    tileTarget: LoadedTileTarget,
    label: string,
    write: (surface: SurfaceElement, mapTile: MapTile) => void
): void {
    const mapTiles = resolveStepMapTiles(run, tileTarget, label);
    for (let i = 0; i < mapTiles.length; i++) {
        const mapTile = mapTiles[i];
        const surface = mapTile.surface();
        if (!surface) {
            error("step", `${label}: no surface`, undefined, logMetaFromRun(run));
            continue;
        }
        write(surface, mapTile);
    }
}

type SurfaceValueFields = {
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
};

function loadSurfaceValue(obj: SurfaceValueFields): SurfaceValueFields {
    return {
        value: typeof obj.value === "number" ? obj.value : 0,
        valueOrigin: obj.valueOrigin,
        valueVariableId: obj.valueVariableId
    };
}

function persistSurfaceValue(fields: SurfaceValueFields): SurfaceValueFields {
    const source = persistNumberSource(
        fields.value,
        fields.valueOrigin === "variable" ? "variable" : "hardcoded",
        fields.valueVariableId || ""
    );
    return {
        value: source.value,
        ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {})
    };
}

function resolveSurfaceValue(fields: SurfaceValueFields, label: string, run: StepRunContext): number | null {
    return resolveNumberSource(
        fields.value,
        fields.valueOrigin,
        fields.valueVariableId,
        "int",
        label,
        logMetaFromRun(run)
    );
}

export class LandHeightStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: LandHeightStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        const fields = loadSurfaceValue(obj);
        this.value = fields.value;
        this.valueOrigin = fields.valueOrigin;
        this.valueVariableId = fields.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveSurfaceValue(this, "Land Height", run);
        if (value === null) {
            return;
        }
        applySurface(run, this.tileTarget, "Land Height", (surface, mapTile) => {
            mapTile.setSurfaceBaseHeight(surface, value);
        });
    }

    getDataToPersist(): object {
        return {type: "landHeight", ...persistTileTargetFields(this.tileTarget), ...persistSurfaceValue(this)};
    }
}

export class WaterHeightStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: WaterHeightStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        const fields = loadSurfaceValue(obj);
        this.value = fields.value;
        this.valueOrigin = fields.valueOrigin;
        this.valueVariableId = fields.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveSurfaceValue(this, "Water Height", run);
        if (value === null) {
            return;
        }
        applySurface(run, this.tileTarget, "Water Height", (surface) => {
            surface.waterHeight = value;
        });
    }

    getDataToPersist(): object {
        return {type: "waterHeight", ...persistTileTargetFields(this.tileTarget), ...persistSurfaceValue(this)};
    }
}

export class LandSlopeStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: LandSlopeStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        const fields = loadSurfaceValue(obj);
        this.value = fields.value;
        this.valueOrigin = fields.valueOrigin;
        this.valueVariableId = fields.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveSurfaceValue(this, "Land Slope", run);
        if (value === null) {
            return;
        }
        applySurface(run, this.tileTarget, "Land Slope", (surface) => {
            surface.slope = value;
        });
    }

    getDataToPersist(): object {
        return {type: "landSlope", ...persistTileTargetFields(this.tileTarget), ...persistSurfaceValue(this)};
    }
}

export class SurfaceStyleStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: SurfaceStyleStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        const fields = loadSurfaceValue(obj);
        this.value = fields.value;
        this.valueOrigin = fields.valueOrigin;
        this.valueVariableId = fields.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveSurfaceValue(this, "Surface Style", run);
        if (value === null) {
            return;
        }
        applySurface(run, this.tileTarget, "Surface Style", (surface) => {
            surface.surfaceStyle = value;
        });
    }

    getDataToPersist(): object {
        return {type: "surfaceStyle", ...persistTileTargetFields(this.tileTarget), ...persistSurfaceValue(this)};
    }
}

export class EdgeStyleStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: EdgeStyleStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        const fields = loadSurfaceValue(obj);
        this.value = fields.value;
        this.valueOrigin = fields.valueOrigin;
        this.valueVariableId = fields.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveSurfaceValue(this, "Edge Style", run);
        if (value === null) {
            return;
        }
        applySurface(run, this.tileTarget, "Edge Style", (surface) => {
            surface.edgeStyle = value;
        });
    }

    getDataToPersist(): object {
        return {type: "edgeStyle", ...persistTileTargetFields(this.tileTarget), ...persistSurfaceValue(this)};
    }
}

export class GrassLengthStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    value: number;

    constructor(obj: GrassLengthStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.value = obj.value;
    }

    protected apply(run: StepRunContext): void {
        applySurface(run, this.tileTarget, "Grass Length", (surface) => {
            surface.grassLength = this.value;
        });
    }

    getDataToPersist(): object {
        return {type: "grassLength", ...persistTileTargetFields(this.tileTarget), value: this.value};
    }
}
