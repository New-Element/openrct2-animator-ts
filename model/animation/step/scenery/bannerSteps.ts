/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {
    BannerColoursStepDesc,
    BannerNoEntryStepDesc,
    BannerTextStepDesc,
    NumberSourceOrigin,
    OnOffToggle,
    StringSourceOrigin
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {persistStringSource, resolveStringSource} from "../stringSource";
import {applyOnOffToggle, logMetaFromRun, resolveStepMapTiles} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";

function isBannerCapable(element: TileElement): element is WallElement | LargeSceneryElement | BannerElement {
    return element.type === "wall" || element.type === "large_scenery" || element.type === "banner";
}

export class BannerTextStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    text: string;
    textOrigin?: StringSourceOrigin;
    textVariableId?: string;

    constructor(obj: BannerTextStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.text = typeof obj.text === "string" ? obj.text : "";
        this.textOrigin = obj.textOrigin;
        this.textVariableId = obj.textVariableId;
    }

    protected apply(run: StepRunContext): void {
        const text = resolveStringSource(
            this.text,
            this.textOrigin,
            this.textVariableId,
            "Banner Text",
            logMetaFromRun(run)
        );
        if (text === null) {
            return;
        }
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Banner Text");
        let count = 0;
        for (let t = 0; t < mapTiles.length; t++) {
            const mapTile = mapTiles[t];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (!isBannerCapable(element) || element.isGhost) {
                    continue;
                }
                element.bannerText = text;
                count += 1;
            }
        }
        if (count === 0) {
            error("step", "Banner Text: no banner on tile", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        const source = persistStringSource(
            this.text,
            this.textOrigin === "variable" ? "variable" : "hardcoded",
            this.textVariableId || ""
        );
        return {
            type: "bannerText",
            ...persistTileTargetFields(this.tileTarget),
            text: source.value,
            ...(source.origin === "variable" ? {textOrigin: "variable", textVariableId: source.variableId || ""} : {})
        };
    }
}

export class BannerColoursStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    primaryColour?: number;
    primaryColourOrigin?: NumberSourceOrigin;
    primaryColourVariableId?: string;
    secondaryColour?: number;
    secondaryColourOrigin?: NumberSourceOrigin;
    secondaryColourVariableId?: string;
    tertiaryColour?: number;
    tertiaryColourOrigin?: NumberSourceOrigin;
    tertiaryColourVariableId?: string;

    constructor(obj: BannerColoursStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.primaryColour = obj.primaryColour;
        this.primaryColourOrigin = obj.primaryColourOrigin;
        this.primaryColourVariableId = obj.primaryColourVariableId;
        this.secondaryColour = obj.secondaryColour;
        this.secondaryColourOrigin = obj.secondaryColourOrigin;
        this.secondaryColourVariableId = obj.secondaryColourVariableId;
        this.tertiaryColour = obj.tertiaryColour;
        this.tertiaryColourOrigin = obj.tertiaryColourOrigin;
        this.tertiaryColourVariableId = obj.tertiaryColourVariableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const primaryColour = resolveOptionalInt(this.primaryColour, this.primaryColourOrigin, this.primaryColourVariableId, "Banner Colours Primary", meta);
        const secondaryColour = resolveOptionalInt(this.secondaryColour, this.secondaryColourOrigin, this.secondaryColourVariableId, "Banner Colours Secondary", meta);
        const tertiaryColour = resolveOptionalInt(this.tertiaryColour, this.tertiaryColourOrigin, this.tertiaryColourVariableId, "Banner Colours Tertiary", meta);
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Banner Colours");
        let count = 0;
        for (let t = 0; t < mapTiles.length; t++) {
            const mapTile = mapTiles[t];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (!isBannerCapable(element) || element.isGhost) {
                    continue;
                }
                if (primaryColour !== undefined) {
                    element.primaryColour = primaryColour;
                }
                if (secondaryColour !== undefined) {
                    element.secondaryColour = secondaryColour;
                }
                if (tertiaryColour !== undefined && element.type !== "banner") {
                    (element as WallElement | LargeSceneryElement).tertiaryColour = tertiaryColour;
                }
                count += 1;
            }
        }
        if (count === 0) {
            error("step", "Banner Colours: no banner on tile", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        const data: BannerColoursStepDesc = {
            type: "bannerColours",
            ...persistTileTargetFields(this.tileTarget)
        };
        persistOptionalNumber(data, "primaryColour", this.primaryColour, this.primaryColourOrigin, this.primaryColourVariableId);
        persistOptionalNumber(data, "secondaryColour", this.secondaryColour, this.secondaryColourOrigin, this.secondaryColourVariableId);
        persistOptionalNumber(data, "tertiaryColour", this.tertiaryColour, this.tertiaryColourOrigin, this.tertiaryColourVariableId);
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
    data: BannerColoursStepDesc,
    field: "primaryColour" | "secondaryColour" | "tertiaryColour",
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

export class BannerNoEntryStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    mode: OnOffToggle;

    constructor(obj: BannerNoEntryStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Banner No Entry");
        let count = 0;
        for (let t = 0; t < mapTiles.length; t++) {
            const mapTile = mapTiles[t];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (element.type !== "banner" || element.isGhost) {
                    continue;
                }
                const banner = element as BannerElement;
                banner.isNoEntry = applyOnOffToggle(banner.isNoEntry, this.mode);
                count += 1;
            }
        }
        if (count === 0) {
            error("step", "Banner No Entry: no banner on tile", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        return {type: "bannerNoEntry", ...persistTileTargetFields(this.tileTarget), mode: this.mode};
    }
}
