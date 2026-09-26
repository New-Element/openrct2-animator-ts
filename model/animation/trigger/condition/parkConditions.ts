/// <reference path="./../../../../openrct2.d.ts" />

import {
    DateField,
    DateStatusConditionDesc,
    MatchOp,
    OnOff,
    ParkCashConditionDesc,
    ParkFlagConditionDesc,
    ParkGuestCountConditionDesc,
    ParkRatingConditionDesc,
    ScenarioStatusConditionDesc,
    TemperatureConditionDesc,
    WeatherStatusConditionDesc
} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import {compareNumbers} from "./compare";
import Condition from "./condition";

function matchIs(op: MatchOp, equal: boolean): boolean {
    return op === "is" ? equal : !equal;
}

export class WeatherStatusCondition extends Condition {
    type: "weatherStatus" = "weatherStatus";
    op: MatchOp;
    weather: WeatherType;

    constructor(obj: WeatherStatusConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.weather = obj.weather;
    }

    evaluate(_context: TriggerContext): boolean {
        return matchIs(this.op, climate.current.weather === this.weather);
    }

    getDataToPersist(): object {
        return {type: "weatherStatus", op: this.op, weather: this.weather};
    }
}

export class TemperatureCondition extends Condition {
    type: "temperature" = "temperature";
    op: TemperatureConditionDesc["op"];
    value: number;

    constructor(obj: TemperatureConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(_context: TriggerContext): boolean {
        return compareNumbers(climate.current.temperature, this.op, this.value);
    }

    getDataToPersist(): object {
        return {type: "temperature", op: this.op, value: this.value};
    }
}

function dateFieldValue(field: DateField): number {
    switch (field) {
        case "day":
            return date.day;
        case "month":
            return date.month;
        case "year":
            return date.year;
        case "monthsElapsed":
            return date.monthsElapsed;
        default:
            return date.day;
    }
}

export class DateStatusCondition extends Condition {
    type: "dateStatus" = "dateStatus";
    field: DateField;
    op: DateStatusConditionDesc["op"];
    value: number;

    constructor(obj: DateStatusConditionDesc) {
        super(obj);
        this.field = obj.field;
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(_context: TriggerContext): boolean {
        return compareNumbers(dateFieldValue(this.field), this.op, this.value);
    }

    getDataToPersist(): object {
        return {type: "dateStatus", field: this.field, op: this.op, value: this.value};
    }
}

export class ParkRatingCondition extends Condition {
    type: "parkRating" = "parkRating";
    op: ParkRatingConditionDesc["op"];
    value: number;

    constructor(obj: ParkRatingConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(_context: TriggerContext): boolean {
        return compareNumbers(park.rating, this.op, this.value);
    }

    getDataToPersist(): object {
        return {type: "parkRating", op: this.op, value: this.value};
    }
}

export class ParkGuestCountCondition extends Condition {
    type: "parkGuestCount" = "parkGuestCount";
    op: ParkGuestCountConditionDesc["op"];
    value: number;

    constructor(obj: ParkGuestCountConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(_context: TriggerContext): boolean {
        return compareNumbers(park.guests, this.op, this.value);
    }

    getDataToPersist(): object {
        return {type: "parkGuestCount", op: this.op, value: this.value};
    }
}

export class ParkCashCondition extends Condition {
    type: "parkCash" = "parkCash";
    op: ParkCashConditionDesc["op"];
    value: number;

    constructor(obj: ParkCashConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(_context: TriggerContext): boolean {
        return compareNumbers(park.cash, this.op, this.value);
    }

    getDataToPersist(): object {
        return {type: "parkCash", op: this.op, value: this.value};
    }
}

export class ParkFlagCondition extends Condition {
    type: "parkFlag" = "parkFlag";
    flag: ParkFlags;
    expected: OnOff;

    constructor(obj: ParkFlagConditionDesc) {
        super(obj);
        this.flag = obj.flag;
        this.expected = obj.expected;
    }

    evaluate(_context: TriggerContext): boolean {
        return park.getFlag(this.flag) === (this.expected === "on");
    }

    getDataToPersist(): object {
        return {type: "parkFlag", flag: this.flag, expected: this.expected};
    }
}

export class ScenarioStatusCondition extends Condition {
    type: "scenarioStatus" = "scenarioStatus";
    op: MatchOp;
    status: ScenarioStatus;

    constructor(obj: ScenarioStatusConditionDesc) {
        super(obj);
        this.op = obj.op;
        this.status = obj.status;
    }

    evaluate(_context: TriggerContext): boolean {
        return matchIs(this.op, scenario.status === this.status);
    }

    getDataToPersist(): object {
        return {type: "scenarioStatus", op: this.op, status: this.status};
    }
}
