import {tabHelpButton} from "../ui/tabTutorial";

export function triggersTabHelp() {
    return tabHelpButton("Triggers", [
        "A trigger starts an animation when something happens in the park, such as a car entering a tile, a new day, or the park loading. Open a trigger to choose that event. Conditions can limit when it fires.",
        "Go to the Animations tab to create animations and link them to triggers. Search by name or event. Add, rename, move, and delete triggers here."
    ]);
}

export function animationsTabHelp() {
    return tabHelpButton("Animations", [
        "An animation is a sequence of steps that change the park, such as moving a car, changing scenery, waiting, or setting a variable. An animation needs a trigger to start it. Open an animation to edit its steps.",
        "Search by name. Add, rename, move, and delete animations here."
    ]);
}

export function variablesTabHelp() {
    return tabHelpButton("Variables", [
        "A variable is a named value saved with the park. Steps can change it, and conditions can test it. Some variables store a value you set. Others use a formula that is recalculated from other values.",
        "This list is every variable in the park. Search by name. Add, rename, move, and delete variables here. Reset Variables puts each one back to its reset value."
    ]);
}

export function logsTabHelp() {
    return tabHelpButton("Logs", [
        "This tab shows recent messages from the plugin, including triggers firing, animations starting or finishing, and errors.",
        "The dropdowns can limit the list to one trigger, one animation, or both. Clear Logs empties the list. Opening the Animator window sets both filters back to All."
    ]);
}

export function lookInsideTabHelp() {
    return tabHelpButton("Look Inside", [
        "Look Inside hides roofs so you can see inside a building. Show All, Hide All, and Cursor apply to every building. Show All shows every roof. Hide All hides every roof. Cursor hides the roof under the mouse and shows the others. The default shortcut is Shift+A.",
        "This list is every building you have set up. Search by name. Add, rename, move, and delete buildings here, and open one to choose its tiles and roof pieces."
    ]);
}

export function todosTabHelp() {
    return tabHelpButton("To-Dos", [
        "To-dos are for tracking your build progress. Each one is a note with a name, a priority, an optional map tile, and whether it is done. You can use this even if you don't use any animations.",
        "Search by name, and filter to Remaining, Completed, or All. Add, edit, move, and delete to-dos here. Show Remaining On Map marks tiles that are not done yet."
    ]);
}
