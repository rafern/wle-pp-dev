import { Emitter } from "@wonderlandengine/api";
import { MathUtils } from "../utils/math_utils.js";

export class Timer {
    private _myDuration: number = 0;
    private _myTimeLeft: number = 0;

    private _myDone: boolean = false;
    private _myJustDone: boolean = false;
    private _myStarted: boolean = false;

    private readonly _myOnEndEmitter: Emitter = new Emitter();

    constructor(duration: number, autoStart: boolean = true) {
        this._myDuration = duration;

        if (autoStart) {
            this.start();
        } else {
            this.reset();
        }
    }

    public start(duration?: number): void {
        this.reset(duration);
        this._myStarted = true;
    }

    public end(): void {
        this._done();
    }

    public reset(duration?: number): void {
        if (duration != null) {
            this._myDuration = Math.max(0, duration);
        }

        this._myTimeLeft = this._myDuration;
        this._myDone = false;
        this._myJustDone = false;
        this._myStarted = false;
    }

    public update(dt: number): void {
        this._myJustDone = false;

        if (this.isRunning()) {
            this._myTimeLeft = Math.max(0, this._myTimeLeft - dt);
            if (this._myTimeLeft == 0) {
                this._done();
            }
        }
    }

    public isDone(): boolean {
        return this._myDone;
    }

    public isJustDone(): boolean {
        return this._myJustDone;
    }

    public isStarted(): boolean {
        return this._myStarted;
    }

    public isRunning(): boolean {
        return this.isStarted() && !this.isDone();
    }

    public getDuration(): number {
        return this._myDuration;
    }

    public setDuration(duration: number): void {
        const newDuration = Math.max(0, duration);

        if (this.isRunning()) {
            const timeElapsed = Math.max(0, this._myDuration - this._myTimeLeft);
            this._myTimeLeft = Math.max(0, newDuration - timeElapsed);
        }

        this._myDuration = newDuration;
    }

    public getTimeLeft(): number {
        return this._myTimeLeft;
    }

    public setTimeLeft(timeLeft: number, keepPercentage: boolean = false): void {
        if (this.isRunning()) {
            const currentPercentage = this.getPercentage();

            this._myTimeLeft = Math.max(0, timeLeft);

            if (this._myTimeLeft > this._myDuration) {
                this._myDuration = this._myTimeLeft;
            }

            if (keepPercentage && this._myTimeLeft > MathUtils.EPSILON) {
                this._myDuration = this._myTimeLeft / Math.max(MathUtils.EPSILON, (1 - currentPercentage));
            }
        }
    }

    public getTimeElapsed(): number {
        let timeElapsed = 0;
        if (this.isRunning()) {
            timeElapsed = this._myDuration - this._myTimeLeft;
        }
        return Math.max(0, timeElapsed);
    }

    public setTimeElapsed(timeElapsed: number): void {
        this.setTimeLeft(this._myDuration - Math.max(0, timeElapsed));
    }

    public getPercentage(): number {
        let percentage = 1;
        if (this._myTimeLeft > 0 && this._myDuration > 0) {
            percentage = (this._myDuration - this._myTimeLeft) / this._myDuration;
        }
        return MathUtils.clamp(percentage, 0, 1);
    }

    public setPercentage(percentage: number): void {
        if (this.isRunning()) {
            const durationPercentage = MathUtils.clamp(1 - percentage, 0, 1);
            this._myTimeLeft = this._myDuration * durationPercentage;
        }
    }

    public onEnd(listener: () => void, id?: unknown): void {
        this._myOnEndEmitter.add(listener, { id: id });
    }

    public unregisterOnEnd(id?: unknown): void {
        this._myOnEndEmitter.remove(id);
    }

    private _done(): void {
        this._myTimeLeft = 0;
        this._myDone = true;
        this._myJustDone = true;

        this._myOnEndEmitter.notify();
    }
}