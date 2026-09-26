/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {findVariableById} from "../../variableLookup";
import {
    CameraMoveMode,
    CameraRotationOrigin,
    CameraTileOrigin,
    ClearAwardsStepDesc,
    FreezeWeatherStepDesc,
    GamePauseStepDesc,
    GameSpeedStepDesc,
    GrantAwardStepDesc,
    OnOffToggle,
    NumberSourceOrigin,
    ParkCashStepDesc,
    ParkDateStepDesc,
    ParkMessageStepDesc,
    ParkRatingStepDesc,
    PauseMode,
    SpawnGuestStepDesc,
    StringSourceOrigin,
    ViewportCameraStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {persistStringSource, resolveStringSource} from "../stringSource";
import {applyOnOffToggle, logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

export class SpawnGuestStep extends InstantStep {
    constructor(obj: SpawnGuestStepDesc) {
        super(obj);
    }

    protected apply(run: StepRunContext): void {
        const guest = park.generateGuest();
        if (!guest) {
            error("step", "Spawn Guest: could not spawn", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        return {type: "spawnGuest"};
    }
}

export class ParkMessageStep extends InstantStep {
    text: string;
    textOrigin?: StringSourceOrigin;
    textVariableId?: string;
    messageType: ParkMessageType;
    subject?: number;

    constructor(obj: ParkMessageStepDesc) {
        super(obj);
        this.text = typeof obj.text === "string" ? obj.text : "";
        this.textOrigin = obj.textOrigin;
        this.textVariableId = obj.textVariableId;
        this.messageType = obj.messageType;
        this.subject = obj.subject;
    }

    protected apply(run: StepRunContext): void {
        const text = resolveStringSource(
            this.text,
            this.textOrigin,
            this.textVariableId,
            "Park Message",
            logMetaFromRun(run)
        );
        if (text === null) {
            return;
        }
        const message: ParkMessageDesc = {
            type: this.messageType,
            text: text
        };
        if (typeof this.subject === "number") {
            message.subject = this.subject;
        }
        park.postMessage(message);
    }

    getDataToPersist(): object {
        const source = persistStringSource(
            this.text,
            this.textOrigin === "variable" ? "variable" : "hardcoded",
            this.textVariableId || ""
        );
        const data: ParkMessageStepDesc = {
            type: "parkMessage",
            text: source.value,
            ...(source.origin === "variable" ? {textOrigin: "variable" as const, textVariableId: source.variableId || ""} : {}),
            messageType: this.messageType
        };
        if (typeof this.subject === "number") {
            data.subject = this.subject;
        }
        return data;
    }
}

export class FreezeWeatherStep extends InstantStep {
    mode: OnOffToggle;

    constructor(obj: FreezeWeatherStepDesc) {
        super(obj);
        this.mode = obj.mode;
    }

    protected apply(_run: StepRunContext): void {
        cheats.freezeWeather = applyOnOffToggle(cheats.freezeWeather, this.mode);
    }

    getDataToPersist(): object {
        return {type: "freezeWeather", mode: this.mode};
    }
}

export class ParkCashStep extends InstantStep {
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: ParkCashStepDesc) {
        super(obj);
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
            "Park Cash",
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        park.cash = value;
    }

    getDataToPersist(): object {
        return {type: "parkCash", ...persistNamedNumber("value", this.value, this.valueOrigin, this.valueVariableId)};
    }
}

export class ParkRatingStep extends InstantStep {
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: ParkRatingStepDesc) {
        super(obj);
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
            "Park Rating",
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        park.rating = value;
    }

    getDataToPersist(): object {
        return {type: "parkRating", ...persistNamedNumber("value", this.value, this.valueOrigin, this.valueVariableId)};
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

export class GrantAwardStep extends InstantStep {
    award: AwardType;

    constructor(obj: GrantAwardStepDesc) {
        super(obj);
        this.award = obj.award;
    }

    protected apply(_run: StepRunContext): void {
        park.grantAward(this.award);
    }

    getDataToPersist(): object {
        return {type: "grantAward", award: this.award};
    }
}

export class ClearAwardsStep extends InstantStep {
    constructor(obj: ClearAwardsStepDesc) {
        super(obj);
    }

    protected apply(_run: StepRunContext): void {
        park.clearAwards();
    }

    getDataToPersist(): object {
        return {type: "clearAwards"};
    }
}

export class GamePauseStep extends InstantStep {
    mode: PauseMode;

    constructor(obj: GamePauseStepDesc) {
        super(obj);
        this.mode = obj.mode;
    }

    protected apply(_run: StepRunContext): void {
        if (this.mode === "pause") {
            context.paused = true;
            return;
        }
        if (this.mode === "unpause") {
            context.paused = false;
            return;
        }
        context.paused = !context.paused;
    }

    getDataToPersist(): object {
        return {type: "gamePause", mode: this.mode};
    }
}

export class GameSpeedStep extends InstantStep {
    speed: number;
    speedOrigin?: NumberSourceOrigin;
    speedVariableId?: string;

    constructor(obj: GameSpeedStepDesc) {
        super(obj);
        this.speed = typeof obj.speed === "number" ? obj.speed : 0;
        this.speedOrigin = obj.speedOrigin;
        this.speedVariableId = obj.speedVariableId;
    }

    protected apply(run: StepRunContext): void {
        const resolved = resolveNumberSource(
            this.speed,
            this.speedOrigin,
            this.speedVariableId,
            "int",
            "Game Speed",
            logMetaFromRun(run)
        );
        if (resolved === null) {
            return;
        }
        let speed = resolved;
        if (speed < 0) {
            speed = 0;
        }
        if (speed > 4) {
            speed = 4;
        }
        context.executeAction("gamesetspeed", {speed: speed});
    }

    getDataToPersist(): object {
        return {type: "gameSpeed", ...persistNamedNumber("speed", this.speed, this.speedOrigin, this.speedVariableId)};
    }
}

export class ParkDateStep extends InstantStep {
    year: number;
    yearOrigin?: NumberSourceOrigin;
    yearVariableId?: string;
    month: number;

    constructor(obj: ParkDateStepDesc) {
        super(obj);
        this.year = typeof obj.year === "number" ? obj.year : 1;
        this.yearOrigin = obj.yearOrigin;
        this.yearVariableId = obj.yearVariableId;
        this.month = obj.month;
    }

    protected apply(run: StepRunContext): void {
        const resolved = resolveNumberSource(
            this.year,
            this.yearOrigin,
            this.yearVariableId,
            "int",
            "Park Date Year",
            logMetaFromRun(run)
        );
        if (resolved === null) {
            return;
        }
        const year = resolved < 1 ? 1 : resolved;
        let month = this.month;
        if (month < 0) {
            month = 0;
        }
        if (month > 7) {
            month = 7;
        }
        date.monthsElapsed = (year - 1) * 8 + month;
    }

    getDataToPersist(): object {
        return {
            type: "parkDate",
            ...persistNamedNumber("year", this.year, this.yearOrigin, this.yearVariableId),
            month: this.month
        };
    }
}

export class ViewportCameraStep extends InstantStep {
    x: number;
    y: number;
    z?: number;
    zOrigin?: NumberSourceOrigin;
    zVariableId?: string;
    zoom?: number;
    zoomOrigin?: NumberSourceOrigin;
    zoomVariableId?: string;
    rotation?: number;
    mode: CameraMoveMode;
    tileOrigin: CameraTileOrigin;
    tileVariableId: string;
    rotationOrigin: CameraRotationOrigin;
    rotationVariableId: string;

    constructor(obj: ViewportCameraStepDesc) {
        super(obj);
        this.x = obj.x;
        this.y = obj.y;
        this.z = obj.z;
        this.zOrigin = obj.zOrigin;
        this.zVariableId = obj.zVariableId;
        this.zoom = obj.zoom;
        this.zoomOrigin = obj.zoomOrigin;
        this.zoomVariableId = obj.zoomVariableId;
        this.rotation = obj.rotation;
        this.mode = obj.mode;
        this.tileOrigin = obj.tileOrigin === "variable" ? "variable" : "hardcoded";
        this.tileVariableId = typeof obj.tileVariableId === "string" ? obj.tileVariableId : "";
        if (obj.rotationOrigin === "variable" || obj.rotationOrigin === "hardcoded" || obj.rotationOrigin === "unset") {
            this.rotationOrigin = obj.rotationOrigin;
        } else {
            this.rotationOrigin = obj.rotation !== undefined ? "hardcoded" : "unset";
        }
        this.rotationVariableId = typeof obj.rotationVariableId === "string" ? obj.rotationVariableId : "";
    }

    protected apply(run: StepRunContext): void {
        if (typeof ui === "undefined") {
            return;
        }
        const meta = logMetaFromRun(run);
        let tileX = this.x;
        let tileY = this.y;
        if (this.tileOrigin === "variable") {
            const variable = findVariableById(this.tileVariableId);
            if (!variable || variable.valueType !== "tile" || !variable.value || typeof variable.value !== "object") {
                error("step", "Viewport Camera: tile variable is missing", undefined, meta);
                return;
            }
            const tile = variable.value as {x: number; y: number};
            tileX = tile.x;
            tileY = tile.y;
        }
        const viewport = ui.mainViewport;
        const zoom = resolveOptionalCameraNumber(this.zoom, this.zoomOrigin, this.zoomVariableId, "Viewport Camera Zoom", meta);
        if (zoom !== undefined) {
            viewport.zoom = zoom;
        }
        if (this.rotationOrigin === "variable") {
            const variable = findVariableById(this.rotationVariableId);
            if (!variable || variable.valueType !== "direction" || typeof variable.value !== "number") {
                error("step", "Viewport Camera: direction variable is missing", undefined, meta);
            } else {
                viewport.rotation = variable.value;
            }
        } else if (this.rotationOrigin === "hardcoded" && this.rotation !== undefined) {
            viewport.rotation = this.rotation;
        }
        const z = resolveOptionalCameraNumber(this.z, this.zOrigin, this.zVariableId, "Viewport Camera Z", meta);
        const position: CoordsXYZ = {
            x: tileX * 32,
            y: tileY * 32,
            z: z !== undefined ? z : 0
        };
        if (this.mode === "scroll") {
            viewport.scrollTo(position);
            return;
        }
        viewport.moveTo(position);
    }

    getDataToPersist(): object {
        const data: ViewportCameraStepDesc = {
            type: "viewportCamera",
            x: this.x,
            y: this.y,
            mode: this.mode
        };
        if (this.tileOrigin === "variable") {
            data.tileOrigin = "variable";
            data.tileVariableId = this.tileVariableId;
        }
        if (this.z !== undefined || this.zOrigin === "variable") {
            const source = persistNumberSource(this.z || 0, this.zOrigin === "variable" ? "variable" : "hardcoded", this.zVariableId || "");
            data.z = source.value;
            if (source.origin === "variable") {
                data.zOrigin = "variable";
                data.zVariableId = source.variableId || "";
            }
        }
        if (this.zoom !== undefined || this.zoomOrigin === "variable") {
            const source = persistNumberSource(this.zoom || 0, this.zoomOrigin === "variable" ? "variable" : "hardcoded", this.zoomVariableId || "");
            data.zoom = source.value;
            if (source.origin === "variable") {
                data.zoomOrigin = "variable";
                data.zoomVariableId = source.variableId || "";
            }
        }
        if (this.rotationOrigin === "variable") {
            data.rotationOrigin = "variable";
            data.rotationVariableId = this.rotationVariableId;
        } else if (this.rotationOrigin === "hardcoded" && this.rotation !== undefined) {
            data.rotationOrigin = "hardcoded";
            data.rotation = this.rotation;
        }
        return data;
    }
}

function resolveOptionalCameraNumber(
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
