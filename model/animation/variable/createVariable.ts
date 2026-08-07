import {VariableDesc} from "../jsonTypes";
import Variable from "./variable";

export default function createVariable(data: VariableDesc): Variable {
    return new Variable(data);
}
