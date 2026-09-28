/// <reference path="./../../../openrct2.d.ts" />

import {error} from "../../logger";
import {CreateParticleKind, CreateParticleLaunch, CreateParticleStepDesc, VehicleTargetDesc} from "../jsonTypes";
import {persistVehicleTargetFields} from "./car/vehicleTarget";
import InstantStep from "./instantStep";
import {logMetaFromRun} from "./stepHelpers";
import {
    readParticleLaunch,
    readParticleTarget,
    readParticleTile,
    resolveParticleLaunch
} from "./particleLaunch";
import StepRunContext from "./stepRunContext";

const ENTITY_TYPE: {[kind in CreateParticleKind]: EntityType} = {
    steam: "steam_particle",
    explosionCloud: "explosion_cloud",
    explosionFlare: "explosion_flare"
};

function isParticleKind(value: string): value is CreateParticleKind {
    return value === "steam" || value === "explosionCloud" || value === "explosionFlare";
}

export default class CreateParticleStep extends InstantStep {
    particle: CreateParticleKind;
    launch: CreateParticleLaunch;
    target: VehicleTargetDesc;
    tile: {x: number; y: number};
    z: number;

    constructor(obj: CreateParticleStepDesc) {
        super(obj);
        this.particle = isParticleKind(obj.particle) ? obj.particle : "steam";
        this.launch = readParticleLaunch(obj.launch);
        this.target = readParticleTarget(obj);
        this.tile = readParticleTile(obj.tile);
        this.z = typeof obj.z === "number" ? obj.z : 0;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const pos = resolveParticleLaunch(run, "Create Particle", this.launch, this.target, this.tile, this.z);
        if (!pos) {
            return;
        }
        const entityType = ENTITY_TYPE[this.particle];
        const entity = map.createEntity(entityType, pos);
        if (!entity || entity.type !== entityType) {
            error("step", "Create Particle: could not spawn", undefined, meta);
        }
    }

    getDataToPersist(): object {
        const base = {
            type: "createParticle",
            particle: this.particle,
            launch: this.launch
        };
        if (this.launch === "tile") {
            return {
                ...base,
                tile: {x: this.tile.x, y: this.tile.y},
                z: this.z
            };
        }
        return {
            ...base,
            ...persistVehicleTargetFields(this.target)
        };
    }
}
