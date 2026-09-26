/// <reference path="./../../../../openrct2.d.ts" />

import {
    button,
    checkbox,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    spinner,
    store,
    twoway
} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    FreezeWeatherStepDesc,
    GamePauseStepDesc,
    GameSpeedStepDesc,
    GrantAwardStepDesc,
    ParkCashStepDesc,
    ParkDateStepDesc,
    ParkMessageStepDesc,
    ParkRatingStepDesc,
    ViewportCameraStepDesc
} from "../../../../model/animation/jsonTypes";
import {goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickTile} from "../../../ui/pickTile";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";
import {createNumberSourceFields} from "./numberSourceFields";
import {createStringSourceFields} from "./stringSourceFields";
import {
    AWARD_TYPES,
    CAMERA_MODE_LABELS,
    CAMERA_MODES,
    indexOfValue,
    labelsForValues,
    MONTH_LABELS,
    ON_OFF_TOGGLE,
    ON_OFF_TOGGLE_LABELS,
    PARK_MESSAGE_TYPES,
    PAUSE_MODE_LABELS,
    PAUSE_MODES
} from "../../../triggers/conditions/labels";

const MESSAGE_LABELS = labelsForValues(PARK_MESSAGE_TYPES);
const AWARD_LABELS = labelsForValues(AWARD_TYPES);

export function createParkStepFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const messageVisibility = store<"visible" | "none">("none");
    const freezeVisibility = store<"visible" | "none">("none");
    const cashVisibility = store<"visible" | "none">("none");
    const ratingVisibility = store<"visible" | "none">("none");
    const awardVisibility = store<"visible" | "none">("none");
    const pauseVisibility = store<"visible" | "none">("none");
    const speedVisibility = store<"visible" | "none">("none");
    const dateVisibility = store<"visible" | "none">("none");
    const cameraVisibility = store<"visible" | "none">("none");

    const messageTypeIndex = store<number>(0);
    const setSubject = store<boolean>(false);
    const subject = store<number>(0);
    const freezeIndex = store<number>(0);
    const awardIndex = store<number>(0);
    const pauseIndex = store<number>(0);
    const monthIndex = store<number>(0);
    const tileX = store<number>(0);
    const tileY = store<number>(0);
    const setZ = store<boolean>(false);
    const setZoom = store<boolean>(false);
    const setRotation = store<boolean>(false);
    const rotation = store<number>(0);
    const zValueVisibility = compute(cameraVisibility, setZ, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const zoomValueVisibility = compute(cameraVisibility, setZoom, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const messageTextFields = createStringSourceFields({
        label: "Text",
        onPersist: onPersist,
        visibility: messageVisibility
    });
    const cashFields = createNumberSourceFields({
        valueType: "int",
        label: "Cash",
        minimum: -100000000,
        maximum: 100000000,
        onPersist: onPersist,
        visibility: cashVisibility
    });
    const ratingFields = createNumberSourceFields({
        valueType: "int",
        label: "Rating",
        minimum: 0,
        maximum: 999,
        onPersist: onPersist,
        visibility: ratingVisibility
    });
    const speedFields = createNumberSourceFields({
        valueType: "int",
        label: "Speed",
        minimum: 0,
        maximum: 4,
        onPersist: onPersist,
        visibility: speedVisibility
    });
    const yearFields = createNumberSourceFields({
        valueType: "int",
        label: "Year",
        minimum: 1,
        maximum: 10000,
        onPersist: onPersist,
        visibility: dateVisibility
    });
    const zFields = createNumberSourceFields({
        valueType: "int",
        label: "Z",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: zValueVisibility
    });
    const zoomFields = createNumberSourceFields({
        valueType: "int",
        label: "Zoom",
        minimum: -10,
        maximum: 10,
        onPersist: onPersist,
        visibility: zoomValueVisibility
    });
    const cameraModeIndex = store<number>(0);
    const tileOriginIndex = store<number>(0);
    const rotationOriginIndex = store<number>(0);
    const cameraTileHardcodedVisibility = compute(cameraVisibility, tileOriginIndex, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const cameraTileVariableVisibility = compute(cameraVisibility, tileOriginIndex, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const cameraRotationHardcodedVisibility = compute(cameraVisibility, rotationOriginIndex, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const cameraRotationVariableVisibility = compute(cameraVisibility, rotationOriginIndex, (shown, index) => (
        shown === "visible" && index === 2 ? "visible" : "none" as const
    ));
    const cameraTilePicker = createTypedVariablePicker({
        valueType: "tile",
        emptyLabel: "(No Tile Variables)",
        missingLabel: "Tile Variable Missing",
        visibility: cameraTileVariableVisibility,
        onChange: () => onPersist()
    });
    const cameraDirectionPicker = createTypedVariablePicker({
        valueType: "direction",
        emptyLabel: "(No Direction Variables)",
        missingLabel: "Direction Variable Missing",
        visibility: cameraRotationVariableVisibility,
        onChange: () => onPersist()
    });

    function hide(): void {
        visibility.set("none");
        messageVisibility.set("none");
        freezeVisibility.set("none");
        cashVisibility.set("none");
        ratingVisibility.set("none");
        awardVisibility.set("none");
        pauseVisibility.set("none");
        speedVisibility.set("none");
        dateVisibility.set("none");
        cameraVisibility.set("none");
    }

    function showOnly(which: string): void {
        hide();
        visibility.set("visible");
        if (which === "message") {
            messageVisibility.set("visible");
        } else if (which === "freeze") {
            freezeVisibility.set("visible");
        } else if (which === "cash") {
            cashVisibility.set("visible");
        } else if (which === "rating") {
            ratingVisibility.set("visible");
        } else if (which === "award") {
            awardVisibility.set("visible");
        } else if (which === "pause") {
            pauseVisibility.set("visible");
        } else if (which === "speed") {
            speedVisibility.set("visible");
        } else if (which === "date") {
            dateVisibility.set("visible");
        } else if (which === "camera") {
            cameraVisibility.set("visible");
        }
    }

    function loadMessage(desc: ParkMessageStepDesc): void {
        showOnly("message");
        messageTextFields.load(desc.text, desc.textOrigin, desc.textVariableId);
        messageTypeIndex.set(indexOfValue(PARK_MESSAGE_TYPES, desc.messageType));
        setSubject.set(typeof desc.subject === "number");
        subject.set(typeof desc.subject === "number" ? desc.subject : 0);
    }

    function loadFreeze(desc: FreezeWeatherStepDesc): void {
        showOnly("freeze");
        freezeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
    }

    function loadCash(desc: ParkCashStepDesc): void {
        showOnly("cash");
        cashFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
    }

    function loadRating(desc: ParkRatingStepDesc): void {
        showOnly("rating");
        ratingFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
    }

    function loadAward(desc: GrantAwardStepDesc): void {
        showOnly("award");
        awardIndex.set(indexOfValue(AWARD_TYPES, desc.award));
    }

    function loadPause(desc: GamePauseStepDesc): void {
        showOnly("pause");
        pauseIndex.set(indexOfValue(PAUSE_MODES, desc.mode));
    }

    function loadSpeed(desc: GameSpeedStepDesc): void {
        showOnly("speed");
        speedFields.load(desc.speed, desc.speedOrigin, desc.speedVariableId);
    }

    function loadDate(desc: ParkDateStepDesc): void {
        showOnly("date");
        yearFields.load(desc.year, desc.yearOrigin, desc.yearVariableId);
        monthIndex.set(desc.month);
    }

    function loadCamera(desc: ViewportCameraStepDesc): void {
        showOnly("camera");
        tileX.set(desc.x);
        tileY.set(desc.y);
        setZ.set(desc.z !== undefined || desc.zOrigin === "variable");
        zFields.load(desc.z !== undefined ? desc.z : 0, desc.zOrigin, desc.zVariableId);
        setZoom.set(desc.zoom !== undefined || desc.zoomOrigin === "variable");
        zoomFields.load(desc.zoom !== undefined ? desc.zoom : 0, desc.zoomOrigin, desc.zoomVariableId);
        tileOriginIndex.set(desc.tileOrigin === "variable" ? 1 : 0);
        cameraTilePicker.refresh(desc.tileVariableId || "");
        if (desc.rotationOrigin === "variable") {
            rotationOriginIndex.set(2);
            setRotation.set(true);
        } else if (desc.rotationOrigin === "hardcoded" || desc.rotation !== undefined) {
            rotationOriginIndex.set(1);
            setRotation.set(true);
        } else {
            rotationOriginIndex.set(0);
            setRotation.set(false);
        }
        rotation.set(desc.rotation !== undefined ? desc.rotation : 0);
        cameraDirectionPicker.refresh(desc.rotationVariableId || "");
        cameraModeIndex.set(indexOfValue(CAMERA_MODES, desc.mode));
    }

    function persistMessage(): ParkMessageStepDesc {
        const text = messageTextFields.read();
        const desc: ParkMessageStepDesc = {
            type: "parkMessage",
            text: text.value,
            ...(text.origin === "variable" ? {textOrigin: "variable" as const, textVariableId: text.variableId || ""} : {}),
            messageType: PARK_MESSAGE_TYPES[messageTypeIndex.get()] || "blank"
        };
        if (setSubject.get()) {
            desc.subject = subject.get();
        }
        return desc;
    }

    function persistFreeze(): FreezeWeatherStepDesc {
        return {type: "freezeWeather", mode: ON_OFF_TOGGLE[freezeIndex.get()] || "on"};
    }

    function persistCash(): ParkCashStepDesc {
        const source = cashFields.read();
        return {
            type: "parkCash",
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {})
        };
    }

    function persistRating(): ParkRatingStepDesc {
        const source = ratingFields.read();
        return {
            type: "parkRating",
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {})
        };
    }

    function persistAward(): GrantAwardStepDesc {
        return {type: "grantAward", award: AWARD_TYPES[awardIndex.get()] || AWARD_TYPES[0]};
    }

    function persistPause(): GamePauseStepDesc {
        return {type: "gamePause", mode: PAUSE_MODES[pauseIndex.get()] || "pause"};
    }

    function persistSpeed(): GameSpeedStepDesc {
        const source = speedFields.read();
        return {
            type: "gameSpeed",
            speed: source.value,
            ...(source.origin === "variable" ? {speedOrigin: "variable", speedVariableId: source.variableId || ""} : {})
        };
    }

    function persistDate(): ParkDateStepDesc {
        const source = yearFields.read();
        return {
            type: "parkDate",
            year: source.value,
            ...(source.origin === "variable" ? {yearOrigin: "variable", yearVariableId: source.variableId || ""} : {}),
            month: monthIndex.get()
        };
    }

    function persistCamera(): ViewportCameraStepDesc {
        const desc: ViewportCameraStepDesc = {
            type: "viewportCamera",
            x: tileX.get(),
            y: tileY.get(),
            mode: CAMERA_MODES[cameraModeIndex.get()] || "move"
        };
        if (tileOriginIndex.get() === 1) {
            desc.tileOrigin = "variable";
            desc.tileVariableId = cameraTilePicker.selectedId();
        }
        if (setZ.get()) {
            const source = zFields.read();
            desc.z = source.value;
            if (source.origin === "variable") {
                desc.zOrigin = "variable";
                desc.zVariableId = source.variableId || "";
            }
        }
        if (setZoom.get()) {
            const source = zoomFields.read();
            desc.zoom = source.value;
            if (source.origin === "variable") {
                desc.zoomOrigin = "variable";
                desc.zoomVariableId = source.variableId || "";
            }
        }
        if (rotationOriginIndex.get() === 2) {
            desc.rotationOrigin = "variable";
            desc.rotationVariableId = cameraDirectionPicker.selectedId();
        } else if (rotationOriginIndex.get() === 1) {
            desc.rotationOrigin = "hardcoded";
            desc.rotation = rotation.get();
        }
        return desc;
    }

    const widgets = [
        groupbox({
            text: "Park",
            visibility,
            content: [
                ...messageTextFields.widgets,
                horizontal([
                    label({text: "Type", width: 70, visibility: messageVisibility}),
                    dropdown({
                        items: MESSAGE_LABELS,
                        selectedIndex: twoway(messageTypeIndex),
                        visibility: messageVisibility,
                        onChange: (index) => {
                            messageTypeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Subject", width: 70, visibility: messageVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setSubject),
                        visibility: messageVisibility,
                        onChange: (checked) => {
                            setSubject.set(checked);
                            onPersist();
                        }
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(subject),
                        minimum: 0,
                        maximum: 100000,
                        disabled: compute(setSubject, (set) => !set),
                        visibility: messageVisibility,
                        onChange: (next) => {
                            subject.set(next);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Mode", width: 70, visibility: freezeVisibility}),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(freezeIndex),
                        visibility: freezeVisibility,
                        onChange: (index) => {
                            freezeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...cashFields.widgets,
                ...ratingFields.widgets,
                horizontal([
                    label({text: "Award", width: 70, visibility: awardVisibility}),
                    dropdown({
                        items: AWARD_LABELS,
                        selectedIndex: twoway(awardIndex),
                        visibility: awardVisibility,
                        onChange: (index) => {
                            awardIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Mode", width: 70, visibility: pauseVisibility}),
                    dropdown({
                        items: PAUSE_MODE_LABELS,
                        selectedIndex: twoway(pauseIndex),
                        visibility: pauseVisibility,
                        onChange: (index) => {
                            pauseIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...speedFields.widgets,
                ...yearFields.widgets,
                horizontal([
                    label({text: "Month", width: 50, visibility: dateVisibility}),
                    dropdown({
                        items: MONTH_LABELS,
                        selectedIndex: twoway(monthIndex),
                        visibility: dateVisibility,
                        onChange: (index) => {
                            monthIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                dropdown({
                    items: ["Hardcoded Tile", "Tile Variable"],
                    selectedIndex: twoway(tileOriginIndex),
                    visibility: cameraVisibility,
                    onChange: (index) => {
                        tileOriginIndex.set(index);
                        if (index === 1) {
                            cameraTilePicker.refresh();
                        }
                        onPersist();
                    }
                }),
                ...cameraTilePicker.widgets,
                horizontal([
                    label({text: "X", width: 20, visibility: cameraTileHardcodedVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(tileX),
                        minimum: 0,
                        maximum: 10000,
                        visibility: cameraTileHardcodedVisibility,
                        onChange: (next) => {
                            tileX.set(next);
                            onPersist();
                        }
                    }),
                    label({text: "Y", width: 20, visibility: cameraTileHardcodedVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(tileY),
                        minimum: 0,
                        maximum: 10000,
                        visibility: cameraTileHardcodedVisibility,
                        onChange: (next) => {
                            tileY.set(next);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Tile",
                        visibility: cameraTileHardcodedVisibility,
                        onClick: () => {
                            pickTile((tile) => {
                                tileX.set(tile.x);
                                tileY.set(tile.y);
                                onPersist();
                            });
                        }
                    }),
                    goToTileButton({
                        visibility: cameraTileHardcodedVisibility,
                        getTile: () => ({x: tileX.get(), y: tileY.get()})
                    })
                ]),
                horizontal([
                    checkbox({
                        text: "Z",
                        isChecked: twoway(setZ),
                        visibility: cameraVisibility,
                        onChange: (checked) => {
                            setZ.set(checked);
                            onPersist();
                        }
                    }),
                ]),
                ...zFields.widgets,
                horizontal([
                    checkbox({
                        text: "Zoom",
                        isChecked: twoway(setZoom),
                        visibility: cameraVisibility,
                        onChange: (checked) => {
                            setZoom.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...zoomFields.widgets,
                horizontal([
                    dropdown({
                        items: ["No Rotation", "Hardcoded Rotation", "Direction Variable"],
                        selectedIndex: twoway(rotationOriginIndex),
                        visibility: cameraVisibility,
                        onChange: (index) => {
                            rotationOriginIndex.set(index);
                            setRotation.set(index > 0);
                            if (index === 2) {
                                cameraDirectionPicker.refresh();
                            }
                            onPersist();
                        }
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(rotation),
                        minimum: 0,
                        maximum: 3,
                        visibility: cameraRotationHardcodedVisibility,
                        onChange: (next) => {
                            rotation.set(next);
                            onPersist();
                        }
                    }),
                    dropdown({
                        items: CAMERA_MODE_LABELS,
                        selectedIndex: twoway(cameraModeIndex),
                        visibility: cameraVisibility,
                        onChange: (index) => {
                            cameraModeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...cameraDirectionPicker.widgets
            ]
        })
    ];

    return {
        hide,
        loadMessage,
        loadFreeze,
        loadCash,
        loadRating,
        loadAward,
        loadPause,
        loadSpeed,
        loadDate,
        loadCamera,
        persistMessage,
        persistFreeze,
        persistCash,
        persistRating,
        persistAward,
        persistPause,
        persistSpeed,
        persistDate,
        persistCamera,
        widgets
    };
}

export type ParkStepFields = ReturnType<typeof createParkStepFields>;
