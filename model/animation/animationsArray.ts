import Animation from "./animation";
import PersistentArray from "../data/persistentArray";
import { Colour } from "openrct2-flexui";
export default class AnimationsArray extends PersistentArray {
    items: Animation[] = [];

    getItem(data): Animation {
        return new Animation(data);
    }

    getDataFromStorage(): object[] {
        return [
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
            }
        ];
    }
}