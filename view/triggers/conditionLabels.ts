import {ConditionDesc} from "../../model/animation/jsonTypes";

export const ADD_CONDITION_LABELS = [
    "Train Modulo",
    "Car Equals",
    "Car Modulo"
];

export function conditionRowLabel(desc: ConditionDesc): string {
    switch (desc.type) {
        case "trainModulo":
            return `Train Modulo: ${desc.modulo}, Remainder ${desc.remainder}`;
        case "carModulo":
            return `Car Modulo: ${desc.modulo}, Remainder ${desc.remainder}`;
        case "carEquals":
            return `Car Equals: ${desc.value}`;
        case "rideOpen":
            return desc.rideId !== undefined
                ? `Ride Open: ${desc.rideId}`
                : "Ride Open";
    }
}

export function createConditionStub(addIndex: number): ConditionDesc {
    switch (addIndex) {
        case 1:
            return { type: "carEquals", value: 0 };
        case 2:
            return { type: "carModulo", modulo: 2, remainder: 0 };
        default:
            return { type: "trainModulo", modulo: 2, remainder: 0 };
    }
}
