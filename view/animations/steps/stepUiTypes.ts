import {StepDesc} from "../../../model/animation/jsonTypes";

export type StepUiModule = {
    type: StepDesc["type"];
    addLabel: string;
    rowLabel(desc: StepDesc): string;
    createStub(): StepDesc;
    load(desc: StepDesc): void;
    persist(current: StepDesc): StepDesc | null;
};
