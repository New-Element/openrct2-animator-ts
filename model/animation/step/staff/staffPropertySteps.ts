/// <reference path="./../../../../openrct2.d.ts" />

import TileCoords from "../../../../game/tileCoords";
import {
    OnOffToggle,
    PatrolMode,
    StaffAnimationStepDesc,
    StaffCostumeStepDesc,
    StaffFlagStepDesc,
    StaffOrdersStepDesc,
    StaffPatrolStepDesc,
    NumberSourceOrigin
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {applyOnOffToggle, logMetaFromRun, persistStaffTarget, resolveStepStaffMembers} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

function tilesToWorld(tiles: TileCoords[]): CoordsXY[] {
    const out: CoordsXY[] = [];
    for (let i = 0; i < tiles.length; i++) {
        out.push({x: tiles[i].x * 32, y: tiles[i].y * 32});
    }
    return out;
}

export class StaffCostumeStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    costume: StaffCostume;

    constructor(obj: StaffCostumeStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.costume = obj.costume;
    }

    protected apply(run: StepRunContext): void {
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Staff Costume");
        for (let i = 0; i < staff.length; i++) {
            staff[i].costume = this.costume;
        }
    }

    getDataToPersist(): object {
        return {
            type: "staffCostume",
            costume: this.costume,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class StaffOrdersStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    orders: number;
    ordersOrigin?: NumberSourceOrigin;
    ordersVariableId?: string;

    constructor(obj: StaffOrdersStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.orders = obj.orders;
        this.ordersOrigin = obj.ordersOrigin;
        this.ordersVariableId = obj.ordersVariableId;
    }

    protected apply(run: StepRunContext): void {
        const orders = resolveNumberSource(
            this.orders,
            this.ordersOrigin,
            this.ordersVariableId,
            "int",
            "Staff Orders",
            logMetaFromRun(run)
        );
        if (orders === null) {
            return;
        }
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Staff Orders");
        for (let i = 0; i < staff.length; i++) {
            staff[i].orders = orders;
        }
    }

    getDataToPersist(): object {
        const source = persistNumberSource(
            this.orders,
            this.ordersOrigin === "variable" ? "variable" : "hardcoded",
            this.ordersVariableId || ""
        );
        return {
            type: "staffOrders",
            orders: source.value,
            ...(source.origin === "variable" ? {ordersOrigin: "variable", ordersVariableId: source.variableId || ""} : {}),
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class StaffPatrolStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    mode: PatrolMode;
    tiles: TileCoords[];

    constructor(obj: StaffPatrolStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.mode = obj.mode;
        this.tiles = obj.tiles || [];
    }

    protected apply(run: StepRunContext): void {
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Staff Patrol");
        const world = tilesToWorld(this.tiles);
        for (let i = 0; i < staff.length; i++) {
            if (this.mode === "clear") {
                staff[i].patrolArea.clear();
                continue;
            }
            if (this.mode === "set") {
                staff[i].patrolArea.clear();
                if (world.length > 0) {
                    staff[i].patrolArea.add(world);
                }
                continue;
            }
            if (this.mode === "add") {
                if (world.length > 0) {
                    staff[i].patrolArea.add(world);
                }
                continue;
            }
            if (world.length > 0) {
                staff[i].patrolArea.remove(world);
            }
        }
    }

    getDataToPersist(): object {
        const tiles: TileCoords[] = [];
        for (let i = 0; i < this.tiles.length; i++) {
            tiles.push({x: this.tiles[i].x, y: this.tiles[i].y});
        }
        return {
            type: "staffPatrol",
            mode: this.mode,
            tiles: tiles,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class StaffAnimationStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    animation: StaffAnimation;

    constructor(obj: StaffAnimationStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.animation = obj.animation;
    }

    protected apply(run: StepRunContext): void {
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Staff Animation");
        for (let i = 0; i < staff.length; i++) {
            staff[i].animation = this.animation;
        }
    }

    getDataToPersist(): object {
        return {
            type: "staffAnimation",
            animation: this.animation,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class StaffFlagStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    flag: PeepFlags;
    mode: OnOffToggle;

    constructor(obj: StaffFlagStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.flag = obj.flag;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Staff Flag");
        for (let i = 0; i < staff.length; i++) {
            staff[i].setFlag(this.flag, applyOnOffToggle(staff[i].getFlag(this.flag), this.mode));
        }
    }

    getDataToPersist(): object {
        return {
            type: "staffFlag",
            flag: this.flag,
            mode: this.mode,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}
