/// <reference path="./../../../../openrct2.d.ts" />

import {StaffEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

export default class StaffEvent extends TriggerEvent {
    type: "staff" = "staff";
    staffId: number;

    constructor(obj: StaffEventDesc) {
        super(obj);
        this.type = "staff";
        this.staffId = obj.staffId;
    }

    tryFire(): TriggerContext[] {
        const entity = map.getEntity(this.staffId);

        if (!entity || entity.type !== "staff") {
            return [];
        }

        return [
            withContextLists({
                target: {
                    staffId: this.staffId
                }
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "staff",
            staffId: this.staffId
        };
    }
}
