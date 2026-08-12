import {ConditionDesc} from "../../../model/animation/jsonTypes";

export type ConditionUiModule = {
    type: ConditionDesc["type"];
    /** Label in the Add Condition dropdown; null if not addable. */
    addLabel: string | null;
    rowLabel(desc: ConditionDesc): string;
    createStub(): ConditionDesc;
    hide(): void;
    load(desc: ConditionDesc): void;
    /** Mutate desc from UI stores. */
    persist(desc: ConditionDesc): void;
};
