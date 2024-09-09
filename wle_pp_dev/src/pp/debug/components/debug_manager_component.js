import { Component } from "@wonderlandengine/api";
import { Globals } from "../../pp/globals.js";
import { DebugManager } from "../debug_manager.js";

export class DebugManagerComponent extends Component {
    static TypeName = "pp-debug-manager";

    init() {
        this._myDebugManager = null;

        // Prevents double global from same engine
        if (!Globals.hasDebugManager(this.engine)) {
            this._myDebugManager = new DebugManager(this.engine);

            Globals.setDebugManager(this._myDebugManager, this.engine);
        }
    }

    start() {
        if (this._myDebugManager != null) {
            this._myDebugManager.start();
        }
    }

    update(dt) {
        if (this._myDebugManager != null) {
            this._myDebugManager.update(dt);
        }
    }

    onActivate() {
        if (this._myDebugManager != null) {
            this._myDebugManager.setActive(true);

            Globals.setDebugManager(this._myDebugManager, this.engine);
        }
    }

    onDeactivate() {
        if (this._myDebugManager != null) {
            this._myDebugManager.setActive(false);

            if (Globals.getDebugManager(this.engine) == this._myDebugManager) {
                Globals.removeDebugManager(this.engine);
            }
        }
    }

    onDestroy() {
        if (this._myDebugManager != null) {
            this._myDebugManager.destroy();
        }
    }
}