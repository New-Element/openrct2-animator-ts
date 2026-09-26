/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {error} from "../../../logger";
import {
    OnOffToggle,
    PathAdditionVandalisedStepDesc,
    PathBinFullStepDesc,
    PathLitterStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {applyOnOffToggle, logMetaFromRun, resolveStepMapTiles} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";

const TILE_SIZE = 32;
const BIN_FULL_STATUS = 0;
const BIN_EMPTY_STATUS = 255;

function applyFootpathAddition(
    run: StepRunContext,
    tileTarget: LoadedTileTarget,
    label: string,
    missingMessage: string,
    write: (path: FootpathElement) => boolean
): void {
    const mapTiles = resolveStepMapTiles(run, tileTarget, label);
    let foundPath = false;
    let applied = false;
    for (let i = 0; i < mapTiles.length; i++) {
        const paths = mapTiles[i].footpaths();
        for (let p = 0; p < paths.length; p++) {
            if (paths[p].isGhost) {
                continue;
            }
            foundPath = true;
            if (write(paths[p])) {
                applied = true;
            }
        }
    }
    if (!foundPath) {
        error("step", `${label}: no path`, undefined, logMetaFromRun(run));
        return;
    }
    if (!applied) {
        error("step", `${label}: ${missingMessage}`, undefined, logMetaFromRun(run));
    }
}

function pathZ(mapTile: MapTile): number {
    const paths = mapTile.footpaths();
    for (let i = 0; i < paths.length; i++) {
        if (!paths[i].isGhost) {
            return paths[i].baseZ;
        }
    }
    const surface = mapTile.surface();
    return surface ? surface.baseZ : 0;
}

function clearLitterOnTile(mapTile: MapTile): void {
    const litter = map.getAllEntitiesOnTile("litter", {x: mapTile.x, y: mapTile.y});
    for (let i = 0; i < litter.length; i++) {
        litter[i].remove();
    }
}

function addLitterOnTile(run: StepRunContext, mapTile: MapTile, litterType: LitterType): void {
    const entity = map.createEntity("litter", {
        x: mapTile.x * TILE_SIZE + TILE_SIZE / 2,
        y: mapTile.y * TILE_SIZE + TILE_SIZE / 2,
        z: pathZ(mapTile)
    });
    if (!entity || entity.type !== "litter") {
        error("step", "Path Litter: could not add litter", undefined, logMetaFromRun(run));
        return;
    }
    (entity as Litter).litterType = litterType;
}

export class PathAdditionVandalisedStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    mode: OnOffToggle;

    constructor(obj: PathAdditionVandalisedStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        applyFootpathAddition(run, this.tileTarget, "Path Addition Vandalised", "no path addition", (path) => {
            if (path.addition === null || path.isAdditionBroken === null) {
                return false;
            }
            path.isAdditionBroken = applyOnOffToggle(path.isAdditionBroken, this.mode);
            return true;
        });
    }

    getDataToPersist(): object {
        return {
            type: "pathAdditionVandalised",
            ...persistTileTargetFields(this.tileTarget),
            mode: this.mode
        };
    }
}

export class PathBinFullStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    mode: OnOffToggle;

    constructor(obj: PathBinFullStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        applyFootpathAddition(run, this.tileTarget, "Bin Full", "no bin", (path) => {
            if (path.isAdditionFull === null) {
                return false;
            }
            const full = applyOnOffToggle(path.isAdditionFull, this.mode);
            path.additionStatus = full ? BIN_FULL_STATUS : BIN_EMPTY_STATUS;
            return true;
        });
    }

    getDataToPersist(): object {
        return {
            type: "pathBinFull",
            ...persistTileTargetFields(this.tileTarget),
            mode: this.mode
        };
    }
}

export class PathLitterStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    mode: OnOffToggle;
    litterType: LitterType;

    constructor(obj: PathLitterStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.mode = obj.mode;
        this.litterType = obj.litterType;
    }

    protected apply(run: StepRunContext): void {
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Path Litter");
        for (let i = 0; i < mapTiles.length; i++) {
            const mapTile = mapTiles[i];
            const existing = map.getAllEntitiesOnTile("litter", {x: mapTile.x, y: mapTile.y});
            const hasLitter = existing.length > 0;
            if (this.mode === "off" || (this.mode === "toggle" && hasLitter)) {
                clearLitterOnTile(mapTile);
                continue;
            }
            addLitterOnTile(run, mapTile, this.litterType);
        }
    }

    getDataToPersist(): object {
        return {
            type: "pathLitter",
            ...persistTileTargetFields(this.tileTarget),
            mode: this.mode,
            litterType: this.litterType
        };
    }
}
