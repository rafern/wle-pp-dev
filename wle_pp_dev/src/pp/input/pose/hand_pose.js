import { Timer } from "../../cauldron/cauldron/timer.js";
import { XRUtils } from "../../cauldron/utils/xr_utils.js";
import { quat_create, vec3_create } from "../../plugin/js/extensions/array/vec_create_extension.js";
import { Handedness, InputSourceType } from "../cauldron/input_types.js";
import { InputUtils } from "../cauldron/input_utils.js";
import { BasePose, BasePoseParams } from "./base_pose.js";

export class HandPoseParams extends BasePoseParams {

    constructor(engine) {
        super(engine);

        this.myFixTrackedHandRotation = true;

        /**
          * This can be used to make it so that when you put down the gamepads and tracked hands would be picked,  
          * the gamepads will still being used (if they exists) for a bit more before switching to hands (if they are still the best option)
         */
        this.mySwitchToTrackedHandDelayEnabled = false;

        this.mySwitchToTrackedHandDelay = 0;

        /**
         * Sadly, it can happen that when the game switches to hand tracking and we want to use the gamepad, the gamepad is  
         * not available in the tracked sources for a few frames
         * 
         * This "risky" fix keeps the gamepad previous references anyway for a few frames to give time to either appear or not in the tracked sources
         * This reference might be not valid anymore, even if it seems to always be working
         * 
         * If disabled, even if tracked hands are available, it will treat it as no input source have been found
         */
        this.mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled = false;
    }
}

export class HandPose extends BasePose {

    static _mySwitchToTrackedHandDelayNoInputSourceKeepPreviousGamepadReferenceFrameAmount = 3;

    constructor(handedness, handPoseParams = new HandPoseParams()) {
        super(handPoseParams);

        this._myInputSource = null;
        this._myLastGamepadInputSource = null;
        this._myRealInputSource = null;
        this._myGamepadWasUsedFrameCounter = 0;
        this._myInputSourceChangeDirty = false;

        this._myHandedness = handedness;
        this._myFixTrackedHandRotation = handPoseParams.myFixTrackedHandRotation;

        this._mySwitchToTrackedHandDelayEnabled = handPoseParams.mySwitchToTrackedHandDelayEnabled;
        this._mySwitchToTrackedHandDelay = handPoseParams.mySwitchToTrackedHandDelay;
        this._mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled = handPoseParams.mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled;
        this._mySwitchToTrackedHandTimer = new Timer(this._mySwitchToTrackedHandDelay, false);
        this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter = 0;
        this._myDisableSwitchToTrackedHandDelaySessionChangeTimer = new Timer(1, false);

        this._myTrackedHand = false;

        this._myInputSourcesChangeEventListener = null;
        this._myVisibilityChangeEventListener = null;
    }

    getHandedness() {
        return this._myHandedness;
    }

    getInputSource() {
        return this._myInputSource;
    }

    getInputSourceType() {
        if (this._myInputSource == null) {
            return null;
        }

        return InputUtils.getInputSourceType(this._myInputSource);
    }

    getInputSourceReal() {
        return this._myRealInputSource;
    }

    getInputSourceTypeReal() {
        if (this._myRealInputSource == null) {
            return null;
        }

        return InputUtils.getInputSourceType(this._myRealInputSource);
    }

    isFixTrackedHandRotation() {
        return this._myFixTrackedHandRotation;
    }

    setFixTrackedHandRotation(fixTrackedHandRotation) {
        this._myFixTrackedHandRotation = fixTrackedHandRotation;
    }

    isSwitchToTrackedHandDelayEnabled() {
        return this._mySwitchToTrackedHandDelayEnabled;
    }

    setSwitchToTrackedHandDelayEnabled(switchToTrackedHandDelayEnabled) {
        this._mySwitchToTrackedHandDelayEnabled = switchToTrackedHandDelayEnabled;
    }

    getSwitchToTrackedHandDelay() {
        return this._mySwitchToTrackedHandDelay;
    }

    setSwitchToTrackedHandDelay(switchToTrackedHandDelay) {
        this._mySwitchToTrackedHandDelay = switchToTrackedHandDelay;
    }

    isSwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled() {
        return this._mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled;
    }

    setSwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled(switchToTrackedHandDelayNoInputSourceRiskyFixEnabled) {
        this._mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled = switchToTrackedHandDelayNoInputSourceRiskyFixEnabled;
    }

    getRotationQuat(out = quat_create(), referenceObjectOverride = undefined) {
        // Implemented outside class definition
    }

    _isReadyToGetPose() {
        return this._myInputSource != null;
    }

    _getPose(xrFrame) {
        return xrFrame.getPose(this._myInputSource.gripSpace, this.getReferenceSpace());
    }

    _preUpdate(dt) {
        if (this._mySwitchToTrackedHandDelayEnabled) {
            if (this._myGamepadWasUsedFrameCounter > 0) {
                this._myGamepadWasUsedFrameCounter--;
                if (this._myGamepadWasUsedFrameCounter == 0) {
                    this._myLastGamepadInputSource = null;
                }
            }

            if (this._myInputSourceChangeDirty) {
                this._myInputSourceChangeDirty = false;
                this._myInputSourcesChangeEventListener();
            }

            if (this._mySwitchToTrackedHandTimer.isRunning()) {
                this._mySwitchToTrackedHandTimer.update(dt);
                if (this._mySwitchToTrackedHandTimer.isDone()) {
                    if (this._myInputSourcesChangeEventListener != null) {
                        const switchToTrackedHandDelayEnabledBackup = this._mySwitchToTrackedHandDelayEnabled;
                        this._mySwitchToTrackedHandDelayEnabled = false;
                        this._myInputSourcesChangeEventListener();
                        this._mySwitchToTrackedHandDelayEnabled = switchToTrackedHandDelayEnabledBackup;
                    }
                }
            }

            if (this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter > 0) {
                this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter--;
            } else {
                this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.update(dt);
            }
        }
    }

    _setActiveHook(active) {
        if (this.isActive() != active) {
            if (!active) {
                this._myInputSource = null;
                this._myLastGamepadInputSource = null;
                this._myRealInputSource = null;
                this._myGamepadWasUsedFrameCounter = 0;
                this._myInputSourceChangeDirty = false;

                this._mySwitchToTrackedHandTimer.reset();
                this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter = 0;
                this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.reset();

                this._myTrackedHand = false;

                XRUtils.getSession(this.getEngine())?.removeEventListener("inputsourceschange", this._myInputSourcesChangeEventListener);
                XRUtils.getSession(this.getEngine())?.removeEventListener("visibilitychange", this._myVisibilityChangeEventListener);
            }
        }
    }

    _onXRSessionStartHook(manualCall, session) {
        if (this._mySwitchToTrackedHandDelayEnabled) {
            this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter = 10;
            this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.start();
        }

        this._myInputSourcesChangeEventListener = () => {
            if (this._mySwitchToTrackedHandDelayEnabled) {
                if (this._mySwitchToTrackedHandDelay > 0 && session.trackedSources != null &&
                    this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter == 0 && !this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.isRunning()) {
                    const currentInputSourceType = this._myRealInputSource != null ? InputUtils.getInputSourceType(this._myRealInputSource) : null;
                    if (currentInputSourceType == InputSourceType.GAMEPAD) {
                        this._myGamepadWasUsedFrameCounter = HandPose._mySwitchToTrackedHandDelayNoInputSourceKeepPreviousGamepadReferenceFrameAmount;
                        this._myLastGamepadInputSource = this._myRealInputSource;
                    }
                }
            }

            this._myRealInputSource = null;
            this._myInputSource = null;
            this._myTrackedHand = false;

            if (session.inputSources != null) {
                for (const inputSource of session.inputSources) {
                    if (inputSource.handedness == this._myHandedness) {
                        this._myRealInputSource = inputSource;
                        this._myInputSource = inputSource;
                        this._myTrackedHand = InputUtils.getInputSourceType(this._myInputSource) == InputSourceType.TRACKED_HAND;

                        break;
                    }
                }
            }

            if (this._mySwitchToTrackedHandDelayEnabled) {
                let resetSwitchToTrackedHandTimer = true;

                let extraSourcesCheckForGamepad = false;
                if (this._myGamepadWasUsedFrameCounter > 0 && (this._myInputSource == null || this._myTrackedHand)) {
                    extraSourcesCheckForGamepad = true;
                }

                if (extraSourcesCheckForGamepad) {
                    const inputSourcesToCheck = [];

                    if (session.inputSources != null) {
                        inputSourcesToCheck.push(...session.inputSources);
                    }

                    if (session.trackedSources != null) {
                        inputSourcesToCheck.push(...session.trackedSources);
                    }

                    let gamepadFound = false;
                    for (const inputSourceToCheck of inputSourcesToCheck) {
                        if (inputSourceToCheck.handedness == this._myHandedness) {
                            const inputSourceToCheckType = InputUtils.getInputSourceType(inputSourceToCheck);
                            if (inputSourceToCheckType == InputSourceType.GAMEPAD) {
                                this._myRealInputSource = inputSourceToCheck;
                                this._myInputSource = inputSourceToCheck;
                                this._myTrackedHand = false;

                                resetSwitchToTrackedHandTimer = false;
                                if (!this._mySwitchToTrackedHandTimer.isRunning()) {
                                    this._mySwitchToTrackedHandTimer.start(this._mySwitchToTrackedHandDelay);
                                }

                                gamepadFound = true;

                                break;
                            }
                        }
                    }

                    if (!gamepadFound) {
                        // Sadly the gamepad might be added in the tracked source only at the end of this callback
                        this._myInputSourceChangeDirty = true;

                        if (this._mySwitchToTrackedHandDelayNoInputSourceRiskyFixEnabled) {
                            this._myInputSource = this._myLastGamepadInputSource;
                            this._myTrackedHand = false;
                        } else {
                            this._myInputSource = null;
                            this._myTrackedHand = false;
                        }
                    }
                }

                if (resetSwitchToTrackedHandTimer) {
                    this._mySwitchToTrackedHandTimer.reset();
                }
            }
        };

        this._myInputSourcesChangeEventListener();

        session.addEventListener("inputsourceschange", this._myInputSourcesChangeEventListener);

        this._myVisibilityChangeEventListener = () => {
            this._myGamepadWasUsedFrameCounter = 0;
            this._myLastGamepadInputSource = null;

            this._myInputSourceChangeDirty = false;

            this._mySwitchToTrackedHandTimer.reset();

            if (this._mySwitchToTrackedHandDelayEnabled) {
                this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter = 10;
                this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.start();
            }
        };

        session.addEventListener("visibilitychange", this._myVisibilityChangeEventListener);
    }

    _onXRSessionEndHook() {
        this._myGamepadWasUsedFrameCounter = 0;
        this._myLastGamepadInputSource = null;

        this._myRealInputSource = null;
        this._myInputSource = null;
        this._myTrackedHand = false;

        this._myInputSourceChangeDirty = false;

        this._mySwitchToTrackedHandTimer.reset();
        this._myDisableSwitchToTrackedHandDelaySessionChangeFrameCounter = 0;
        this._myDisableSwitchToTrackedHandDelaySessionChangeTimer.reset();

        this._myInputSourcesChangeEventListener = null;
        this._myVisibilityChangeEventListener = null;
    }
}



// IMPLEMENTATION

HandPose.prototype.getRotationQuat = function () {
    let playerRotationQuat = quat_create();
    let up = vec3_create();
    let right = vec3_create();
    let forward = vec3_create();
    return function getRotationQuat(out = quat_create(), referenceObjectOverride = undefined) {
        let referenceObject = referenceObjectOverride === undefined ? this._myReferenceObject : referenceObjectOverride;

        out.quat_copy(this._myRotationQuat);

        if (this._myForwardFixed) {
            out.quat_rotateAxisRadians(Math.PI, out.quat_getUp(up), out);
        }

        if (this._myFixTrackedHandRotation && this._myTrackedHand) {
            out.quat_rotateAxis(-60, out.quat_getRight(right), out);

            let forwardRotation = 20;
            forwardRotation = (this._myHandedness == Handedness.LEFT) ? forwardRotation : -forwardRotation;
            out.quat_rotateAxis(forwardRotation, out.quat_getForward(forward), out);
        }

        if (referenceObject == null) {
            return out;
        }

        return out.quat_toWorld(referenceObject.pp_getRotationQuat(playerRotationQuat), out);
    };
}();