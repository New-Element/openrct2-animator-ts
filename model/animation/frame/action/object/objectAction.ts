/// <reference path="./../../../../../openrct2.d.ts" />

import Action from "../action";
import {StaticTarget} from "../../../animationTarget";
import TileCoords from "../../../../../game/tileCoords";

export default class ObjectAction extends Action {

    tiles: {
        from: TileCoords,
        to: TileCoords
    };
    object: {
        index: number,
        type: string
    };

    applyState: {
        viewport: {
            zoom: number,
            rotation: number,
            center: TileCoords
        }
    };


    getDataToPersist(): object {
        return {
            type: this.type,
            tiles: this.tiles,
            object: this.object
        };
    }

    setApplyState(): void {
        let centrePosition = ui.mainViewport.getCentrePosition();
        this.applyState = {
            viewport: {
                center: {
                    x: centrePosition.x / 32,
                    y: centrePosition.y / 32
                },
                zoom: ui.mainViewport.zoom,
                rotation: ui.mainViewport.rotation
            }
        };
    }

    findElements(): object[] {
        let x: number, y: number,
            elements: object[],
            i: number,
            ln: number,
            element,
            found: object[] = [];
        for (x = this.tiles.from.x; x <= this.tiles.to.x; x += 1) {
            for (y = this.tiles.from.y; y <= this.tiles.to.y; y += 1) {
                elements = elements = map.getTile(x, y).elements;
                ln = elements.length;
                for (i = 0; i < ln; i += 1) {
                    element = elements[i];
                    if (element.object === this.object.index && element.type === this.object.type) {
                        found.push({ element: element, tile: {x: x, y: y }});
                    }
                }
            }
        }

        return found;
    }

    apply(target: StaticTarget): void {
        this.setApplyState();
        let elements = this.findElements(),
            ln = elements.length, i: number, element;
        for (i = 0; i < ln; i += 1) {
            element = elements[i];
            this.applyToElement(element.element, element.tile);
        }
    }

    applyToElement(element, tile): void {
    }

}