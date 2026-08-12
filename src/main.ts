/// <reference path="./../openrct2.d.ts" />

import getConductor from "../model/getConductor";
import { PLUGIN_VERSION } from "../model/pluginInfo";
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
        getConductor();
        ui.registerMenuItem("Animator", () => JsonEntry.open());
    },
});
