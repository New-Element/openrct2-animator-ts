/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, compute, dropdown, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    NumberSourceOrigin,
    RideBreakdownStepDesc,
    RideMusicStepDesc,
    RideNumberStepDesc,
    RideStationStartSource,
    RideStationStartStepDesc,
    RideStatusStepDesc,
    RideTrackColoursStepDesc,
    RideVehicleColoursStepDesc
} from "../../../../model/animation/jsonTypes";
import {listMusicObjects, MusicObjectOption} from "../../../../model/animation/step/ride/musicObjects";
import {
    BREAKDOWN_TYPES,
    indexOfValue,
    labelsForValues,
    RIDE_STATUSES
} from "../../../triggers/conditions/labels";
import {goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickTile} from "../../../ui/pickTile";
import {createColourSourceFields} from "./colourSourceFields";
import {createNumberSourceFields} from "./numberSourceFields";

const NO_MUSIC_LABEL = "(No Music)";

const STATION_START_SOURCES: RideStationStartSource[] = ["train", "car", "guest", "staff", "tile"];
const STATION_START_LABELS = ["Trigger Train", "Trigger Car", "Trigger Guest", "Trigger Staff", "Fixed Tile"];

type MusicChoice = {
    identifier: string;
    index: number | null;
    label: string;
};

const STATUS_LABELS = labelsForValues(RIDE_STATUSES);
const BREAKDOWN_LABELS = labelsForValues(BREAKDOWN_TYPES);

export function createRideExtraFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const statusVisibility = store<"visible" | "none">("none");
    const vehicleColourVisibility = store<"visible" | "none">("none");
    const trackColourVisibility = store<"visible" | "none">("none");
    const numberVisibility = store<"visible" | "none">("none");
    const musicVisibility = store<"visible" | "none">("none");
    const stationStartVisibility = store<"visible" | "none">("none");
    const breakdownVisibility = store<"visible" | "none">("none");
    const stationStartIndex = store<number>(0);
    const stationTileX = store<number>(0);
    const stationTileY = store<number>(0);
    const stationTileVisibility = compute(stationStartVisibility, stationStartIndex, (shown, index) => {
        return shown === "visible" && STATION_START_SOURCES[index] === "tile" ? "visible" : "none";
    });
    const musicItems = store<string[]>([NO_MUSIC_LABEL]);
    const musicIndex = store<number>(0);
    const playMusic = store<boolean>(true);
    let musicChoices: MusicChoice[] = [];
    let heldMusicIdentifier: string | undefined;
    let heldMusicValue: number | undefined;

    const statusIndex = store<number>(0);
    const breakdownIndex = store<number>(0);
    const colourIndexFields = createNumberSourceFields({
        valueType: "int",
        label: "Index",
        minimum: 0,
        maximum: 255,
        onPersist: onPersist,
        visibility: vehicleColourVisibility
    });
    const bodyFields = createColourSourceFields({
        label: "Body",
        onPersist: onPersist,
        visibility: vehicleColourVisibility
    });
    const trimFields = createColourSourceFields({
        label: "Trim",
        onPersist: onPersist,
        visibility: vehicleColourVisibility
    });
    const tertiaryFields = createColourSourceFields({
        label: "Tertiary",
        onPersist: onPersist,
        visibility: vehicleColourVisibility
    });
    const schemeIndexFields = createNumberSourceFields({
        valueType: "int",
        label: "Scheme",
        minimum: 0,
        maximum: 3,
        onPersist: onPersist,
        visibility: trackColourVisibility
    });
    const mainFields = createColourSourceFields({
        label: "Main",
        onPersist: onPersist,
        visibility: trackColourVisibility
    });
    const additionalFields = createColourSourceFields({
        label: "Additional",
        onPersist: onPersist,
        visibility: trackColourVisibility
    });
    const supportsFields = createColourSourceFields({
        label: "Supports",
        onPersist: onPersist,
        visibility: trackColourVisibility
    });
    const valueFields = createNumberSourceFields({
        valueType: "int",
        label: "Value",
        minimum: 0,
        maximum: 100000,
        onPersist: onPersist,
        visibility: numberVisibility
    });

    function applyNamed(
        data: {
            colourIndex?: number;
            colourIndexOrigin?: NumberSourceOrigin;
            colourIndexVariableId?: string;
            schemeIndex?: number;
            schemeIndexOrigin?: NumberSourceOrigin;
            schemeIndexVariableId?: string;
            main?: number;
            mainOrigin?: NumberSourceOrigin;
            mainVariableId?: string;
            additional?: number;
            additionalOrigin?: NumberSourceOrigin;
            additionalVariableId?: string;
            supports?: number;
            supportsOrigin?: NumberSourceOrigin;
            supportsVariableId?: string;
        },
        field: "colourIndex" | "schemeIndex" | "main" | "additional" | "supports",
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        data[field] = source.value;
        if (source.origin === "variable") {
            data[`${field}Origin`] = "variable";
            data[`${field}VariableId`] = source.variableId || "";
        }
    }

    function applyColourOrigin(
        data: {
            bodyOrigin?: NumberSourceOrigin;
            bodyVariableId?: string;
            trimOrigin?: NumberSourceOrigin;
            trimVariableId?: string;
            tertiaryOrigin?: NumberSourceOrigin;
            tertiaryVariableId?: string;
        },
        field: "body" | "trim" | "tertiary",
        source: {origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        if (source.origin === "variable") {
            data[`${field}Origin`] = "variable";
            data[`${field}VariableId`] = source.variableId || "";
        }
    }

    function hide(): void {
        visibility.set("none");
        statusVisibility.set("none");
        vehicleColourVisibility.set("none");
        trackColourVisibility.set("none");
        numberVisibility.set("none");
        musicVisibility.set("none");
        stationStartVisibility.set("none");
        breakdownVisibility.set("none");
    }

    function showOnly(which: "status" | "vehicle" | "track" | "number" | "breakdown" | "music" | "stationStart"): void {
        visibility.set("visible");
        statusVisibility.set(which === "status" ? "visible" : "none");
        vehicleColourVisibility.set(which === "vehicle" ? "visible" : "none");
        trackColourVisibility.set(which === "track" ? "visible" : "none");
        numberVisibility.set(which === "number" ? "visible" : "none");
        musicVisibility.set(which === "music" ? "visible" : "none");
        stationStartVisibility.set(which === "stationStart" ? "visible" : "none");
        breakdownVisibility.set(which === "breakdown" ? "visible" : "none");
    }

    function musicChoicesFromLoaded(loaded: MusicObjectOption[]): MusicChoice[] {
        const choices: MusicChoice[] = [];
        for (let i = 0; i < loaded.length; i++) {
            choices.push({
                identifier: loaded[i].identifier,
                index: loaded[i].index,
                label: loaded[i].name
            });
        }
        if (heldMusicIdentifier) {
            let found = false;
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].identifier === heldMusicIdentifier) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                choices.unshift({
                    identifier: heldMusicIdentifier,
                    index: null,
                    label: heldMusicIdentifier
                });
            }
        }
        return choices;
    }

    function refreshMusicChoices(): void {
        musicChoices = musicChoicesFromLoaded(listMusicObjects());
        if (musicChoices.length === 0) {
            musicItems.set([NO_MUSIC_LABEL]);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < musicChoices.length; i++) {
            labels.push(musicChoices[i].label);
        }
        musicItems.set(labels);
    }

    function musicChoiceIndex(): number {
        if (heldMusicIdentifier) {
            for (let i = 0; i < musicChoices.length; i++) {
                if (musicChoices[i].identifier === heldMusicIdentifier) {
                    return i;
                }
            }
        }
        if (typeof heldMusicValue === "number") {
            for (let i = 0; i < musicChoices.length; i++) {
                if (musicChoices[i].index === heldMusicValue) {
                    return i;
                }
            }
        }
        return 0;
    }

    function loadStatus(desc: RideStatusStepDesc): void {
        showOnly("status");
        statusIndex.set(indexOfValue(RIDE_STATUSES, desc.status));
    }

    function loadVehicleColours(desc: RideVehicleColoursStepDesc): void {
        showOnly("vehicle");
        colourIndexFields.load(desc.colourIndex, desc.colourIndexOrigin, desc.colourIndexVariableId);
        bodyFields.load(desc.value.body, desc.bodyOrigin, desc.bodyVariableId);
        trimFields.load(desc.value.trim, desc.trimOrigin, desc.trimVariableId);
        tertiaryFields.load(desc.value.tertiary, desc.tertiaryOrigin, desc.tertiaryVariableId);
    }

    function loadTrackColours(desc: RideTrackColoursStepDesc): void {
        showOnly("track");
        schemeIndexFields.load(desc.schemeIndex, desc.schemeIndexOrigin, desc.schemeIndexVariableId);
        mainFields.load(desc.main, desc.mainOrigin, desc.mainVariableId);
        additionalFields.load(desc.additional, desc.additionalOrigin, desc.additionalVariableId);
        supportsFields.load(desc.supports, desc.supportsOrigin, desc.supportsVariableId);
    }

    function loadNumber(desc: RideNumberStepDesc): void {
        showOnly("number");
        valueFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
    }

    function loadMusic(desc: RideMusicStepDesc): void {
        showOnly("music");
        heldMusicIdentifier = desc.musicObjectIdentifier;
        heldMusicValue = typeof desc.value === "number" ? desc.value : undefined;
        refreshMusicChoices();
        musicIndex.set(musicChoiceIndex());
        playMusic.set(desc.playMusic !== false);
    }

    function loadStationStart(desc: RideStationStartStepDesc): void {
        showOnly("stationStart");
        let index = 0;
        for (let i = 0; i < STATION_START_SOURCES.length; i++) {
            if (STATION_START_SOURCES[i] === desc.source) {
                index = i;
                break;
            }
        }
        stationStartIndex.set(index);
        stationTileX.set(desc.tile && typeof desc.tile.x === "number" ? desc.tile.x : 0);
        stationTileY.set(desc.tile && typeof desc.tile.y === "number" ? desc.tile.y : 0);
    }

    function loadBreakdown(desc: RideBreakdownStepDesc): void {
        showOnly("breakdown");
        breakdownIndex.set(indexOfValue(BREAKDOWN_TYPES, desc.breakdownType));
    }

    function readStatus(): RideStatus {
        return RIDE_STATUSES[statusIndex.get()] || "closed";
    }

    function readVehicleColours(): Omit<RideVehicleColoursStepDesc, "type" | "useTriggerRide" | "rideId"> {
        const colourIndex = colourIndexFields.read();
        const body = bodyFields.read();
        const trim = trimFields.read();
        const tertiary = tertiaryFields.read();
        const data: Omit<RideVehicleColoursStepDesc, "type" | "useTriggerRide" | "rideId"> = {
            colourIndex: colourIndex.value,
            value: {body: body.value, trim: trim.value, tertiary: tertiary.value}
        };
        applyNamed(data, "colourIndex", colourIndex);
        applyColourOrigin(data, "body", body);
        applyColourOrigin(data, "trim", trim);
        applyColourOrigin(data, "tertiary", tertiary);
        return data;
    }

    function readTrackColours(): Omit<RideTrackColoursStepDesc, "type" | "useTriggerRide" | "rideId"> {
        const data: Omit<RideTrackColoursStepDesc, "type" | "useTriggerRide" | "rideId"> = {
            schemeIndex: 0,
            main: 0,
            additional: 0,
            supports: 0
        };
        applyNamed(data, "schemeIndex", schemeIndexFields.read());
        applyNamed(data, "main", mainFields.read());
        applyNamed(data, "additional", additionalFields.read());
        applyNamed(data, "supports", supportsFields.read());
        return data;
    }

    function readValue() {
        return valueFields.read();
    }

    function readStationStart(): {source: RideStationStartSource; tile: {x: number; y: number}} {
        return {
            source: STATION_START_SOURCES[stationStartIndex.get()] || "train",
            tile: {x: stationTileX.get(), y: stationTileY.get()}
        };
    }

    function readMusic(): {musicObjectIdentifier?: string; value?: number; playMusic: boolean} {
        const play = playMusic.get();
        const choice = musicChoices[musicIndex.get()];
        if (choice) {
            return {musicObjectIdentifier: choice.identifier, playMusic: play};
        }
        if (heldMusicIdentifier) {
            return {musicObjectIdentifier: heldMusicIdentifier, playMusic: play};
        }
        if (typeof heldMusicValue === "number") {
            return {value: heldMusicValue, playMusic: play};
        }
        return {playMusic: play};
    }

    function readBreakdown(): BreakdownType {
        return BREAKDOWN_TYPES[breakdownIndex.get()] || BREAKDOWN_TYPES[0];
    }

    const widgets = [
        groupbox({
            text: "Ride Settings",
            visibility,
            content: [
                horizontal([
                    label({text: "Status", width: 70, visibility: statusVisibility}),
                    dropdown({
                        items: STATUS_LABELS,
                        selectedIndex: twoway(statusIndex),
                        visibility: statusVisibility,
                        onChange: (index) => {
                            statusIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...colourIndexFields.widgets,
                ...bodyFields.widgets,
                ...trimFields.widgets,
                ...tertiaryFields.widgets,
                ...schemeIndexFields.widgets,
                ...mainFields.widgets,
                ...additionalFields.widgets,
                ...supportsFields.widgets,
                ...valueFields.widgets,
                horizontal([
                    label({text: "Music", width: 70, visibility: musicVisibility}),
                    dropdown({
                        items: musicItems,
                        selectedIndex: twoway(musicIndex),
                        visibility: musicVisibility,
                        onChange: (index) => {
                            musicIndex.set(index);
                            const choice = musicChoices[index];
                            heldMusicIdentifier = choice ? choice.identifier : undefined;
                            heldMusicValue = undefined;
                            onPersist();
                        }
                    })
                ]),
                checkbox({
                    text: "Play Music",
                    isChecked: twoway(playMusic),
                    visibility: musicVisibility,
                    onChange: (checked) => {
                        playMusic.set(checked);
                        onPersist();
                    }
                }),
                horizontal([
                    label({text: "Location", width: 70, visibility: stationStartVisibility}),
                    dropdown({
                        items: STATION_START_LABELS,
                        selectedIndex: twoway(stationStartIndex),
                        visibility: stationStartVisibility,
                        onChange: (index) => {
                            stationStartIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "X", width: 55, visibility: stationTileVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(stationTileX),
                        minimum: 0,
                        maximum: 10000,
                        visibility: stationTileVisibility,
                        onChange: (value) => {
                            stationTileX.set(value);
                            onPersist();
                        }
                    }),
                    label({text: "Y", width: 55, visibility: stationTileVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(stationTileY),
                        minimum: 0,
                        maximum: 10000,
                        visibility: stationTileVisibility,
                        onChange: (value) => {
                            stationTileY.set(value);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Tile",
                        visibility: stationTileVisibility,
                        onClick: () => {
                            pickTile((tile) => {
                                stationTileX.set(tile.x);
                                stationTileY.set(tile.y);
                                onPersist();
                            });
                        }
                    }),
                    goToTileButton({
                        visibility: stationTileVisibility,
                        getTile: () => ({x: stationTileX.get(), y: stationTileY.get()})
                    })
                ]),
                horizontal([
                    label({text: "Type", width: 70, visibility: breakdownVisibility}),
                    dropdown({
                        items: BREAKDOWN_LABELS,
                        selectedIndex: twoway(breakdownIndex),
                        visibility: breakdownVisibility,
                        onChange: (index) => {
                            breakdownIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {
        hide,
        loadStatus,
        loadVehicleColours,
        loadTrackColours,
        loadNumber,
        loadMusic,
        loadStationStart,
        loadBreakdown,
        readStatus,
        readVehicleColours,
        readTrackColours,
        readValue,
        readMusic,
        readStationStart,
        readBreakdown,
        widgets
    };
}

export type RideExtraFields = ReturnType<typeof createRideExtraFields>;
