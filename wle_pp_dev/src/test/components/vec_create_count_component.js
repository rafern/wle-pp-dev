
import { Component } from "@wonderlandengine/api";
import { Timer } from "../../pp/cauldron/cauldron/timer.js";
import { Mat4Utils } from "../../pp/cauldron/utils/array/mat4_utils.js";
import { Quat2Utils } from "../../pp/cauldron/utils/array/quat2_utils.js";
import { QuatUtils } from "../../pp/cauldron/utils/array/quat_utils.js";
import { Vec3Utils } from "../../pp/cauldron/utils/array/vec3_utils.js";

export class VecCreateCountComponent extends Component {
    static TypeName = "vec-create-count";

    init() {
        if (this.markedActive) {
            this._myDebugWithPP = true;

            this._myVec3CreateCall = 0;

            let oldVec3 = Vec3Utils.create;
            Vec3Utils.create = function create() {
                this._myVec3CreateCall++;
                return oldVec3(...arguments);
            }.bind(this);

            this._myQuatCreateCall = 0;

            let oldQuat = QuatUtils.create;
            QuatUtils.create = function create() {
                this._myQuatCreateCall++;
                return oldQuat(...arguments);
            }.bind(this);

            this._myQuat2CreateCall = 0;

            let oldQuat2 = Quat2Utils.create;
            Quat2Utils.create = function create() {
                this._myQuat2CreateCall++;
                return oldQuat2(...arguments);
            }.bind(this);

            this._myMat4CreateCall = 0;

            let oldMat4 = Mat4Utils.create;
            Mat4Utils.create = function create() {
                this._myMat4CreateCall++;
                return oldMat4(...arguments);
            }.bind(this);

            this._myTimer = new Timer(1);
        }
    }

    update(dt) {
        this._myTimer.update(dt);
        if (this._myTimer.isDone()) {
            this._myTimer.start();

            if (this._myDebugWithPP) {
                console.error("vec3 call:", this._myVec3CreateCall);
                console.error("mat4 call:", this._myMat4CreateCall);
                console.error("quat2 call:", this._myQuat2CreateCall);
                console.error("quat call:", this._myQuatCreateCall);
                console.error("");
            }
        }
        this._myVec3CreateCall = 0;
        this._myQuatCreateCall = 0;
        this._myQuat2CreateCall = 0;
        this._myMat4CreateCall = 0;
    }
}
