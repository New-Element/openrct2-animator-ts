/// <reference path="./../../../../../openrct2.d.ts" />

import ObjectAction from "./objectAction";

export default class ObjectSetVisibilityAction extends ObjectAction {

    value: true;


    getDataToPersist(): object {
        return {
            type: this.type,
            tiles: this.tiles,
            object: this.object,
            value: this.value
        };
    }

    applyToElement(element, tile): void {
        element.isHidden = !this.value;
    }

}