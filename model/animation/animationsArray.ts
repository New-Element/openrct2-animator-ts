import Animation from "./animation";
import PersistentArray from "../data/persistentArray";
import {Colour} from "openrct2-flexui";
export default class AnimationsArray extends PersistentArray {
    animations: Animation[] = [];

    getItem(data): Animation {
        return new Animation(data);
    }

    getDataFromStorage(): object[] {
        return [
            {
                id: 'honey1unload',
                name: 'Unload honey pot 1',
                frameIntervalTicks: 50,
                numFrames: 2,
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
                        type: 'singleFrame',
                        index: 2,
                        actions: [
                            {
                                type: 'recolourTrain',
                                recolour: {
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
                frameIntervalTicks: 50,
                numFrames: 2,
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
                        type: 'singleFrame',
                        index: 2,
                        actions: [
                            {
                                type: 'recolourTrain',
                                recolour: {
                                    trim: Colour.BrightPurple
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }
}