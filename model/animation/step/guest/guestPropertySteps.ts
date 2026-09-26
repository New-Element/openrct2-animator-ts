/// <reference path="./../../../../openrct2.d.ts" />

import {
    GuestAnimationStepDesc,
    GuestClothesStepDesc,
    GuestFavouriteRideStepDesc,
    GuestFlagStepDesc,
    GuestItemStepDesc,
    GuestMoveStepDesc,
    GuestNeedField,
    GuestNeedStepDesc,
    NumberSourceOrigin,
    OnOffToggle
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistCoordsSource, readCoordsSourceOrigin, resolveCoordsSource} from "../coordsSource";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {applyOnOffToggle, logMetaFromRun, persistGuestTarget, resolveStepGuests} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

function clampNeed(field: GuestNeedField, value: number): number {
    if (field === "energy" || field === "energyTarget") {
        if (value < 32) {
            return 32;
        }
        if (value > 128) {
            return 128;
        }
        return value;
    }
    if (value < 0) {
        return 0;
    }
    if (value > 255) {
        return 255;
    }
    return value;
}

function writeNeed(guest: Guest, field: GuestNeedField, value: number): void {
    const next = clampNeed(field, value);
    if (field === "happiness") {
        guest.happiness = next;
        return;
    }
    if (field === "happinessTarget") {
        guest.happinessTarget = next;
        return;
    }
    if (field === "hunger") {
        guest.hunger = next;
        return;
    }
    if (field === "thirst") {
        guest.thirst = next;
        return;
    }
    if (field === "toilet") {
        guest.toilet = next;
        return;
    }
    if (field === "nausea") {
        guest.nausea = next;
        return;
    }
    if (field === "nauseaTarget") {
        guest.nauseaTarget = next;
        return;
    }
    if (field === "energy") {
        guest.energy = next;
        return;
    }
    guest.energyTarget = next;
}

export class GuestNeedStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    field: GuestNeedField;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: GuestNeedStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.field = obj.field;
        this.value = obj.value;
        this.valueOrigin = obj.valueOrigin;
        this.valueVariableId = obj.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveNumberSource(
            this.value,
            this.valueOrigin,
            this.valueVariableId,
            "int",
            "Guest Need",
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Guest Need");
        for (let i = 0; i < guests.length; i++) {
            writeNeed(guests[i], this.field, value);
        }
    }

    getDataToPersist(): object {
        const source = persistNumberSource(
            this.value,
            this.valueOrigin === "variable" ? "variable" : "hardcoded",
            this.valueVariableId || ""
        );
        return {
            type: "guestNeed",
            field: this.field,
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {}),
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class GuestClothesStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    tshirtColour?: number;
    tshirtColourOrigin?: NumberSourceOrigin;
    tshirtColourVariableId?: string;
    trousersColour?: number;
    trousersColourOrigin?: NumberSourceOrigin;
    trousersColourVariableId?: string;
    hatColour?: number;
    hatColourOrigin?: NumberSourceOrigin;
    hatColourVariableId?: string;
    balloonColour?: number;
    balloonColourOrigin?: NumberSourceOrigin;
    balloonColourVariableId?: string;
    umbrellaColour?: number;
    umbrellaColourOrigin?: NumberSourceOrigin;
    umbrellaColourVariableId?: string;

    constructor(obj: GuestClothesStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.tshirtColour = obj.tshirtColour;
        this.tshirtColourOrigin = obj.tshirtColourOrigin;
        this.tshirtColourVariableId = obj.tshirtColourVariableId;
        this.trousersColour = obj.trousersColour;
        this.trousersColourOrigin = obj.trousersColourOrigin;
        this.trousersColourVariableId = obj.trousersColourVariableId;
        this.hatColour = obj.hatColour;
        this.hatColourOrigin = obj.hatColourOrigin;
        this.hatColourVariableId = obj.hatColourVariableId;
        this.balloonColour = obj.balloonColour;
        this.balloonColourOrigin = obj.balloonColourOrigin;
        this.balloonColourVariableId = obj.balloonColourVariableId;
        this.umbrellaColour = obj.umbrellaColour;
        this.umbrellaColourOrigin = obj.umbrellaColourOrigin;
        this.umbrellaColourVariableId = obj.umbrellaColourVariableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const tshirtColour = resolveOptionalInt(this.tshirtColour, this.tshirtColourOrigin, this.tshirtColourVariableId, "Guest Clothes T-Shirt", meta);
        const trousersColour = resolveOptionalInt(this.trousersColour, this.trousersColourOrigin, this.trousersColourVariableId, "Guest Clothes Trousers", meta);
        const hatColour = resolveOptionalInt(this.hatColour, this.hatColourOrigin, this.hatColourVariableId, "Guest Clothes Hat", meta);
        const balloonColour = resolveOptionalInt(this.balloonColour, this.balloonColourOrigin, this.balloonColourVariableId, "Guest Clothes Balloon", meta);
        const umbrellaColour = resolveOptionalInt(this.umbrellaColour, this.umbrellaColourOrigin, this.umbrellaColourVariableId, "Guest Clothes Umbrella", meta);
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Guest Clothes");
        for (let i = 0; i < guests.length; i++) {
            const guest = guests[i];
            if (tshirtColour !== undefined) {
                guest.tshirtColour = tshirtColour;
            }
            if (trousersColour !== undefined) {
                guest.trousersColour = trousersColour;
            }
            if (hatColour !== undefined) {
                guest.hatColour = hatColour;
            }
            if (balloonColour !== undefined) {
                guest.balloonColour = balloonColour;
            }
            if (umbrellaColour !== undefined) {
                guest.umbrellaColour = umbrellaColour;
            }
        }
    }

    getDataToPersist(): object {
        const data: GuestClothesStepDesc = {
            type: "guestClothes",
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
        persistOptionalNumber(data, "tshirtColour", this.tshirtColour, this.tshirtColourOrigin, this.tshirtColourVariableId);
        persistOptionalNumber(data, "trousersColour", this.trousersColour, this.trousersColourOrigin, this.trousersColourVariableId);
        persistOptionalNumber(data, "hatColour", this.hatColour, this.hatColourOrigin, this.hatColourVariableId);
        persistOptionalNumber(data, "balloonColour", this.balloonColour, this.balloonColourOrigin, this.balloonColourVariableId);
        persistOptionalNumber(data, "umbrellaColour", this.umbrellaColour, this.umbrellaColourOrigin, this.umbrellaColourVariableId);
        return data;
    }
}

function resolveOptionalInt(
    hardcoded: number | undefined,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined,
    label: string,
    meta: {animationId?: string; triggerId?: string}
): number | undefined {
    if (hardcoded === undefined && origin !== "variable") {
        return undefined;
    }
    const value = resolveNumberSource(hardcoded || 0, origin, variableId, "int", label, meta);
    return value === null ? undefined : value;
}

function persistOptionalNumber(
    data: GuestClothesStepDesc,
    field: "tshirtColour" | "trousersColour" | "hatColour" | "balloonColour" | "umbrellaColour",
    hardcoded: number | undefined,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): void {
    if (hardcoded === undefined && origin !== "variable") {
        return;
    }
    const source = persistNumberSource(hardcoded || 0, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    data[field] = source.value;
    if (source.origin === "variable") {
        data[`${field}Origin`] = "variable";
        data[`${field}VariableId`] = source.variableId || "";
    }
}

export class GuestFavouriteRideStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    rideId?: number;

    constructor(obj: GuestFavouriteRideStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.rideId = obj.rideId;
    }

    protected apply(run: StepRunContext): void {
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Favourite Ride");
        for (let i = 0; i < guests.length; i++) {
            guests[i].favouriteRide = typeof this.rideId === "number" ? this.rideId : null;
        }
    }

    getDataToPersist(): object {
        const data: GuestFavouriteRideStepDesc = {
            type: "guestFavouriteRide",
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
        if (typeof this.rideId === "number") {
            data.rideId = this.rideId;
        }
        return data;
    }
}

export class GuestItemStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    item: GuestItemType;

    constructor(obj: GuestItemStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.item = obj.item;
    }

    protected apply(run: StepRunContext): void {
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, this.type);
        for (let i = 0; i < guests.length; i++) {
            const item = {type: this.item} as GuestItem;
            if (this.type === "guestGiveItem") {
                guests[i].giveItem(item);
            } else {
                guests[i].removeItem(item);
            }
        }
    }

    getDataToPersist(): object {
        return {
            type: this.type,
            item: this.item,
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class GuestAnimationStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    animation: GuestAnimation;

    constructor(obj: GuestAnimationStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.animation = obj.animation;
    }

    protected apply(run: StepRunContext): void {
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Guest Animation");
        for (let i = 0; i < guests.length; i++) {
            guests[i].animation = this.animation;
        }
    }

    getDataToPersist(): object {
        return {
            type: "guestAnimation",
            animation: this.animation,
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class GuestFlagStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    flag: PeepFlags;
    mode: OnOffToggle;

    constructor(obj: GuestFlagStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.flag = obj.flag;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Guest Flag");
        for (let i = 0; i < guests.length; i++) {
            const guest = guests[i];
            guest.setFlag(this.flag, applyOnOffToggle(guest.getFlag(this.flag), this.mode));
        }
    }

    getDataToPersist(): object {
        return {
            type: "guestFlag",
            flag: this.flag,
            mode: this.mode,
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class GuestMoveStep extends InstantStep {
    useTriggerGuest?: boolean;
    guestId?: number;
    coordsOrigin: ReturnType<typeof readCoordsSourceOrigin>;
    x: number;
    y: number;
    z: number;
    coordsVariableId: string;

    constructor(obj: GuestMoveStepDesc) {
        super(obj);
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
        this.coordsOrigin = readCoordsSourceOrigin(obj);
        this.x = typeof obj.x === "number" ? obj.x : 0;
        this.y = typeof obj.y === "number" ? obj.y : 0;
        this.z = typeof obj.z === "number" ? obj.z : 0;
        this.coordsVariableId = typeof obj.coordsVariableId === "string" ? obj.coordsVariableId : "";
    }

    protected apply(run: StepRunContext): void {
        const coords = resolveCoordsSource(this, "Guest Move", logMetaFromRun(run));
        if (!coords) {
            return;
        }
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Guest Move");
        for (let i = 0; i < guests.length; i++) {
            guests[i].x = coords.x;
            guests[i].y = coords.y;
            guests[i].z = coords.z;
        }
    }

    getDataToPersist(): object {
        return {
            type: "guestMove",
            ...persistCoordsSource({
                origin: this.coordsOrigin,
                x: this.x,
                y: this.y,
                z: this.z,
                coordsVariableId: this.coordsVariableId
            }),
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}
