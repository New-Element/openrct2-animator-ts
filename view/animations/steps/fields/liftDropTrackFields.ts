/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, dropdown, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {
    LiftDropStageTriggers,
    LiftDropTrackStepDesc,
    NumberSourceOrigin
} from "../../../../model/animation/jsonTypes";
import {readLiftDropLandHeight, readLiftDropWaitTicks} from "../../../../model/animation/liftDropHeights";
import getConductor from "../../../../model/getConductor";
import {createNumberSourceFields} from "./numberSourceFields";

type StageKey = keyof LiftDropStageTriggers;

const STAGE_ROWS: Array<{key: StageKey; label: string}> = [
    {key: "trainEnters", label: "Train enters"},
    {key: "verticalMoveStarts", label: "Vertical movement starts"},
    {key: "verticalMoveEnds", label: "Vertical movement ends"},
    {key: "restoreStarts", label: "Vertical track restore starts"},
    {key: "restoreEnds", label: "Vertical track restore ends"}
];

export function createLiftDropTrackFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const startHeightFields = createNumberSourceFields({
        valueType: "int",
        label: "Start",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: visibility
    });
    const endHeightFields = createNumberSourceFields({
        valueType: "int",
        label: "End",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: visibility
    });
    const speedFields = createNumberSourceFields({
        valueType: "int",
        label: "Speed (%)",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: visibility
    });
    const reverseExitDirection = store<boolean>(false);
    const waitBeforeMoveTicks = store<number>(50);
    const waitAfterMoveTicks = store<number>(0);

    const triggerDropdownItems = store<string[]>(["(none)"]);
    let triggerOptionIds: (string | null)[] = [null];
    const stageSelectedIndex: {[K in StageKey]: ReturnType<typeof store<number>>} = {
        trainEnters: store(0),
        verticalMoveStarts: store(0),
        verticalMoveEnds: store(0),
        restoreStarts: store(0),
        restoreEnds: store(0)
    };

    function refreshTriggerOptions(): void {
        const triggers = getConductor().triggersArray.items;
        triggerOptionIds = [null];
        const labels: string[] = ["(none)"];
        for (let i = 0; i < triggers.length; i++) {
            const name = triggers[i].name.trim() ? triggers[i].name : "(Unnamed)";
            labels.push(name);
            triggerOptionIds.push(triggers[i].id);
        }
        triggerDropdownItems.set(labels);
    }

    function indexForTriggerId(triggerId: string | undefined): number {
        if (typeof triggerId !== "string" || !triggerId) {
            return 0;
        }
        const index = triggerOptionIds.indexOf(triggerId);
        return index >= 0 ? index : 0;
    }

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: LiftDropTrackStepDesc): void {
        visibility.set("visible");
        startHeightFields.load(readLiftDropLandHeight(desc, "start"), desc.startHeightOrigin, desc.startHeightVariableId);
        endHeightFields.load(readLiftDropLandHeight(desc, "end"), desc.endHeightOrigin, desc.endHeightVariableId);
        speedFields.load(typeof desc.speed === "number" ? desc.speed : 100, desc.speedOrigin, desc.speedVariableId);
        reverseExitDirection.set(desc.reverseExitDirection === true);
        waitBeforeMoveTicks.set(readLiftDropWaitTicks(desc.waitBeforeMoveTicks, 50));
        waitAfterMoveTicks.set(readLiftDropWaitTicks(desc.waitAfterMoveTicks, 0));
        refreshTriggerOptions();
        const stages = desc.stageTriggers || {};
        for (let i = 0; i < STAGE_ROWS.length; i++) {
            const key = STAGE_ROWS[i].key;
            stageSelectedIndex[key].set(indexForTriggerId(stages[key]));
        }
    }

    function readStageTriggers(): LiftDropStageTriggers | undefined {
        const next: LiftDropStageTriggers = {};
        for (let i = 0; i < STAGE_ROWS.length; i++) {
            const key = STAGE_ROWS[i].key;
            const id = triggerOptionIds[stageSelectedIndex[key].get()];
            if (typeof id === "string" && id) {
                next[key] = id;
            }
        }
        return Object.keys(next).length > 0 ? next : undefined;
    }

    function persistNumber(field: string, source: {value: number; origin?: NumberSourceOrigin; variableId?: string}): {
        [key: string]: number | NumberSourceOrigin | string;
    } {
        return {
            [field]: source.value,
            ...(source.origin === "variable" ? {[`${field}Origin`]: "variable", [`${field}VariableId`]: source.variableId || ""} : {})
        };
    }

    function readFields(): {
        startHeight: number;
        startHeightOrigin?: NumberSourceOrigin;
        startHeightVariableId?: string;
        endHeight: number;
        endHeightOrigin?: NumberSourceOrigin;
        endHeightVariableId?: string;
        speed: number;
        speedOrigin?: NumberSourceOrigin;
        speedVariableId?: string;
        reverseExitDirection: boolean;
        waitBeforeMoveTicks: number;
        waitAfterMoveTicks: number;
        stageTriggers?: LiftDropStageTriggers;
    } {
        const stageTriggers = readStageTriggers();
        return {
            ...persistNumber("startHeight", startHeightFields.read()),
            ...persistNumber("endHeight", endHeightFields.read()),
            ...persistNumber("speed", speedFields.read()),
            reverseExitDirection: reverseExitDirection.get(),
            waitBeforeMoveTicks: waitBeforeMoveTicks.get(),
            waitAfterMoveTicks: waitAfterMoveTicks.get(),
            ...(stageTriggers ? {stageTriggers: stageTriggers} : {})
        } as ReturnType<typeof readFields>;
    }

    const stageDropdownWidgets = STAGE_ROWS.map((row) =>
        horizontal([
            label({
                text: row.label,
                width: 180,
                visibility
            }),
            dropdown({
                items: triggerDropdownItems,
                selectedIndex: twoway(stageSelectedIndex[row.key]),
                visibility,
                onChange: (index) => {
                    stageSelectedIndex[row.key].set(index);
                    onPersist();
                }
            })
        ])
    );

    const widgets = [
        groupbox({
            text: "Lift/Drop Track",
            visibility,
            content: [
                label({
                    text: "Height (Land Units)",
                    visibility
                }),
                ...startHeightFields.widgets,
                ...endHeightFields.widgets,
                ...speedFields.widgets,
                horizontal([
                    label({
                        text: "Wait Before Move (Ticks)",
                        width: 180,
                        visibility
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(waitBeforeMoveTicks),
                        minimum: 0,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            waitBeforeMoveTicks.set(value);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Wait After Move (Ticks)",
                        width: 180,
                        visibility
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(waitAfterMoveTicks),
                        minimum: 0,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            waitAfterMoveTicks.set(value);
                            onPersist();
                        }
                    })
                ]),
                checkbox({
                    text: "Reverse Exit Direction",
                    isChecked: twoway(reverseExitDirection),
                    visibility,
                    onChange: (checked) => {
                        reverseExitDirection.set(checked);
                        onPersist();
                    }
                }),
                label({
                    text: "Stage triggers (optional)",
                    visibility
                }),
                ...stageDropdownWidgets
            ]
        })
    ];

    return {hide, load, readFields, widgets};
}

export type LiftDropTrackFields = ReturnType<typeof createLiftDropTrackFields>;
