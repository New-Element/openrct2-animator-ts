/// <reference path="./../openrct2.d.ts" />

import getConductor from "../model/getConductor";
import { PLUGIN_VERSION } from "../model/pluginInfo";
import {toggleRemainingHighlight} from "../view/todos/remainingHighlight";
import {bindScriptRoofMode} from "../model/lookInside/scriptRoofMode";
import {applyTabRoofMode, CYCLE_ROOF_MODE_DEFAULT_BINDINGS, cycleTabRoofMode} from "../view/lookInside/tabRoofMode";
import JsonEntry from "../view/jsonEntry/jsonEntry";

registerPlugin({
    name: "Animator",
    version: PLUGIN_VERSION,
    authors: ["deanosrs"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: () => {
        bindScriptRoofMode(applyTabRoofMode);
        getConductor();
        ui.registerMenuItem("Animator", () => JsonEntry.open());
        // Two-part ids (`animator.action`) keep all shortcuts in one Shortcut Keys group.
        ui.registerShortcut({
            id: "animator.openWindow",
            text: "[Animator] Open Window",
            bindings: ["A"],
            callback: () => JsonEntry.open(),
        });
        ui.registerShortcut({
            id: "animator.highlightRemaining",
            text: "[Animator] Highlight To-Do Tiles",
            bindings: [],
            callback: () => toggleRemainingHighlight(),
        });
        ui.registerShortcut({
            id: "animator.cycleRoofMode",
            text: "[Animator] Cycle Roof Mode",
            bindings: CYCLE_ROOF_MODE_DEFAULT_BINDINGS,
            callback: () => cycleTabRoofMode(),
        });
    },
});
