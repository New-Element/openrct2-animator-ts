import {StepDesc} from "../../model/animation/jsonTypes";
import {unselectedVehicleColour} from "../../model/animation/step/car/vehicleColour";

export const ADD_STEP_LABELS = [
    "Wait",
    "Recolour Car",
    "Recolour Train",
    "Set Variable",
    "Increment Variable",
    "Decrement Variable",
    "Set Track Height",
    "Car Coords Over Time",
    "Train Coords Over Time"
];

export function stepRowLabel(desc: StepDesc): string {
    switch (desc.type) {
        case "wait":
            return "Wait";
        case "carEditColour":
            return "Recolour Car";
        case "trainEditColour":
            return "Recolour Train";
        case "variableSet":
            return "Set Variable";
        case "variableIncrement":
            return "Increment Variable";
        case "variableDecrement":
            return "Decrement Variable";
        case "trackSetHeight":
            return "Set Track Height";
        case "carCoordsOverTime":
            return "Car Coords Over Time";
        case "trainCoordsOverTime":
            return "Train Coords Over Time";
    }
}

export function createStepStub(addIndex: number): StepDesc {
    switch (addIndex) {
        case 1:
            return {
                type: "carEditColour",
                value: unselectedVehicleColour(),
                useTriggerTarget: true
            };
        case 2:
            return {
                type: "trainEditColour",
                value: unselectedVehicleColour(),
                useTriggerTarget: true
            };
        case 3:
            return { type: "variableSet", variableId: "", value: 0 };
        case 4:
            return { type: "variableIncrement", variableId: "", amount: 1 };
        case 5:
            return { type: "variableDecrement", variableId: "", amount: 1 };
        case 6:
            return {
                type: "trackSetHeight",
                tile: { x: 0, y: 0 },
                rideId: 0,
                trackType: 0,
                baseHeight: 0
            };
        case 7:
            return { type: "carCoordsOverTime", deltaZ: -16, durationTicks: 40 };
        case 8:
            return { type: "trainCoordsOverTime", deltaZ: -16, durationTicks: 40 };
        default:
            return { type: "wait", ticks: 40 };
    }
}
