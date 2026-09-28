# How To Use Animator

You build animations in the Animator window. Open it from the map icon, or press A.

A trigger is what starts an animation. An animation is a sequence of steps. A step is one change: wait, recolour a car, hide scenery, set a variable, move the camera, and so on. Folders on the lists are only there to keep things tidy.

## A Small Example

Say a train hitting one tile should hide a piece of scenery.

1. On the Triggers tab, click Add Trigger. Give it a name. Set the event to Train Enters, and pick the ride and the tile.
2. On the Animations tab, click Add Animation. Give it a name. Under Linked Triggers, choose that trigger and click Add.
3. Under Steps, choose Scenery in the first dropdown and Scenery Visibility in the second, then click Add Step. Fill in the tiles and the object. Help on that step explains the fields.
4. Save the park. The next time that train enters the tile, the step runs.

The same animation can be linked to more than one trigger, and one trigger can start more than one animation. The link can be edited from either window.

## Triggers

The event is the thing that has to happen.

Immediate starts the linked animations while the park is running. It will not start a second copy of an animation that is already running from that trigger. When the animation finishes, Immediate starts it again. Park Loaded is the one that fires once when the park is opened.

Car Enters and Train Enters fire when a vehicle of a chosen ride reaches a tile. The event list also has every so many ticks, a new day, a breakdown, a crash, a guest spawning, the weather, staff, and variables.

Manual does not watch the park on its own. Something else has to fire it. Lift/Drop Track can do that, from its stage triggers.

Enabled turns a trigger off without deleting it.

Conditions are optional. They sit on the trigger and narrow when the event is allowed to fire. A car might enter the tile, and a condition might say this only counts when a variable equals 1. If you do not need a filter, leave conditions empty.

## Animations And Steps

Open an animation to edit its steps. They run from the top of the list downward.

Ticks Between Steps is the pause after one step finishes, before the next one starts. A tick is the smallest unit of in-game time. 0 means the next step runs straight away. A bigger number slows the sequence down. Experiment with it. A Wait step is different: that is a step you put in the list when the pause belongs in one particular place.

The two dropdowns above Add Step are a category, then the step. The categories are flow (wait, branch, custom Javascript), the animation's own context, variables, cars, trains, track, rides, guests, staff, scenery, land, path additions, the park, and the view. The Help button on a selected step says what that step does.

A lot of steps can use whatever started the animation (the trigger car, the trigger ride, the trigger tile) or a specific thing you pick. The eyedropper on those fields picks from the map.

## Variables

A variable is a named value saved with the park. Steps can change it, and conditions can test it. A step can also read a variable instead of a number, colour, or piece of text you type in.

A stored variable holds a value you set, and a reset value. A formula variable is recalculated from a formula. The formula box has its own instructions button. Reset Variables on the Variables tab puts each variable back to its reset value.

## Look Inside

Look Inside hides roofs so you can see inside a building. Show All, Hide All, and Cursor apply to every building in the list. Cursor hides the roof under the mouse and shows the others. The default shortcut for cycling those three is Shift+A.

Open a building to choose its tiles and roof pieces. You can use this tab while you are building, even if you never add a trigger.

## To-Dos

To-dos are notes for build progress. Each one has a name, a priority, an optional map tile, and whether it is done. Show Remaining On Map marks tiles that are not done yet. This tab works on its own, with no animations at all.

## Logs

This tab shows recent messages from the plugin, including triggers firing, animations starting or finishing, and errors. The dropdowns can limit the list to one trigger, one animation, or both. Clear Logs empties the list. Opening the Animator window sets both filters back to All.

## Saving

The next time you save the game, all of this is stored in the park's save file. Load that save later, with the plugin installed, and it comes back. If an animation was still running when you saved, it picks up from there.

The park should still open and be playable for someone who does not have the plugin. They just will not get the animations. If they install an older Animator than the one the park was saved with, the plugin warns that the park will not work as intended.
