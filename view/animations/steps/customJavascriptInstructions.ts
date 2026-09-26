/// <reference path="./../../../openrct2.d.ts" />

import {createInstructionsOpener} from "../../ui/instructionsWindow";

const LINES = [
    "The script runs once when this step starts.",
    "Paste JavaScript into the text field.",
    "",
    "An animator object is passed in.",
    "",
    "Read a variable by name:",
    "animator.get(\"score\")",
    "",
    "Write a variable by name:",
    "animator.set(\"score\", 12)",
    "animator.set(\"score\", animator.get(\"score\") + 1)",
    "",
    "get returns undefined if the name is missing.",
    "set returns false and logs an error if the name is missing.",
    "",
    "This run's trigger context is on animator.run.",
    "A field is only set when the trigger provided it:",
    "animator.run.rideId",
    "animator.run.trainIndex",
    "animator.run.carIndex",
    "animator.run.tile",
    "animator.run.guestId",
    "animator.run.vehicleId",
    "animator.run.weather",
    "animator.run.day",
    "animator.run.month",
    "animator.run.year",
    "animator.run.variableId",
    "animator.run.variableValue",
    "animator.run.breakdownReason",
    "animator.run.crashIntoType",
    "animator.run.animationId",
    "animator.run.animationName",
    "",
    "OpenRCT2 APIs still work. context is the plugin API,",
    "not this animation run:",
    "park.postMessage({type: \"blank\", text: \"Hello\"})",
    "map.getRide(animator.run.rideId)"
];

export const openCustomJavascriptInstructions = createInstructionsOpener(
    "Custom Javascript Instructions",
    LINES,
    360
);
