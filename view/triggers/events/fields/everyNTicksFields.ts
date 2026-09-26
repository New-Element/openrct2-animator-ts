/// <reference path="./../../../../openrct2.d.ts" />

import {horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import EveryNTicksEvent from "../../../../model/animation/trigger/event/everyNTicksEvent";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";

export function createEveryNTicksFields(
    getTrigger: () => Trigger | null,
    canPersist: () => boolean = () => true
) {
    const visibility = store<"visible" | "none">("none");
    const ticks = store<number>(40);

    function hide(): void {
        visibility.set("none");
    }

    function save(trigger: Trigger): void {
        if (!(trigger.event instanceof EveryNTicksEvent)) {
            return;
        }
        trigger.event.setTicks(ticks.get());
        getConductor().triggersArray.save();
    }

    function persistFromUi(): void {
        if (!canPersist()) {
            return;
        }
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        if (!(trigger.event instanceof EveryNTicksEvent)) {
            hide();
            return;
        }
        visibility.set("visible");
        ticks.set(trigger.event.ticks);
    }

    const widgets = [
        horizontal([
            label({
                text: "Ticks",
                width: 40,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(ticks),
                minimum: 1,
                maximum: 100000,
                visibility,
                onChange: (value) => {
                    ticks.set(value);
                    persistFromUi();
                }
            })
        ])
    ];

    return {hide, load, save, widgets};
}

export type EveryNTicksFields = ReturnType<typeof createEveryNTicksFields>;
