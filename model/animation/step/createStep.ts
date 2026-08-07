import {
    CarCoordsOverTimeStepDesc,
    CarEditColourStepDesc,
    StepDesc,
    StepDescBase,
    TrackSetHeightStepDesc,
    TrainCoordsOverTimeStepDesc,
    TrainEditColourStepDesc,
    VariableDecrementStepDesc,
    VariableIncrementStepDesc,
    VariableSetStepDesc,
    WaitStepDesc
} from "../jsonTypes";
import CarCoordsOverTimeStep from "./car/carCoordsOverTimeStep";
import CarEditColourStep from "./car/carEditColourStep";
import TrainCoordsOverTimeStep from "./car/trainCoordsOverTimeStep";
import TrainEditColourStep from "./car/trainEditColourStep";
import Step from "./step";
import TrackSetHeightStep from "./track/trackSetHeightStep";
import UnknownStep from "./unknownStep";
import VariableDecrementStep from "./variable/variableDecrementStep";
import VariableIncrementStep from "./variable/variableIncrementStep";
import VariableSetStep from "./variable/variableSetStep";
import WaitStep from "./waitStep";

export default function createStep(data: StepDesc | StepDescBase): Step {
    switch (data.type) {
        case "wait":
            return new WaitStep(data as WaitStepDesc);
        case "carEditColour":
            return new CarEditColourStep(data as CarEditColourStepDesc);
        case "trainEditColour":
            return new TrainEditColourStep(data as TrainEditColourStepDesc);
        case "variableSet":
            return new VariableSetStep(data as VariableSetStepDesc);
        case "variableIncrement":
            return new VariableIncrementStep(data as VariableIncrementStepDesc);
        case "variableDecrement":
            return new VariableDecrementStep(data as VariableDecrementStepDesc);
        case "trackSetHeight":
            return new TrackSetHeightStep(data as TrackSetHeightStepDesc);
        case "carCoordsOverTime":
            return new CarCoordsOverTimeStep(data as CarCoordsOverTimeStepDesc);
        case "trainCoordsOverTime":
            return new TrainCoordsOverTimeStep(data as TrainCoordsOverTimeStepDesc);
        default:
            return new UnknownStep(data);
    }
}
