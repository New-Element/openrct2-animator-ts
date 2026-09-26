/// <reference path="./../../../../openrct2.d.ts" />

import {GuestGenerationEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import {peekGuestGenerations} from "./hookInbox";
import TriggerEvent from "./triggerEvent";

export default class GuestGenerationEvent extends TriggerEvent {
    type: "guestGeneration" = "guestGeneration";

    constructor(obj: GuestGenerationEventDesc) {
        super(obj);
        this.type = "guestGeneration";
    }

    tryFire(): TriggerContext[] {
        const notices = peekGuestGenerations();
        const out: TriggerContext[] = [];
        for (let i = 0; i < notices.length; i++) {
            const guestId = notices[i].guestId;
            const entity = map.getEntity(guestId);
            if (!entity || entity.type !== "guest") {
                continue;
            }
            const guest = entity as Guest;
            out.push(
                withContextLists({
                    target: {guestId: guestId},
                    guestId: guestId,
                    tile: {
                        x: Math.floor(guest.x / 32),
                        y: Math.floor(guest.y / 32)
                    }
                })
            );
        }
        return out;
    }

    getDataToPersist(): object {
        return {
            type: "guestGeneration"
        };
    }
}
