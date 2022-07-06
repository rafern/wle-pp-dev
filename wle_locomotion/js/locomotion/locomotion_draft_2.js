WL.registerComponent('locomotion-draft-2', {
    _myMaxSpeed: { type: WL.Type.Float, default: 2 },
    _myMaxRotationSpeed: { type: WL.Type.Float, default: 100 },
    _myIsSnapTurn: { type: WL.Type.Bool, default: true },
    _mySnapTurnAngle: { type: WL.Type.Float, default: 30 },
    _myFlyEnabled: { type: WL.Type.Bool, default: false },
    _myMinAngleToFly: { type: WL.Type.Float, default: 45 },
    _myDirectionReference: { type: WL.Type.Enum, values: ['head', 'hand left', 'hand right'], default: 'hand left' }
}, {
    init() {
    },
    start() {
        this._myCurrentHeadObject = PP.myPlayerObjects.myNonVRHead;
        PP.myPlayerObjects.myNonVRCamera = PP.myPlayerObjects.myNonVRCamera;

        this._myDirectionReferenceObject = PP.myPlayerObjects.myHead;

        if (WL.xrSession) {
            this._onXRSessionStart(WL.xrSession);
        }
        WL.onXRSessionStart.push(this._onXRSessionStart.bind(this));
        WL.onXRSessionEnd.push(this._onXRSessionEnd.bind(this));

        this._mySessionChangeResyncHeadTransform = null;

        this._myBlurRecoverHeadTransform = null;
        this._myBlurRecoverPlayerUp = null;

        this._myDelaySessionChangeResyncCounter = 0;
        this._myDelayBlurEndResyncCounter = 0;
        this._myDelayBlurEndResyncTimer = new PP.Timer(5, false);
        this._myVisibilityWentHidden = false;
        this._mySessionActive = false;

        this._myStickIdleCount = 0;

        this._myRemoveUp = true;
        this._myRemoveXTilt = true;
        this._myPreventHeadUpsideDown = true;

        this._mySnapDone = false;

        this._myCollisionCheck = new CollisionCheck();

        this._myKeyboardGamepad = new KeyboardGamepad();
        this._myKeyboardGamepad.start();

        this._myDirectionConverter = new Direction2DTo3DConverter(this._myFlyEnabled, this._myMinAngleToFly);
    },
    update(dt) {
        this._myKeyboardGamepad.update(dt);

        if (this._myDelaySessionChangeResyncCounter > 0) {
            this._myDelaySessionChangeResyncCounter--;
            if (this._myDelaySessionChangeResyncCounter == 0) {
                this._sessionChangeResync();
            }
        }

        if (this._myDelayBlurEndResyncCounter > 0 && !this._myDelayBlurEndResyncTimer.isRunning()) {
            this._myDelayBlurEndResyncCounter--;
            if (this._myDelayBlurEndResyncCounter == 0) {
                this._blurEndResync();
            }
        }

        if (this._myDelayBlurEndResyncTimer.isRunning()) {
            if (this._myDelayBlurEndResyncCounter > 0) {
                this._myDelayBlurEndResyncCounter--;
            } else {
                this._myDelayBlurEndResyncTimer.update(dt);
                if (this._myDelayBlurEndResyncTimer.isDone()) {
                    this._blurEndResync();
                }
            }
        }

        let skipLocomotion = this._myDelaySessionChangeResyncCounter > 0 || this._myDelayBlurEndResyncCounter > 0 || this._myDelayBlurEndResyncTimer.isRunning();
        if (!skipLocomotion) {
            let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();

            let headMovement = [0, 0, 0];

            {
                let axes = [0, 0];

                axes = PP.myLeftGamepad.getAxesInfo().getAxes();

                let minIntensityThreshold = 0.1;
                if (axes.vec2_length() > minIntensityThreshold) {
                    this._myStickIdleCount = 2;
                    let direction = this._myDirectionConverter.convert(axes, this._myDirectionReferenceObject.pp_getTransform(), playerUp);
                    if (this._myKeyboardGamepad.isSpacePressed()) {
                        direction.vec3_add([0, 1, 0], direction);
                    }

                    if (direction.vec3_length() > 0.0001) {
                        direction.vec3_normalize(direction);

                        this._myIsFlying = this._myIsFlying || direction.vec3_componentAlongAxis(playerUp).vec3_length() > 0.0001;

                        let movementIntensity = axes.vec2_length();
                        let speed = Math.pp_lerp(0, this._myMaxSpeed, movementIntensity);

                        direction.vec3_scale(speed * dt, headMovement);
                    }
                } else {
                    if (this._myStickIdleCount > 0) {
                        this._myStickIdleCount--;
                        if (this._myStickIdleCount == 0) {
                            this._myDirectionConverter.reset();
                        }
                    }
                }
            }

            let movementToApply = headMovement;
            if (!this._myIsFlying) {
                movementToApply.vec3_add(playerUp.vec3_scale(-2 * dt), movementToApply);
            }
            movementToApply = this._myCollisionCheck.fixMovement(headMovement);

            if (movementToApply.vec3_length() > 0.00001) {
                this._moveHead(movementToApply);
            }

            let headRotation = PP.quat_create();
            {
                axes = PP.myRightGamepad.getAxesInfo().getAxes();

                if (!this._myIsSnapTurn) {
                    let minIntensityThreshold = 0.1;
                    if (Math.abs(axes[0]) > minIntensityThreshold) {
                        let axis = PP.myPlayerObjects.myPlayer.pp_getUp();

                        let rotationIntensity = -axes[0];
                        let speed = Math.pp_lerp(0, this._myMaxRotationSpeed, rotationIntensity);

                        headRotation.quat_fromAxis(speed * dt, axis);
                    }
                } else {
                    if (this._mySnapDone) {
                        let stickThreshold = 0.4;
                        if (Math.abs(axes[0]) < stickThreshold) {
                            this._mySnapDone = false;
                        }
                    } else {
                        let stickThreshold = 0.5;
                        if (Math.abs(axes[0]) > stickThreshold) {
                            let axis = PP.myPlayerObjects.myPlayer.pp_getUp();

                            let rotation = -Math.pp_sign(axes[0]) * this._mySnapTurnAngle;
                            headRotation.quat_fromAxis(rotation, axis);

                            this._mySnapDone = true;
                        }
                    }
                }
            }

            if (headRotation.quat_getAngle() > 0.00001) {
                this._rotateHead(headRotation);
            }

            if (this._myCollisionCheck.isOnGround()) {
                this._myIsFlying = false;
                this._myDirectionConverter.stopFlying();
            }
        }
    },
    _moveHead(movement) {
        PP.myPlayerObjects.myPlayer.pp_translate(movement);
    },
    _rotateHead(rotation) {
        let currentHeadPosition = this._myCurrentHeadObject.pp_getPosition();

        PP.myPlayerObjects.myPlayer.pp_rotateAroundQuat(rotation, this._myCurrentHeadObject.pp_getPosition());

        let newHeadPosition = this._myCurrentHeadObject.pp_getPosition();
        let adjustmentMovement = currentHeadPosition.vec3_sub(newHeadPosition);

        this._moveHead(adjustmentMovement);
    },
    _teleportHead(teleportPosition, teleportRotation) {
        this._teleportHeadPosition(teleportPosition);

        let currentHeadRotation = this._myCurrentHeadObject.pp_getRotationQuat();
        let teleportRotationToPerform = currentHeadRotation.quat_rotationToQuat(teleportRotation);
        this._rotateHead(teleportRotationToPerform);
    },
    _teleportHeadPosition(teleportPosition) {
        let currentHeadPosition = this._myCurrentHeadObject.pp_getPosition();
        let teleportMovementToPerform = teleportPosition.vec3_sub(currentHeadPosition);
        this._moveHead(teleportMovementToPerform);
    },
    _onXRSessionStart(session) {
        this._myBlurRecoverHeadTransform = null;
        this._myBlurRecoverPlayerUp = null;
        this._myVisibilityWentHidden = false;

        this._myDelaySessionChangeResyncCounter = 0;
        this._myDelayBlurEndResyncCounter = 0;
        this._myDelayBlurEndResyncTimer.reset();

        session.requestReferenceSpace(WebXR.refSpace).then(function (referenceSpace) {
            if (referenceSpace.addEventListener != null) {
                referenceSpace.addEventListener("reset", this._onViewReset.bind(this));
            }
        }.bind(this));

        session.addEventListener('visibilitychange', function (event) {
            if (event.session.visibilityState != "visible") {
                this._onXRSessionBlurStart(event.session);
            } else {
                this._onXRSessionBlurEnd(event.session);
            }
        }.bind(this));

        if (this._myDelaySessionChangeResyncCounter == 0) {
            let previousHeadObject = this._myCurrentHeadObject;
            this._mySessionChangeResyncHeadTransform = previousHeadObject.pp_getTransformQuat();
        }

        this._myDelaySessionChangeResyncCounter = 2;

        this._mySessionActive = true;

        this._myCurrentHeadObject = PP.myPlayerObjects.myVRHead;

        if (this._myDirectionReference == 0) {
            this._myDirectionReferenceObject = PP.myPlayerObjects.myHead;
        } else if (this._myDirectionReference == 1) {
            this._myDirectionReferenceObject = PP.myPlayerObjects.myHandLeft;
        } else {
            this._myDirectionReferenceObject = PP.myPlayerObjects.myHandRight;
        }

        //console.error("session start");
    },
    _onXRSessionEnd(session) {
        if (this._myDelaySessionChangeResyncCounter == 0) {
            let previousHeadTransform = this._myCurrentHeadObject.pp_getTransformQuat();

            if (this._myBlurRecoverHeadTransform != null) {
                let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
                if (playerUp.vec3_angle(this._myBlurRecoverPlayerUp) == 0) {
                    previousHeadTransform = this._myBlurRecoverHeadTransform;
                }
            }

            this._mySessionChangeResyncHeadTransform = previousHeadTransform;
        }

        this._myDelaySessionChangeResyncCounter = 2;

        this._myBlurRecoverHeadTransform = null;
        this._myBlurRecoverPlayerUp = null;
        this._myVisibilityWentHidden = false;

        this._myDelayBlurEndResyncCounter = 0;
        this._myDelayBlurEndResyncTimer.reset();

        this._mySessionActive = false;

        this._myCurrentHeadObject = PP.myPlayerObjects.myNonVRHead;

        this._myDirectionReferenceObject = PP.myPlayerObjects.myHead;

        //console.error("session end");
    },
    _onXRSessionBlurStart(session) {
        if (this._myBlurRecoverHeadTransform == null && this._mySessionActive) {
            if (this._myDelaySessionChangeResyncCounter > 0) {
                this._myBlurRecoverHeadTransform = this._mySessionChangeResyncHeadTransform;
                this._myBlurRecoverPlayerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
            } else {
                this._myBlurRecoverHeadTransform = this._myCurrentHeadObject.pp_getTransformQuat();
                this._myBlurRecoverPlayerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
            }
        } else if (!this._mySessionActive) {
            this._myBlurRecoverHeadTransform = null;
            this._myBlurRecoverPlayerUp = null;
        }

        this._myVisibilityWentHidden = this._myVisibilityWentHidden || session.visibilityState == "hidden";

        //console.error("blur start", session.visibilityState);
    },
    _onXRSessionBlurEnd(session) {
        if (this._myDelaySessionChangeResyncCounter == 0) {
            if (this._myBlurRecoverHeadTransform != null && this._mySessionActive) {
                let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
                if (playerUp.vec3_angle(this._myBlurRecoverPlayerUp) == 0) {
                    this._myDelayBlurEndResyncCounter = 2;
                    if (this._myVisibilityWentHidden) {
                        //this._myDelayBlurEndResyncTimer.start();
                    }
                } else {
                    this._myBlurRecoverHeadTransform = null;
                    this._myBlurRecoverPlayerUp = null;
                }
            } else {
                this._myBlurRecoverHeadTransform = null;
                this._myBlurRecoverPlayerUp = null;
            }
        } else {
            this._myDelaySessionChangeResyncCounter = 2;

            this._myBlurRecoverHeadTransform = null;
            this._myBlurRecoverPlayerUp = null;
        }

        //console.error("blur end");
    },
    _onViewReset() {
        if (this._mySessionActive) {
            //console.error("reset");
            this._teleportPlayerTransform(this._myCurrentHeadObject.pp_getTransformQuat());
        }
    },
    _blurEndResync() {
        if (this._myBlurRecoverHeadTransform != null) {
            let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
            if (playerUp.vec3_angle(this._myBlurRecoverPlayerUp) == 0) {
                let headHeight = this._getHeadHeight(this._myCurrentHeadObject.pp_getPosition());
                let recoverHeadHeight = this._getHeadHeight(this._myBlurRecoverHeadTransform.quat2_getPosition());

                let recoverHeadPosition = this._myBlurRecoverHeadTransform.quat2_getPosition();
                let newHeadPosition = recoverHeadPosition.vec3_add(playerUp.vec3_scale(headHeight - recoverHeadHeight));

                let recoverHeadForward = this._myBlurRecoverHeadTransform.quat2_getAxes()[2];
                let currentHeadForward = this._myCurrentHeadObject.pp_getForward();
                let rotationToPerform = currentHeadForward.vec3_rotationToPivotedQuat(recoverHeadForward, playerUp);

                this._teleportHeadPosition(newHeadPosition);
                this._rotateHead(rotationToPerform);

                //console.error("blur end resync");
            }
        }

        this._myBlurRecoverHeadTransform = null;
        this._myBlurRecoverPlayerUp = null;
    },
    _sessionChangeResync() {
        if (this._myBlurRecoverHeadTransform == null) {

            if (this._mySessionActive) {
                let currentHeadPosition = this._myCurrentHeadObject.pp_getPosition();
                let resyncHeadPosition = this._mySessionChangeResyncHeadTransform.quat2_getPosition();
                let resyncHeadRotation = this._mySessionChangeResyncHeadTransform.quat2_getRotationQuat();

                let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();

                let flatCurrentHeadPosition = currentHeadPosition.vec3_removeComponentAlongAxis(playerUp);
                let flatResyncHeadPosition = resyncHeadPosition.vec3_removeComponentAlongAxis(playerUp);

                let resyncMovement = flatResyncHeadPosition.vec3_sub(flatCurrentHeadPosition);
                this._moveHead(resyncMovement);

                let currentHeadForward = this._myCurrentHeadObject.pp_getForward();
                let resyncHeadForward = resyncHeadRotation.quat_getForward();
                let resyncHeadUp = resyncHeadRotation.quat_getUp();

                let rotationToPerform = null;

                let fixedResyncForward = resyncHeadForward;

                let minAngle = 1;
                if (resyncHeadForward.vec3_angle(playerUp) < minAngle) {
                    if (resyncHeadUp.vec3_isConcordant(playerUp)) {
                        fixedResyncForward = resyncHeadUp.vec3_negate();
                    } else {
                        fixedResyncForward = resyncHeadUp.pp_clone();
                    }
                } else if (resyncHeadForward.vec3_angle(playerUp.vec3_negate()) < minAngle) {
                    if (resyncHeadUp.vec3_isConcordant(playerUp)) {
                        fixedResyncForward = resyncHeadUp.pp_clone();
                    } else {
                        fixedResyncForward = resyncHeadUp.vec3_negate();
                    }
                }

                if (!resyncHeadUp.vec3_isConcordant(playerUp)) {
                    rotationToPerform = currentHeadForward.vec3_rotationToPivotedQuat(fixedResyncForward.vec3_negate(), playerUp);
                } else {
                    rotationToPerform = currentHeadForward.vec3_rotationToPivotedQuat(fixedResyncForward, playerUp);
                }

                this._rotateHead(rotationToPerform);
            } else {
                let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
                let resyncHeadPosition = this._mySessionChangeResyncHeadTransform.quat2_getPosition();
                let flatResyncHeadPosition = resyncHeadPosition.vec3_removeComponentAlongAxis(playerUp);

                let playerPosition = PP.myPlayerObjects.myPlayer.pp_getPosition();
                let newPlayerPosition = flatResyncHeadPosition.vec3_add(playerPosition.vec3_componentAlongAxis(playerUp));

                PP.myPlayerObjects.myPlayer.pp_setPosition(newPlayerPosition);
                PP.myPlayerObjects.myNonVRCamera.pp_resetPositionLocal();

                let resyncHeadHeight = this._getHeadHeight(resyncHeadPosition);
                PP.myPlayerObjects.myNonVRCamera.pp_setPosition(playerUp.vec3_scale(resyncHeadHeight).vec3_add(newPlayerPosition));

                let resyncHeadRotation = this._mySessionChangeResyncHeadTransform.quat2_getRotationQuat();

                if (this._myRemoveXTilt) {
                    let resyncHeadForward = resyncHeadRotation.quat_getForward();

                    let fixedHeadRight = resyncHeadForward.vec3_cross(playerUp);
                    if (!resyncHeadRotation.quat_getUp().vec3_isConcordant(playerUp)) {
                        fixedHeadRight.vec3_negate(fixedHeadRight);
                    }
                    fixedHeadRight.vec3_normalize(fixedHeadRight);
                    if (fixedHeadRight.vec3_length() == 0) {
                        fixedHeadRight = resyncHeadRotation.quat_getRight();
                    }

                    let fixedHeadUp = fixedHeadRight.vec3_cross(resyncHeadForward);
                    fixedHeadUp.vec3_normalize(fixedHeadUp);
                    let fixedHeadForward = fixedHeadUp.vec3_cross(fixedHeadRight);
                    fixedHeadForward.vec3_normalize(fixedHeadForward);

                    let fixedHeadRotation = PP.quat_create();
                    fixedHeadRotation.quat_fromAxes(fixedHeadRight.vec3_negate(), fixedHeadUp, fixedHeadForward);
                    resyncHeadRotation = fixedHeadRotation;
                }

                if (this._myPreventHeadUpsideDown) {
                    let resyncHeadUp = resyncHeadRotation.quat_getUp();
                    let resyncHeadRight = resyncHeadRotation.quat_getRight();

                    if (!resyncHeadUp.vec3_isConcordant(playerUp)) {
                        let signedAngle = resyncHeadUp.vec3_angleSigned(playerUp, resyncHeadRight);
                        if (signedAngle > 0) {
                            signedAngle -= 89.995;
                        } else {
                            signedAngle += 89.995;
                        }

                        let fixedHeadUp = resyncHeadUp.vec3_rotateAxis(signedAngle, resyncHeadRight);
                        fixedHeadUp.vec3_normalize(fixedHeadUp);
                        let fixedHeadForward = fixedHeadUp.vec3_cross(resyncHeadRight);
                        fixedHeadForward.vec3_normalize(fixedHeadForward);
                        let fixedHeadRight = fixedHeadForward.vec3_cross(fixedHeadUp);
                        fixedHeadRight.vec3_normalize(fixedHeadRight);

                        let fixedHeadRotation = PP.quat_create();
                        fixedHeadRotation.quat_fromAxes(fixedHeadRight.vec3_negate(), fixedHeadUp, fixedHeadForward);
                        resyncHeadRotation = fixedHeadRotation;
                    }
                }

                resyncHeadRotation.quat_rotateAxisRadians(Math.PI, resyncHeadRotation.quat_getUp(), resyncHeadRotation);
                PP.myPlayerObjects.myNonVRCamera.pp_setRotationQuat(resyncHeadRotation);
            }
        }
    },
    _getHeadHeight(headPosition) {
        let playerPosition = PP.myPlayerObjects.myPlayer.pp_getPosition();
        let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();

        let headDisplacement = headPosition.vec3_sub(playerPosition).vec3_componentAlongAxis(playerUp);
        let height = headDisplacement.vec3_length();
        if (!playerUp.vec3_isConcordant(headDisplacement)) {
            height = -height;
        }

        return height;
    },
    _teleportPlayerTransform(headTransform) {
        let headPosition = headTransform.quat2_getPosition();
        let headHeight = this._getHeadHeight(headPosition);

        let playerUp = PP.myPlayerObjects.myPlayer.pp_getUp();
        let newPlayerPosition = headPosition.vec3_sub(playerUp.vec3_scale(headHeight));

        PP.myPlayerObjects.myPlayer.pp_setPosition(newPlayerPosition);

        let playerForward = PP.myPlayerObjects.myPlayer.pp_getForward();
        let headForward = headTransform.quat2_getAxes()[2];
        let headForwardNegated = headForward.vec3_negate(); // the head is rotated 180 degrees from the player for rendering reasons

        let rotationToPerform = playerForward.vec3_rotationToPivotedQuat(headForwardNegated, playerUp);

        PP.myPlayerObjects.myPlayer.pp_rotateQuat(rotationToPerform);
    }
});