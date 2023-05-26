import { Component, PhysXComponent } from "@wonderlandengine/api";
import { Timer } from "../../pp/cauldron/cauldron/timer";
import { PhysicsUtils } from "../../pp/cauldron/physics/physics_utils";
import { Globals } from "../../pp/pp/globals";
import { GamepadButtonID } from "../../pp/input/gamepad/gamepad_buttons";
import { vec3_create } from "../../pp/plugin/js/extensions/array_extension";

export class KinematicFalseAfterTrueComponent extends Component {
    static TypeName = "kinematic-false-after-true";
    static Properties = {};

    start() {
        this._myPhysX = this.object.pp_getComponent(PhysXComponent);
    }

    update(dt) {
        if (Globals.getLeftGamepad(this.engine).getButtonInfo(GamepadButtonID.SELECT).isPressEnd()) {
            console.error("old kinematic:", this._myPhysX.kinematic);
            this._myPhysX.kinematic = true;
            this.object.pp_translate([0, 2, 0]);
            this._myPhysX.kinematic = false;
            console.error("new kinematic:", this._myPhysX.kinematic);
        }
    }
}