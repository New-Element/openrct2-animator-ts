import Conductor from "./conductor";

type conductorType = false | Conductor;
let conductor: conductorType = false;

export default function getConductor() {
    if (!conductor) {
        conductor = new Conductor();
    }
    return conductor;
};