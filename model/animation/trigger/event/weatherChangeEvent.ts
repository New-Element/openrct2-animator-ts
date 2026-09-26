/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {WeatherChangeEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

function currentWeather(): string | null {
    if (typeof climate === "undefined" || !climate.current || !climate.current.weather) {
        return null;
    }
    return climate.current.weather;
}

export default class WeatherChangeEvent extends TriggerEvent {
    type: "weatherChange" = "weatherChange";

    private seeded: boolean = false;
    private lastWeather: string | undefined;
    private loggedMissingClimate: boolean = false;

    constructor(obj: WeatherChangeEventDesc) {
        super(obj);
        this.type = "weatherChange";
    }

    tryFire(): TriggerContext[] {
        const weather = currentWeather();
        if (!weather) {
            if (!this.loggedMissingClimate) {
                this.loggedMissingClimate = true;
                error("trigger", "Weather Changes: climate is not available");
            }
            return [];
        }
        if (!this.seeded) {
            this.seeded = true;
            this.lastWeather = weather;
            return [];
        }
        if (weather === this.lastWeather) {
            return [];
        }
        this.lastWeather = weather;
        return [
            withContextLists({
                target: {static: true},
                weather: weather
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "weatherChange"
        };
    }
}
