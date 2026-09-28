/// <reference path="./../../../openrct2.d.ts" />

import {error} from "../../logger";
import {CreateParticleLaunch, ShootParticlesStepDesc, VehicleTargetDesc} from "../jsonTypes";
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

const TILE_SIZE = 32;
const GRAVITY = 5041;
const PARTICLE_TYPES: CrashParticleType[] = ["corner", "rod", "wheel", "panel", "seat"];

function clamp(value: number, minimum: number, maximum: number, fallback: number): number {
    if (typeof value !== "number" || !isFinite(value)) {
        return fallback;
    }
    if (value < minimum) {
        return minimum;
    }
    if (value > maximum) {
        return maximum;
    }
    return value;
}

function drag(acceleration: number): number {
    return acceleration - Math.trunc(acceleration / 256);
}

function signed16(value: number): number {
    const bits = value & 0xFFFF;
    return bits >= 32768 ? bits - 65536 : bits;
}

/** One game tick of a crash particle. Matches VehicleCrashParticle::update movement. */
function stepParticle(
    ax: number,
    ay: number,
    az: number,
    vx: number,
    vy: number,
    vz: number
): {ax: number; ay: number; az: number; vx: number; vy: number; vz: number; dy: number; dz: number} {
    az -= GRAVITY;
    ax = drag(ax);
    ay = drag(ay);
    az = drag(az);
    vx += ax;
    vy += ay;
    vz += az;
    const dy = vy >> 16;
    const dz = vz >> 16;
    return {ax, ay, az, vx: signed16(vx), vy: signed16(vy), vz: signed16(vz), dy, dz};
}

function travel(ay: number, az: number, moves: number): {y: number; z: number} {
    let ax = 0;
    let vx = 0;
    let vy = 0;
    let vz = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < moves; i++) {
        const next = stepParticle(ax, ay, az, vx, vy, vz);
        ax = next.ax;
        ay = next.ay;
        az = next.az;
        vx = next.vx;
        vy = next.vy;
        vz = next.vz;
        y += next.dy;
        z += next.dz;
    }
    return {y, z};
}

/** Initial sideways push so a flat shot covers distanceUnits within moves ticks. */
function speedForDistance(distanceUnits: number, moves: number): number {
    let low = 0;
    let high = 5000000;
    for (let i = 0; i < 28; i++) {
        const mid = Math.floor((low + high) / 2);
        if (travel(mid, 0, moves).y < distanceUnits) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return low;
}

/** Upward push that cancels gravity for a flat shot of this speed and length. */
function liftForLevel(speed: number, moves: number): number {
    let best = 0;
    let bestDrop = Number.MAX_VALUE;
    const limit = moves + 2;
    for (let k = 0; k <= limit; k++) {
        const drop = Math.abs(travel(speed, GRAVITY * k, moves).z);
        if (drop < bestDrop) {
            bestDrop = drop;
            best = GRAVITY * k;
        }
    }
    return best;
}

function jitterDegrees(base: number, spread: number): number {
    if (spread <= 0) {
        return base;
    }
    return base + (Math.random() * 2 - 1) * spread;
}

export default class ShootParticlesStep extends InstantStep {
    launch: CreateParticleLaunch;
    target: VehicleTargetDesc;
    tile: {x: number; y: number};
    z: number;
    count: number;
    direction: number;
    tilt: number;
    spread: number;
    distance: number;
    lifetime: number;
    body: number;
    trim: number;
    body2: number;
    trim2: number;

    constructor(obj: ShootParticlesStepDesc) {
        super(obj);
        this.launch = readParticleLaunch(obj.launch);
        this.target = readParticleTarget(obj);
        this.tile = readParticleTile(obj.tile);
        this.z = typeof obj.z === "number" ? obj.z : 0;
        this.count = Math.round(clamp(obj.count, 1, 60, 24));
        this.direction = clamp(obj.direction, 0, 359, 0);
        this.tilt = clamp(obj.tilt, 0, 90, 0);
        this.spread = clamp(obj.spread, 0, 90, 12);
        this.distance = Math.round(clamp(obj.distance, 1, 30, 3));
        this.lifetime = Math.round(clamp(obj.lifetime, 2, 200, 40));
        this.body = typeof obj.body === "number" ? obj.body : 17;
        this.trim = typeof obj.trim === "number" ? obj.trim : 20;
        this.body2 = typeof obj.body2 === "number" ? obj.body2 : 28;
        this.trim2 = typeof obj.trim2 === "number" ? obj.trim2 : 21;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const pos = resolveParticleLaunch(run, "Shoot Particles", this.launch, this.target, this.tile, this.z);
        if (!pos) {
            return;
        }
        const moves = Math.max(1, this.lifetime - 1);
        const speed = speedForDistance(this.distance * TILE_SIZE, moves);
        const lift = liftForLevel(speed, moves);
        let spawned = 0;
        for (let i = 0; i < this.count; i++) {
            if (this.spawnOne(pos, speed, lift)) {
                spawned += 1;
            }
        }
        if (spawned < this.count) {
            error(
                "step",
                `Shoot Particles: spawned ${spawned} of ${this.count}`,
                undefined,
                meta
            );
        }
    }

    private spawnOne(pos: CoordsXYZ, speed: number, lift: number): boolean {
        const entity = map.createEntity("crashed_vehicle_particle", pos);
        if (!entity || entity.type !== "crashed_vehicle_particle") {
            return false;
        }
        const direction = jitterDegrees(this.direction, this.spread) * Math.PI / 180;
        let tilt = jitterDegrees(this.tilt, this.spread);
        if (tilt < -90) {
            tilt = -90;
        }
        if (tilt > 90) {
            tilt = 90;
        }
        const tiltRad = tilt * Math.PI / 180;
        const cosTilt = Math.cos(tiltRad);
        const particle = entity as CrashedVehicleParticle;
        const useSecond = Math.random() < 0.5;
        const life = Math.max(2, Math.round(this.lifetime * (0.8 + Math.random() * 0.4)));
        particle.timeToLive = life;
        particle.acceleration = {
            x: Math.round(speed * Math.sin(direction) * cosTilt),
            y: Math.round(speed * Math.cos(direction) * cosTilt),
            z: Math.round(speed * Math.sin(tiltRad) + lift)
        };
        particle.colours = useSecond
            ? {body: this.body2, trim: this.trim2}
            : {body: this.body, trim: this.trim};
        particle.frame = Math.floor(Math.random() * 12);
        particle.crashParticleType = PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)];
        return true;
    }

    getDataToPersist(): object {
        const base = {
            type: "shootParticles",
            launch: this.launch,
            count: this.count,
            direction: this.direction,
            tilt: this.tilt,
            spread: this.spread,
            distance: this.distance,
            lifetime: this.lifetime,
            body: this.body,
            trim: this.trim,
            body2: this.body2,
            trim2: this.trim2
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
