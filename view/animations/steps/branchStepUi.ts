/// <reference path="./../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {BranchTarget, StepDesc} from "../../../model/animation/jsonTypes";
import {createConditionListEditor} from "../../triggers/conditions/conditionListEditor";
import {StepUiModule} from "./stepUiTypes";

function labelsFor(saved: BranchTarget, count: number): {labels: string[]; index: number} {
    const labels = ["End"];
    for (let i = 0; i < count; i++) {
        labels.push(`Step ${i + 1}`);
    }
    if (saved === "end" || saved < 0) {
        return {labels, index: 0};
    }
    if (saved < count) {
        return {labels, index: saved + 1};
    }
    labels.push(`Step ${saved + 1}`);
    return {labels, index: labels.length - 1};
}

function targetFrom(labels: string[], index: number): BranchTarget {
    if (index <= 0) {
        return "end";
    }
    const label = labels[index] || "";
    const stepNumber = parseInt(label.replace("Step ", ""), 10);
    if (!stepNumber || stepNumber < 1) {
        return "end";
    }
    return stepNumber - 1;
}

export function createBranchStepUi(onPersist: () => void, getStepCount: () => number) {
    const visibility = store<"visible" | "none">("none");
    const passItems = store<string[]>(["End"]);
    const failItems = store<string[]>(["End"]);
    const passIndex = store<number>(0);
    const failIndex = store<number>(0);
    let passLabels: string[] = ["End"];
    let failLabels: string[] = ["End"];
    let suppressPersist = 0;
    const conditions = createConditionListEditor(() => {
        if (suppressPersist > 0) {
            return;
        }
        onPersist();
    }, {listHeight: 80, initiallyVisible: false});

    function hide(): void {
        visibility.set("none");
        conditions.hide();
    }

    function showTarget(which: "pass" | "fail", saved: BranchTarget): void {
        const built = labelsFor(saved, getStepCount());
        if (which === "pass") {
            passLabels = built.labels;
            passItems.set(built.labels);
            passIndex.set(built.index);
            return;
        }
        failLabels = built.labels;
        failItems.set(built.labels);
        failIndex.set(built.index);
    }

    const module: StepUiModule = {
        type: "branch",
        addLabel: "Branch",
        rowLabel: () => "Branch",
        createStub: () => ({type: "branch", conditions: [], passTo: "end", failTo: "end"}),
        load: (desc: StepDesc) => {
            if (desc.type !== "branch") {
                return;
            }
            suppressPersist += 1;
            try {
                visibility.set("visible");
                showTarget("pass", desc.passTo);
                showTarget("fail", desc.failTo);
                conditions.load(desc.conditions || []);
            } finally {
                suppressPersist -= 1;
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "branch") {
                return null;
            }
            return {
                type: "branch",
                passTo: targetFrom(passLabels, passIndex.get()),
                failTo: targetFrom(failLabels, failIndex.get()),
                conditions: conditions.read()
            };
        }
    };

    const widgets = [
        groupbox({
            text: "Branch",
            visibility,
            content: [
                horizontal([
                    label({text: "If Pass", width: 70, visibility}),
                    dropdown({
                        items: passItems,
                        selectedIndex: twoway(passIndex),
                        visibility,
                        onChange: (index: number) => {
                            if (suppressPersist > 0) {
                                return;
                            }
                            passIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "If Fail", width: 70, visibility}),
                    dropdown({
                        items: failItems,
                        selectedIndex: twoway(failIndex),
                        visibility,
                        onChange: (index: number) => {
                            if (suppressPersist > 0) {
                                return;
                            }
                            failIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        }),
        ...conditions.widgets
    ];

    return {module, hide, widgets};
}
