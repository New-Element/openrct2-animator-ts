/// <reference path="./../../../../openrct2.d.ts" />

import {
    EntityScope,
    ExistsOp,
    GuestExistsConditionDesc,
    GuestFlagConditionDesc,
    GuestItemConditionDesc,
    GuestLocationConditionDesc,
    GuestNeedConditionDesc,
    GuestNeedField,
    HasOp,
    OccupancyOp,
    OnOff
} from "../../jsonTypes";
import {persistTileTargetFields} from "../../step/tileTarget";
import TriggerContext from "../triggerContext";
import {compareNumbers} from "./compare";
import Condition from "./condition";
import {
    entityTile,
    guestIdFromContext,
    resolveConditionGuest,
    resolveConditionTile,
    tilesEqual,
    worldCoordsForTile
} from "./resolveEntities";

function guestExists(useTrigger: boolean, guestId: number | undefined, context: TriggerContext): boolean | null {
    const id = useTrigger ? guestIdFromContext(context) : guestId;
    if (typeof id !== "number") {
        return null;
    }
    const entity = map.getEntity(id);
    return !!entity && entity.type === "guest";
}

function guestNeedValue(guest: Guest, field: GuestNeedField): number {
    switch (field) {
        case "happiness":
            return guest.happiness;
        case "happinessTarget":
            return guest.happinessTarget;
        case "hunger":
            return guest.hunger;
        case "thirst":
            return guest.thirst;
        case "toilet":
            return guest.toilet;
        case "nausea":
            return guest.nausea;
        case "nauseaTarget":
            return guest.nauseaTarget;
        case "energy":
            return guest.energy;
        case "energyTarget":
            return guest.energyTarget;
        default:
            return guest.happiness;
    }
}

function occupancyMatches(onTile: boolean, occupancy: OccupancyOp): boolean {
    return occupancy === "on" ? onTile : !onTile;
}

export class GuestExistsCondition extends Condition {
    type: "guestExists" = "guestExists";
    useTriggerGuest: boolean;
    guestId?: number;
    expected: ExistsOp;

    constructor(obj: GuestExistsConditionDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest !== false;
        if (obj.guestId !== undefined) {
            this.guestId = obj.guestId;
        }
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const exists = guestExists(this.useTriggerGuest, this.guestId, context);
        if (exists === null) {
            return false;
        }
        return this.expected === "exists" ? exists : !exists;
    }

    getDataToPersist(): object {
        const data: GuestExistsConditionDesc = {
            type: "guestExists",
            useTriggerGuest: this.useTriggerGuest,
            expected: this.expected
        };
        if (!this.useTriggerGuest && this.guestId !== undefined) {
            data.guestId = this.guestId;
        }
        return data;
    }
}

export class GuestLocationCondition extends Condition {
    type: "guestLocation" = "guestLocation";
    scope: EntityScope;
    useTriggerGuest: boolean;
    guestId?: number;
    occupancy: OccupancyOp;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: GuestLocationConditionDesc) {
        super(obj);
        this.scope = obj.scope;
        this.useTriggerGuest = obj.useTriggerGuest !== false;
        if (obj.guestId !== undefined) {
            this.guestId = obj.guestId;
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
            const guests = map.getAllEntitiesOnTile("guest", worldCoordsForTile(tile));
            return occupancyMatches(guests.length > 0, this.occupancy);
        }
        const guest = resolveConditionGuest(this.useTriggerGuest, this.guestId, context);
        if (!guest) {
            return false;
        }
        return occupancyMatches(tilesEqual(entityTile(guest), tile), this.occupancy);
    }

    getDataToPersist(): object {
        const data: GuestLocationConditionDesc = {
            type: "guestLocation",
            scope: this.scope,
            useTriggerGuest: this.useTriggerGuest,
            occupancy: this.occupancy,
            ...persistTileTargetFields({
                relativeToTrigger: this.relativeToTrigger === true,
                tile: this.tile || {x: 0, y: 0},
                offset: this.offset || {x: 0, y: 0}
            })
        };
        if (!this.useTriggerGuest && this.guestId !== undefined) {
            data.guestId = this.guestId;
        }
        return data;
    }
}

export class GuestNeedCondition extends Condition {
    type: "guestNeed" = "guestNeed";
    useTriggerGuest: boolean;
    guestId?: number;
    field: GuestNeedField;
    op: GuestNeedConditionDesc["op"];
    value: number;

    constructor(obj: GuestNeedConditionDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest !== false;
        if (obj.guestId !== undefined) {
            this.guestId = obj.guestId;
        }
        this.field = obj.field;
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(context: TriggerContext): boolean {
        const guest = resolveConditionGuest(this.useTriggerGuest, this.guestId, context);
        if (!guest) {
            return false;
        }
        return compareNumbers(guestNeedValue(guest, this.field), this.op, this.value);
    }

    getDataToPersist(): object {
        const data: GuestNeedConditionDesc = {
            type: "guestNeed",
            useTriggerGuest: this.useTriggerGuest,
            field: this.field,
            op: this.op,
            value: this.value
        };
        if (!this.useTriggerGuest && this.guestId !== undefined) {
            data.guestId = this.guestId;
        }
        return data;
    }
}

export class GuestItemCondition extends Condition {
    type: "guestItem" = "guestItem";
    useTriggerGuest: boolean;
    guestId?: number;
    item: GuestItemType;
    expected: HasOp;

    constructor(obj: GuestItemConditionDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest !== false;
        if (obj.guestId !== undefined) {
            this.guestId = obj.guestId;
        }
        this.item = obj.item;
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const guest = resolveConditionGuest(this.useTriggerGuest, this.guestId, context);
        if (!guest) {
            return false;
        }
        const has = guest.hasItem({type: this.item});
        return this.expected === "has" ? has : !has;
    }

    getDataToPersist(): object {
        const data: GuestItemConditionDesc = {
            type: "guestItem",
            useTriggerGuest: this.useTriggerGuest,
            item: this.item,
            expected: this.expected
        };
        if (!this.useTriggerGuest && this.guestId !== undefined) {
            data.guestId = this.guestId;
        }
        return data;
    }
}

export class GuestFlagCondition extends Condition {
    type: "guestFlag" = "guestFlag";
    useTriggerGuest: boolean;
    guestId?: number;
    flag: PeepFlags;
    expected: OnOff;

    constructor(obj: GuestFlagConditionDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest !== false;
        if (obj.guestId !== undefined) {
            this.guestId = obj.guestId;
        }
        this.flag = obj.flag;
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const guest = resolveConditionGuest(this.useTriggerGuest, this.guestId, context);
        if (!guest) {
            return false;
        }
        return guest.getFlag(this.flag) === (this.expected === "on");
    }

    getDataToPersist(): object {
        const data: GuestFlagConditionDesc = {
            type: "guestFlag",
            useTriggerGuest: this.useTriggerGuest,
            flag: this.flag,
            expected: this.expected
        };
        if (!this.useTriggerGuest && this.guestId !== undefined) {
            data.guestId = this.guestId;
        }
        return data;
    }
}
