/// <reference path="./../../../../openrct2.d.ts" />

import {
    EntityScope,
    ExistsOp,
    OccupancyOp,
    OnOff,
    StaffExistsConditionDesc,
    StaffFlagConditionDesc,
    StaffLocationConditionDesc
} from "../../jsonTypes";
import {persistTileTargetFields} from "../../step/tileTarget";
import TriggerContext from "../triggerContext";
import Condition from "./condition";
import {
    entityTile,
    resolveConditionStaff,
    resolveConditionTile,
    staffIdFromContext,
    tilesEqual,
    worldCoordsForTile
} from "./resolveEntities";

function staffExists(useTrigger: boolean, staffId: number | undefined, context: TriggerContext): boolean | null {
    const id = useTrigger ? staffIdFromContext(context) : staffId;
    if (typeof id !== "number") {
        return null;
    }
    const entity = map.getEntity(id);
    return !!entity && entity.type === "staff";
}

function occupancyMatches(onTile: boolean, occupancy: OccupancyOp): boolean {
    return occupancy === "on" ? onTile : !onTile;
}

export class StaffExistsCondition extends Condition {
    type: "staffExists" = "staffExists";
    useTriggerStaff: boolean;
    staffId?: number;
    expected: ExistsOp;

    constructor(obj: StaffExistsConditionDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff !== false;
        if (obj.staffId !== undefined) {
            this.staffId = obj.staffId;
        }
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const exists = staffExists(this.useTriggerStaff, this.staffId, context);
        if (exists === null) {
            return false;
        }
        return this.expected === "exists" ? exists : !exists;
    }

    getDataToPersist(): object {
        const data: StaffExistsConditionDesc = {
            type: "staffExists",
            useTriggerStaff: this.useTriggerStaff,
            expected: this.expected
        };
        if (!this.useTriggerStaff && this.staffId !== undefined) {
            data.staffId = this.staffId;
        }
        return data;
    }
}

export class StaffLocationCondition extends Condition {
    type: "staffLocation" = "staffLocation";
    scope: EntityScope;
    useTriggerStaff: boolean;
    staffId?: number;
    staffType?: StaffType;
    occupancy: OccupancyOp;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: StaffLocationConditionDesc) {
        super(obj);
        this.scope = obj.scope;
        this.useTriggerStaff = obj.useTriggerStaff !== false;
        if (obj.staffId !== undefined) {
            this.staffId = obj.staffId;
        }
        if (obj.staffType !== undefined) {
            this.staffType = obj.staffType;
        }
        this.occupancy = obj.occupancy;
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        const tile = resolveConditionTile(this, context);
        if (!tile) {
            return false;
        }
        if (this.scope === "any") {
            const staff = map.getAllEntitiesOnTile("staff", worldCoordsForTile(tile));
            let count = 0;
            for (let i = 0; i < staff.length; i++) {
                if (this.staffType && staff[i].staffType !== this.staffType) {
                    continue;
                }
                count += 1;
            }
            return occupancyMatches(count > 0, this.occupancy);
        }
        const member = resolveConditionStaff(this.useTriggerStaff, this.staffId, context);
        if (!member) {
            return false;
        }
        if (this.staffType && member.staffType !== this.staffType) {
            return occupancyMatches(false, this.occupancy);
        }
        return occupancyMatches(tilesEqual(entityTile(member), tile), this.occupancy);
    }

    getDataToPersist(): object {
        const data: StaffLocationConditionDesc = {
            type: "staffLocation",
            scope: this.scope,
            useTriggerStaff: this.useTriggerStaff,
            occupancy: this.occupancy,
            ...persistTileTargetFields({
                relativeToTrigger: this.relativeToTrigger === true,
                tile: this.tile || {x: 0, y: 0},
                offset: this.offset || {x: 0, y: 0}
            })
        };
        if (!this.useTriggerStaff && this.staffId !== undefined) {
            data.staffId = this.staffId;
        }
        if (this.staffType !== undefined) {
            data.staffType = this.staffType;
        }
        return data;
    }
}

export class StaffFlagCondition extends Condition {
    type: "staffFlag" = "staffFlag";
    useTriggerStaff: boolean;
    staffId?: number;
    flag: PeepFlags;
    expected: OnOff;

    constructor(obj: StaffFlagConditionDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff !== false;
        if (obj.staffId !== undefined) {
            this.staffId = obj.staffId;
        }
        this.flag = obj.flag;
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const member = resolveConditionStaff(this.useTriggerStaff, this.staffId, context);
        if (!member) {
            return false;
        }
        return member.getFlag(this.flag) === (this.expected === "on");
    }

    getDataToPersist(): object {
        const data: StaffFlagConditionDesc = {
            type: "staffFlag",
            useTriggerStaff: this.useTriggerStaff,
            flag: this.flag,
            expected: this.expected
        };
        if (!this.useTriggerStaff && this.staffId !== undefined) {
            data.staffId = this.staffId;
        }
        return data;
    }
}
