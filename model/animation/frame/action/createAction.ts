import Action from "./action";
import TrainEditColourAction from "./train/trainEditColourAction";

interface ActionDesc {
    type: string;
}

export default function createAction(data: ActionDesc): Action|undefined {
    switch(data.type) {
        case 'trainEditColour': return new TrainEditColourAction(data);
        default: return undefined;
    }
}