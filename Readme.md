# OpenRCT2 Animator

## v0.0.2

This animator plugin is very much a work in progress.

The goal of the project is to unlock previously impossible to do animations and interactions in the game between rides and objects - another tool for parkmakers to use to innovate with, along with CTRs, object creation, palletes and all the other wonderful things we all love to mess with.

Right now, the way that animations are entered is quite cumbersome. In the future, I plan on (hopefully!) working with others in the community to build out a user interface that works the same way as the excellent Scenery Manager or Ride Vehicle Editor plugins.

## How to Enter Animations

Animations are entered in JSON form. If you have never come across JSON before, read [this guide from Mozilla](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON) first.

1. Click on the map icon in the game.
2. Click "Animator"
3. Paste your JSON animations into the text field. The JSON needs to be pasted in *as a single  line*. It'll look ugly and overflow the box. That's fine.
4. Exit the window.
5. Your animations will now start running.

Next time you save the game, the animations will be saved into the park's save file. To run these animations on subsequent loads of the save file, the plugin must be installed. Make sure that the park still works and is functional for anyone who does not have the plugin installed.

## How to Write Animations

The JSON for your animations is going to be a list of animation objects.


It might just be one animation:

> [ { ..animation.. } ]

Or more:

> [ { ..animation 1.. }, { ..animation 2.. } ... ]

Each animation must have the following keys:

- "id": a string of a unique identifier for this animation. It's best to keep this all text, numbers and hyphens.
- "name": a human-readable name for the animation.
- "intervalTicks": a tick is the smallest in-game currency of time. This controls how many ticks are between each frame in your animation. 1 will lead to cycling through frames very fast. 100 would be a lot slower. Experiment with this to get the right pacing to your animations.
- "length": how many frames in your animation exist. Set to -1 for an animation that lasts forever.
- "trigger": detailed below. This controls what makes your animation begin.
- "frames": detailed below. This controls what your animation actually does.

### Animation Triggers

Each trigger is an object with keys:
- "type": currently supported are "rideEnters" and "singleImmediate"

#### Single Immediate Trigger

There are no further options if you set the trigger to "singleImmediate" - the animation will begin running as soon as the animations are loaded. This is an ideal setting for an animation you want to run once when the park is opened, or continuously throughout.

#### Ride Enters Trigger

The following keys must then be specified:
- "rideId": the in-game integer that represents the ride that will trigger this object. Levis' Ride Editor plugin does a great job of indexing all rides by these numbers.
- "tile": x and y co-ordinates for a tile that, when a train of that rideId enters, will trigger the start of the animation.

### Frames

Each frame is an object with the following keys:
- "index": a 0-based frame count on which to run the animation. If the animation's current frame is this number, this frame will be run.
- "minIndex"/"maxIndex": alternatively to index, you can provide minIndex and maxIndex. These can either be set to false or an integer. If false, the check will pass. If an integer, the frame must pass this min or max index. It's inclusive, so on frame 3, a minIndex of 3 will lead to the animation running.
- "actions": an array of actions to apply in this frame, detailed below.

### Actions

Each action is an object with the following keys:
- "type": currently supported are "trainEditColour", "objectRecolour", and "objectSetVisibility".

#### trainEditColour

This action recolours whole trains.

This action can only work with a trigger that is associated with a specific train, e.g. "rideEnters".

Additional keys are:
- "body": a colour integer
- "trim": a colour integer
- "tertiary": a colour integer

It is not necessary to specify all 3 - any combination can be specified without the others.

#### objectRecolour

This action recolours objects that match the provided search.

Additional keys are:
- "primaryColour": a colour integer
- "secondaryColour": a colour integer
- "tertiaryColour": a colour integer
- "tiles": a range of tiles over which to apply these colour changes. An object with "from" and "to" keys, each of which has "x" and "y" keys referring to a specific tile. The plugin draws a square between these two tiles and applies the effect within that square, inclusive to its boundaries.
- "object": refers to the in-game object to recolour. This is a JSON object with keys "type" which must be set to "small_scenery", "large_scenery" or "wall", and an "index", which is a number referring to the slot in which that object is loaded. Inspect the object in the tile inspector to find its index slot number.

#### objectSetVisibility

This action toggles the visibility of objects the same way that is possible in the tile inspector.

- "value": true or false, to show or hide the object respectively.
- "tiles": a range of tiles over which to apply these colour changes. An object with "from" and "to" keys, each of which has "x" and "y" keys referring to a specific tile. The plugin draws a square between these two tiles and applies the effect within that square, inclusive to its boundaries.
- "object": refers to the in-game object to recolour. This is a JSON object with keys "type" which must be set to "small_scenery", "large_scenery" or "wall", and an "index", which is a number referring to the slot in which that object is loaded. Inspect the object in the tile inspector to find its index slot number.

### Examples

Lastly, as an example, here is the set of animations for the park Sambhava's Rest:

> [
{
"id": "honey1unload",
"name": "Unload honey pot 1",
"intervalTicks": 50,
"length": 5,
"trigger": {
"type": "rideEnters",
"rideId": 34,
"tile": {
"x": 59,
"y": 76
}
},
"frames": [
{
"index": 2,
"actions": [
{
"type": "trainEditColour",
"value": {
"trim": 6
}
}
]
}
]
},
{
"id": "honey1load",
"name": "Load honey pot 1",
"intervalTicks": 50,
"length": 5,
"trigger": {
"type": "rideEnters",
"rideId": 34,
"tile": {
"x": 59,
"y": 70
}
},
"frames": [
{
"index": 2,
"actions": [
{
"type": "trainEditColour",
"value": {
"trim": 5
}
}
]
}
]
},
{
"id": "makemistvisible",
"name": "Make mist visible",
"intervalTicks": 1,
"length": -1,
"trigger": {
"type": "singleImmediate"
},
"frames": [
{
"index": 0,
"actions": [
{
"type": "objectRecolour",
"primaryColour": 2,
"secondaryColour": 2,
"tertiaryColour": 2,
"tiles": {
"from": {
"x": 50,
"y": 40
},
"to": {
"x": 108,
"y": 81
}
},
"object": {
"type": "small_scenery",
"index": 1326
}
},
{
"type": "objectSetVisibility",
"tiles": {
"from": {
"x": 50,
"y": 40
},
"to": {
"x": 108,
"y": 81
}
},
"object": {
"type": "small_scenery",
"index": 1326
},
"value": true
}
]
}
]
},
{
"id": "fademist",
"name": "Fade mist",
"intervalTicks": 50,
"length": -1,
"trigger": {
"type": "singleImmediate"
},
"frames": [
{
"index": false,
"minIndex": 1,
"maxIndex": false,
"actions": [
{
"type": "objectRecolour",
"primaryColour": 54,
"secondaryColour": 54,
"tertiaryColour": 54,
"tiles": {
"from": {
"x": 50,
"y": 40
},
"to": {
"x": 108,
"y": 81
}
},
"object": {
"type": "small_scenery",
"index": 1326
},
"randomize": {
"factor": 10,
"maxFactor": 100,
"viewport": {
"centerMul": 0.02,
"maxDistance": 13,
"outsideMul": 1,
"excludedMul": 20,
"heightAdjust": true,
"zoomMultiply": true
}
},
"setHiddenIfInvisible": true
}
]
}
]
}
]