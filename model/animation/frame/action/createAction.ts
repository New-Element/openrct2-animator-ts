import Action from "./action";
import TrainEditColourAction from "./train/trainEditColourAction";
import ObjectRecolourAction from "./object/objectRecolourAction";
import ObjectSetVisibilityAction from "./object/objectSetVisibilityAction";

interface ActionDesc {
    type: string;
}

export default function createAction(data: ActionDesc): Action|undefined {
    switch(data.type) {
        case 'trainEditColour': return new TrainEditColourAction(data);
        case 'objectRecolour': return new ObjectRecolourAction(data);
        case 'objectSetVisibility': return new ObjectSetVisibilityAction(data);
        default: return undefined;
    }
}