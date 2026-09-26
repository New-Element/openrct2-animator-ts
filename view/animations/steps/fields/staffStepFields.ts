/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import TileCoords from "../../../../game/tileCoords";
import {
    StaffAnimationStepDesc,
    StaffCostumeStepDesc,
    StaffFlagStepDesc,
    StaffOrdersStepDesc,
    StaffPatrolStepDesc
} from "../../../../model/animation/jsonTypes";
import {createPeepTargetFields} from "../../../triggers/conditions/fields/peepTargetFields";
import {createNumberSourceFields} from "./numberSourceFields";
import {
    indexOfValue,
    labelsForValues,
    ON_OFF_TOGGLE,
    ON_OFF_TOGGLE_LABELS,
    PATROL_MODE_LABELS,
    PATROL_MODES,
    PEEP_FLAGS,
    STAFF_ANIMATIONS,
    STAFF_COSTUMES
} from "../../../triggers/conditions/labels";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickTileSet} from "../../../ui/pickTileSet";

const COSTUME_LABELS = labelsForValues(STAFF_COSTUMES);
const ANIMATION_LABELS = labelsForValues(STAFF_ANIMATIONS);
const FLAG_LABELS = labelsForValues(PEEP_FLAGS);

function copyTiles(tiles: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < tiles.length; i++) {
        out.push({x: tiles[i].x, y: tiles[i].y});
    }
    return out;
}

function tileKey(tile: TileCoords): string {
    return `${tile.x},${tile.y}`;
}

function mergeTiles(base: TileCoords[], extra: TileCoords[], add: boolean): TileCoords[] {
    const seen: {[key: string]: boolean} = {};
    const out: TileCoords[] = [];
    const source = add ? base.concat(extra) : base;
    const remove: {[key: string]: boolean} = {};
    if (!add) {
        for (let i = 0; i < extra.length; i++) {
            remove[tileKey(extra[i])] = true;
        }
    }
    for (let i = 0; i < source.length; i++) {
        const key = tileKey(source[i]);
        if (seen[key] || remove[key]) {
            continue;
        }
        seen[key] = true;
        out.push({x: source[i].x, y: source[i].y});
    }
    return out;
}

export function createStaffStepFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const staff = createPeepTargetFields(onPersist, "staff");
    const costumeVisibility = store<"visible" | "none">("none");
    const ordersVisibility = store<"visible" | "none">("none");
    const patrolVisibility = store<"visible" | "none">("none");
    const animationVisibility = store<"visible" | "none">("none");
    const flagVisibility = store<"visible" | "none">("none");

    const costumeIndex = store<number>(0);
    const ordersFields = createNumberSourceFields({
        valueType: "int",
        label: "Orders",
        minimum: 0,
        maximum: 255,
        onPersist: onPersist,
        visibility: ordersVisibility
    });
    const patrolModeIndex = store<number>(0);
    const patrolCount = store<string>("0 tiles");
    const animationIndex = store<number>(0);
    const flagIndex = store<number>(0);
    const modeIndex = store<number>(0);
    let patrolTiles: TileCoords[] = [];

    function hideExtras(): void {
        costumeVisibility.set("none");
        ordersVisibility.set("none");
        patrolVisibility.set("none");
        animationVisibility.set("none");
        flagVisibility.set("none");
    }

    function hide(): void {
        visibility.set("none");
        staff.hide();
        hideExtras();
    }

    function showBase(): void {
        visibility.set("visible");
        hideExtras();
    }

    function staffTarget(): {useTriggerStaff: boolean; staffId?: number} {
        const read = staff.read();
        if (read.useTrigger) {
            return {useTriggerStaff: true};
        }
        const data: {useTriggerStaff: boolean; staffId?: number} = {useTriggerStaff: false};
        if (typeof read.id === "number") {
            data.staffId = read.id;
        }
        return data;
    }

    function loadCostume(desc: StaffCostumeStepDesc): void {
        showBase();
        staff.load(desc.useTriggerStaff !== false, desc.staffId);
        costumeIndex.set(indexOfValue(STAFF_COSTUMES, desc.costume));
        costumeVisibility.set("visible");
    }

    function loadOrders(desc: StaffOrdersStepDesc): void {
        showBase();
        staff.load(desc.useTriggerStaff !== false, desc.staffId);
        ordersFields.load(desc.orders, desc.ordersOrigin, desc.ordersVariableId);
        ordersVisibility.set("visible");
    }

    function loadPatrol(desc: StaffPatrolStepDesc): void {
        showBase();
        staff.load(desc.useTriggerStaff !== false, desc.staffId);
        patrolModeIndex.set(indexOfValue(PATROL_MODES, desc.mode));
        patrolTiles = copyTiles(desc.tiles || []);
        patrolCount.set(`${patrolTiles.length} tiles`);
        patrolVisibility.set("visible");
    }

    function loadAnimation(desc: StaffAnimationStepDesc): void {
        showBase();
        staff.load(desc.useTriggerStaff !== false, desc.staffId);
        animationIndex.set(indexOfValue(STAFF_ANIMATIONS, desc.animation));
        animationVisibility.set("visible");
    }

    function loadFlag(desc: StaffFlagStepDesc): void {
        showBase();
        staff.load(desc.useTriggerStaff !== false, desc.staffId);
        flagIndex.set(indexOfValue(PEEP_FLAGS, desc.flag));
        modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
        flagVisibility.set("visible");
    }

    function persistCostume(): StaffCostumeStepDesc {
        return {
            type: "staffCostume",
            ...staffTarget(),
            costume: STAFF_COSTUMES[costumeIndex.get()] || STAFF_COSTUMES[0]
        };
    }

    function persistOrders(): StaffOrdersStepDesc {
        const source = ordersFields.read();
        return {
            type: "staffOrders",
            ...staffTarget(),
            orders: source.value,
            ...(source.origin === "variable" ? {ordersOrigin: "variable" as const, ordersVariableId: source.variableId || ""} : {})
        };
    }

    function persistPatrol(): StaffPatrolStepDesc {
        return {
            type: "staffPatrol",
            ...staffTarget(),
            mode: PATROL_MODES[patrolModeIndex.get()] || "set",
            tiles: copyTiles(patrolTiles)
        };
    }

    function persistAnimation(): StaffAnimationStepDesc {
        return {
            type: "staffAnimation",
            ...staffTarget(),
            animation: STAFF_ANIMATIONS[animationIndex.get()] || STAFF_ANIMATIONS[0]
        };
    }

    function persistFlag(): StaffFlagStepDesc {
        return {
            type: "staffFlag",
            ...staffTarget(),
            flag: PEEP_FLAGS[flagIndex.get()] || PEEP_FLAGS[0],
            mode: ON_OFF_TOGGLE[modeIndex.get()] || "on"
        };
    }

    const widgets = [
        groupbox({
            text: "Staff",
            visibility,
            content: [
                ...staff.widgets,
                horizontal([
                    label({text: "Costume", width: 70, visibility: costumeVisibility}),
                    dropdown({
                        items: COSTUME_LABELS,
                        selectedIndex: twoway(costumeIndex),
                        visibility: costumeVisibility,
                        onChange: (index) => {
                            costumeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...ordersFields.widgets,
                label({
                    text: "1 Sweep/Inspect, 2 Water/Fix, 4 Bins, 8 Mow",
                    visibility: ordersVisibility
                }),
                horizontal([
                    label({text: "Mode", width: 70, visibility: patrolVisibility}),
                    dropdown({
                        items: PATROL_MODE_LABELS,
                        selectedIndex: twoway(patrolModeIndex),
                        visibility: patrolVisibility,
                        onChange: (index) => {
                            patrolModeIndex.set(index);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Tiles",
                        visibility: patrolVisibility,
                        onClick: () => {
                            pickTileSet({
                                getTiles: () => patrolTiles,
                                onCommit: (mode, tiles) => {
                                    patrolTiles = mergeTiles(patrolTiles, tiles, mode === "add");
                                    patrolCount.set(`${patrolTiles.length} tiles`);
                                    onPersist();
                                }
                            });
                        }
                    }),
                    label({text: patrolCount, visibility: patrolVisibility})
                ]),
                horizontal([
                    label({text: "Animation", width: 70, visibility: animationVisibility}),
                    dropdown({
                        items: ANIMATION_LABELS,
                        selectedIndex: twoway(animationIndex),
                        visibility: animationVisibility,
                        onChange: (index) => {
                            animationIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Flag", width: 70, visibility: flagVisibility}),
                    dropdown({
                        items: FLAG_LABELS,
                        selectedIndex: twoway(flagIndex),
                        visibility: flagVisibility,
                        onChange: (index) => {
                            flagIndex.set(index);
                            onPersist();
                        }
                    }),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility: flagVisibility,
                        onChange: (index) => {
                            modeIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {
        hide,
        loadCostume,
        loadOrders,
        loadPatrol,
        loadAnimation,
        loadFlag,
        persistCostume,
        persistOrders,
        persistPatrol,
        persistAnimation,
        persistFlag,
        widgets
    };
}

export type StaffStepFields = ReturnType<typeof createStaffStepFields>;
