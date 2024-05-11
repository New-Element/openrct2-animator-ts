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

    apply(target: StaticTarget): void {
        let x: number, y: number;
        this.setApplyState();
        for (x = this.tiles.from.x; x <= this.tiles.to.x; x += 1) {
            for (y = this.tiles.from.y; y <= this.tiles.to.y; y += 1) {
                this.applyToTile({x: x, y: y});
            }
        }
    }

    applyToTile(tile: TileCoords): void {
        let elements = map.getTile(tile.x, tile.y).elements,
            i: number,
            ln = elements.length,
            element;

        for (i = 0; i < ln; i += 1) {
            element = elements[i];
            if (element.object === this.object.index && element.type === this.object.type) {
                this.applyToElement(element, tile);
            }
        }
    }

    applyToElement(element, tile): void {
    }

}