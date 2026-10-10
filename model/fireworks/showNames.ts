/// <reference path="./../../openrct2.d.ts" />

import {error, log} from "../logger";

const LIST_ACTION = "fireworks-list-show-names";
const RECEIVE_ACTION = "animator-receive-show-names";

type ShowNamesArgs = {
    showNames?: unknown;
};

type Listener = (names: string[]) => void;

let showNames: string[] = [];
const listeners: Listener[] = [];

export function getFireworksShowNames(): string[] {
    return showNames.slice();
}

export function subscribeFireworksShowNames(listener: Listener): void {
    listeners.push(listener);
}

export function registerAnimatorReceiveShowNames(): void {
    context.registerAction<ShowNamesArgs>(
        RECEIVE_ACTION,
        () => ({}),
        (event) => {
            const raw = readShowNames(event);
            if (raw === null) {
                error("step", "Start Fireworks: show names were not a list");
                return {};
            }
            showNames = raw;
            log("step", `Start Fireworks: received ${showNames.length} show names`);
            for (let i = 0; i < listeners.length; i++) {
                listeners[i](showNames.slice());
            }
            return {};
        }
    );
}

export function requestFireworksShowNames(): void {
    try {
        context.executeAction(LIST_ACTION, {callback: RECEIVE_ACTION}, (result) => {
            if (typeof result.error === "number" && result.error !== 0) {
                error("step", "Start Fireworks: Fireworks did not list show names", result.errorMessage);
            }
        });
    } catch (e) {
        error("step", "Start Fireworks: could not ask Fireworks for show names", e);
    }
}

function readShowNames(event: GameActionEventArgs<ShowNamesArgs> | ShowNamesArgs): string[] | null {
    const record = event as ShowNamesArgs & {args?: ShowNamesArgs};
    const payload = record.args && typeof record.args === "object" ? record.args.showNames : record.showNames;
    if (!Array.isArray(payload)) {
        return null;
    }
    const names: string[] = [];
    const seen: {[name: string]: boolean} = {};
    for (let i = 0; i < payload.length; i++) {
        if (typeof payload[i] !== "string") {
            continue;
        }
        const name = payload[i].trim();
        if (!name || seen[name]) {
            continue;
        }
        seen[name] = true;
        names.push(name);
    }
    return names;
}
