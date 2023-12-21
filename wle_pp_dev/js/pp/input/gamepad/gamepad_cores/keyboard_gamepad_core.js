import { Globals } from "../../../pp/globals";
import { Handedness } from "../../cauldron/input_types";
import { KeyID } from "../../cauldron/keyboard";
import { GamepadButtonID } from "../gamepad_buttons";
import { GamepadCore } from "./gamepad_core";

export class KeyboardGamepadCore extends GamepadCore {

    constructor(handPose) {
        super(handPose);

        // Support Variables
        this._myButtonData = this._createButtonData();
        this._myAxesData = this._createAxesData();
        this._myHapticActuators = [];
    }

    isGamepadCoreActive() {
        return true;
    }

    getButtonData(buttonID) {
        this._myButtonData.myPressed = false;
        this._myButtonData.myTouched = false;
        this._myButtonData.myValue = 0;

        let keyboard = Globals.getKeyboard(this.getEngine());

        if (this.isGamepadCoreActive()) {
            if (this.getHandedness() == Handedness.LEFT) {
                switch (buttonID) {
                    case GamepadButtonID.SELECT:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyE);
                        break;
                    case GamepadButtonID.SQUEEZE:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyQ);
                        break;
                    case GamepadButtonID.TOUCHPAD:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyX);
                        break;
                    case GamepadButtonID.THUMBSTICK:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyR);
                        break;
                    case GamepadButtonID.BOTTOM_BUTTON:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyC);
                        break;
                    case GamepadButtonID.TOP_BUTTON:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyF);
                        break;
                    case GamepadButtonID.THUMB_REST:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyV);
                        break;
                }
            } else {
                switch (buttonID) {
                    case GamepadButtonID.SELECT:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyU);
                        break;
                    case GamepadButtonID.SQUEEZE:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyO);
                        break;
                    case GamepadButtonID.TOUCHPAD:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyM);
                        break;
                    case GamepadButtonID.THUMBSTICK:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyY);
                        break;
                    case GamepadButtonID.BOTTOM_BUTTON:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyN);
                        break;
                    case GamepadButtonID.TOP_BUTTON:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyH);
                        break;
                    case GamepadButtonID.THUMB_REST:
                        this._myButtonData.myPressed = keyboard.isKeyPressed(KeyID.KeyB);
                        break;
                }
            }
        }

        if (this._myButtonData.myPressed) {
            this._myButtonData.myTouched = true;
            this._myButtonData.myValue = 1;
        }

        return this._myButtonData;
    }

    getAxesData(axesID) {
        this._myAxesData.vec2_zero();

        let keyboard = Globals.getKeyboard(this.getEngine());

        if (this.isGamepadCoreActive()) {
            if (this.getHandedness() == Handedness.LEFT) {
                if (keyboard.isKeyPressed(KeyID.KeyW)) this._myAxesData[1] += 1.0;
                if (keyboard.isKeyPressed(KeyID.KeyS)) this._myAxesData[1] += -1.0;
                if (keyboard.isKeyPressed(KeyID.KeyD)) this._myAxesData[0] += 1.0;
                if (keyboard.isKeyPressed(KeyID.KeyA)) this._myAxesData[0] += -1.0;
            } else {
                if (keyboard.isKeyPressed(KeyID.KeyI) || keyboard.isKeyPressed(KeyID.UP)) this._myAxesData[1] += 1.0;
                if (keyboard.isKeyPressed(KeyID.KeyK) || keyboard.isKeyPressed(KeyID.DOWN)) this._myAxesData[1] += -1.0;
                if (keyboard.isKeyPressed(KeyID.KeyL) || keyboard.isKeyPressed(KeyID.RIGHT)) this._myAxesData[0] += 1.0;
                if (keyboard.isKeyPressed(KeyID.KeyJ) || keyboard.isKeyPressed(KeyID.LEFT)) this._myAxesData[0] += -1.0;
            }
        }

        return this._myAxesData;
    }

    getHapticActuators() {
        return this._myHapticActuators;
    }
}