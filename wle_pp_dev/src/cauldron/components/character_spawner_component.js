import { Component, Property } from "@wonderlandengine/api";
import { vec3_create } from "../../pp/plugin/js/extensions/array/vec_create_extension.js";
import { MathUtils } from "../../pp/cauldron/utils/math_utils.js";

export class CharacterSpawnerComponent extends Component {
    static TypeName = "character-spawner";
    static Properties = {
        _myRoomSize: Property.float(1.0),
        _myRoomHeight: Property.float(1.0),
        _myAmount: Property.int(1.0),
        _myTallPrototype: Property.object(),
        _myShortPrototype: Property.object()

    };

    start() {
        this._myRootObject = this.object.pp_addChild();

        for (let i = 0; i < this._myAmount; i++) {
            let spawnTall = MathUtils.randomBool();

            let character = null;

            if (spawnTall) {
                character = this._myTallPrototype.pp_clone();
            } else {
                character = this._myShortPrototype.pp_clone();
            }

            character.pp_setParent(this._myRootObject);
            let randomX = MathUtils.random(-this._myRoomSize, this._myRoomSize);
            let randomZ = MathUtils.random(-this._myRoomSize, this._myRoomSize);
            let y = this._myRoomHeight;

            character.pp_setPositionLocal(vec3_create(randomX, y, randomZ));

            character.pp_setActive(true);
        }
    }
}