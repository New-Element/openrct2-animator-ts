/// <reference path="./../openrct2.d.ts" />

import getConductor from "../model/getConductor";
import { PLUGIN_VERSION } from "../model/pluginInfo";
import JsonEntry from "../view/jsonEntry/jsonEntry";
import * as DebugUtils from "../model/debugUtils";

// Expose debug utilities globally for console access
(globalThis as any).animatorDebug = DebugUtils;

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
        
        // Log that debug utilities are available
        console.log('[Animator] Plugin loaded. Debug utilities available:');
        console.log('');
        console.log('--- Staff Commands ---');
        console.log('  animatorDebug.logAllEntertainers()');
        console.log('  animatorDebug.findEntertainersByName("name")');
        console.log('  animatorDebug.findEntertainersNearTile(x, y, radius)');
        console.log('  animatorDebug.logStaffById(id)');
        console.log('');
            console.log('--- Ride Commands ---');
            console.log('  animatorDebug.logAllRides()');
            console.log('  animatorDebug.findRidesByName("name")');
            console.log('  animatorDebug.findRidesByClassification("ride"|"stall"|"facility")');
            console.log('  animatorDebug.logRideById(id)');
            console.log('  animatorDebug.trackTrain(rideId, trainIndex, durationTicks=200)');
    },
});
