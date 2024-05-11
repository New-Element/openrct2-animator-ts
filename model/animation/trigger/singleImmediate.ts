import Trigger from "./trigger";
import {AnimationTarget} from "../animationTarget";

/// <reference path="./../../../openrct2.d.ts" />


export default class SingleImmediateTrigger extends Trigger {

    type: 'singleImmediate';

    test(): false|AnimationTarget {
        return {
            static: true
        };
    }

    getDataToPersist(): object {
        return {
            type: 'singleImmediate'
        }
    }


}