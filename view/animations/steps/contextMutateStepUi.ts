import {
    ContextMutateStepDesc,
    ContextOperation,
    ContextSlot,
    StepDesc
} from "../../../model/animation/jsonTypes";
import {ContextMutateFields} from "./fields/contextMutateFields";
import {StepUiModule} from "./stepUiTypes";

const SLOT_LABEL: {[slot in ContextSlot]: string} = {
    ride: "Rides",
    train: "Trains",
    car: "Cars",
    guest: "Guests",
    staff: "Staff",
    tile: "Tiles"
};

function operationLabel(operation: ContextOperation): string {
    if (operation === "set") {
        return "Set Context";
    }
    if (operation === "add") {
        return "Add To Context";
    }
    return "Remove From Context";
}

function defaultStub(operation: ContextOperation): ContextMutateStepDesc {
    if (operation === "add") {
        return {
            type: "contextMutate",
            operation: "add",
            slot: "guest",
            selector: "onTile",
            useContextTiles: true
        };
    }
    return {
        type: "contextMutate",
        operation: operation,
        slot: "train",
        selector: "allTrainsOfRide",
        useContextRide: true
    };
}

function rowLabel(desc: ContextMutateStepDesc): string {
    return `${operationLabel(desc.operation)} (${SLOT_LABEL[desc.slot]})`;
}

export function createContextMutateStepUi(
    fields: ContextMutateFields,
    operation: ContextOperation
): StepUiModule {
    return {
        type: "contextMutate",
        addLabel: operationLabel(operation),
        rowLabel: (desc: StepDesc) => {
            if (desc.type !== "contextMutate") {
                return operationLabel(operation);
            }
            return rowLabel(desc);
        },
        createStub: () => defaultStub(operation),
        load: (desc: StepDesc) => {
            if (desc.type !== "contextMutate") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "contextMutate") {
                return null;
            }
            const next = fields.persist();
            next.operation = current.operation;
            return next;
        }
    };
}

export function createContextMutateStepModules(fields: ContextMutateFields): StepUiModule[] {
    return [
        createContextMutateStepUi(fields, "set"),
        createContextMutateStepUi(fields, "add"),
        createContextMutateStepUi(fields, "remove")
    ];
}
