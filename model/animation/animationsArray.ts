import Animation from "./animation";
import PersistentArray from "../data/persistentArray";

export default class AnimationsArray extends PersistentArray {
    items: Animation[] = [];
    namespace = 'animator';
    name = 'animationsv2';

    getItem(data): Animation {
        return new Animation(data);
    }

    /*getDataFromStorage(): object[] {
        let data = [
            {
                id: 'honey1unload',
                name: 'Unload honey pot 1',
                intervalTicks: 50,
                length: 5,
                trigger: {
                    type: 'rideEnters',
                    rideId: 34,
                    tile: {
                        x: 59,
                        y: 76
                    }
                },
                frames: [
                    {
                        index: 2,
                        actions: [
                            {
                                type: 'trainEditColour',
                                value: {
                                    trim: Colour.DarkBlue
                                }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'honey1load',
                name: 'Load honey pot 1',
                intervalTicks: 50,
                length: 5,
                trigger: {
                    type: 'rideEnters',
                    rideId: 34,
                    tile: {
                        x: 59,
                        y: 70
                    }
                },
                frames: [
                    {
                        index: 2,
                        actions: [
                            {
                                type: 'trainEditColour',
                                value: {
                                    trim: Colour.BrightPurple
                                },
                                target: 'animationTarget'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'makemistvisible',
                name: 'Make mist visible',
                intervalTicks: 1,
                length: -1,
                trigger: {
                    type: 'singleImmediate'
                },
                frames: [
                    {
                        index: 0,
                        actions: [
                            {
                                type: 'objectRecolour',
                                primaryColour: Colour.White,
                                secondaryColour: Colour.White,
                                tertiaryColour: Colour.White,
                                tiles: {
                                    from: {x: 50, y: 40},
                                    to: {x: 108, y: 81}
                                },
                                object: {
                                    type: 'small_scenery',
                                    index: 1326
                                }
                            },
                            {
                                type: 'objectSetVisibility',
                                value: true,
                                tiles: {
                                    from: {x: 50, y: 40},
                                    to: {x: 108, y: 81}
                                },
                                object: {
                                    type: 'small_scenery',
                                    index: 1326
                                }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'fademist',
                name: 'Fade mist',
                intervalTicks: 50,
                length: -1,
                trigger: {
                    type: 'singleImmediate'
                },
                frames: [
                    {
                        index: false,
                        minIndex: 1,
                        maxIndex: false,
                        actions: [
                            {
                                type: 'objectRecolour',
                                primaryColour: Colour.Invisible,
                                secondaryColour: Colour.Invisible,
                                tertiaryColour: Colour.Invisible,
                                tiles: {
                                    from: {x: 50, y: 40},
                                    to: {x: 108, y: 81}
                                },
                                object: {
                                    type: 'small_scenery',
                                    index: 1326
                                },
                                setHiddenIfInvisible: true,
                                randomize: {
                                    factor: 10,
                                    maxFactor: 100,
                                    viewport: {
                                        centerMul: 0.02,
                                        maxDistance: 5,
                                        outsideMul: 1,
                                        excludedMul: 1000,
                                        heightAdjust: true,
                                        zoomMultiply: true
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ];

        return data;
    }*/
}