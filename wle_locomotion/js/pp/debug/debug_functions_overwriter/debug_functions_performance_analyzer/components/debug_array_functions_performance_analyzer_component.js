
WL.registerComponent('pp-debug-array-functions-performance-analyzer', {
    _myIncludeOnlyArrayExtensionFunctions: { type: WL.Type.Bool, default: false },
    _myDelayStart: { type: WL.Type.Float, default: 0.0 },
    _myLogFunction: { type: WL.Type.Enum, values: ["log", "error", "warn", "debug"], default: "log" },
    _mySecondsBetweenLogs: { type: WL.Type.Float, default: 1.0 },
    _myLogMaxResults: { type: WL.Type.Bool, default: false },
    _myLogSortOrder: { type: WL.Type.Enum, values: ["none", "calls count", "total execution time", "average execution time"], default: "none" },
    _myLogCallsCountResults: { type: WL.Type.Bool, default: true },
    _myLogTotalExecutionTimeResults: { type: WL.Type.Bool, default: true },
    _myLogTotalExecutionTimePercentageResults: { type: WL.Type.Bool, default: true },
    _myLogAverageExecutionTimeResults: { type: WL.Type.Bool, default: true },
    _myLogMaxAmountOfFunctions: { type: WL.Type.Int, default: -1 },
    _myLogFunctionsWithCallsCountAbove: { type: WL.Type.Int, default: -1 },
    _myLogFunctionsWithTotalExecutionTimePercentageAbove: { type: WL.Type.Int, default: -1 },
    _myFunctionPathsToInclude: { type: WL.Type.String, default: "" },
    _myFunctionPathsToExclude: { type: WL.Type.String, default: "" },
    _myExcludeConstructors: { type: WL.Type.Bool, default: false },
    _myClearConsoleBeforeLog: { type: WL.Type.Bool, default: false },
    _myResetMaxResultsShortcutEnabled: { type: WL.Type.Bool, default: false }
}, {
    init() {
        this.object.pp_addComponent("pp-debug-functions-performance-analyzer", {
            _myClassesByPath: "Array, Uint8ClampedArray, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array",
            _myDelayStart: this._myDelayStart,
            _myLogTitle: "Array Functions Performance Analysis Results",
            _myLogFunction: this._myLogFunction,
            _mySecondsBetweenLogs: this._mySecondsBetweenLogs,
            _myLogMaxResults: this._myLogMaxResults,
            _myLogSortOrder: this._myLogSortOrder,
            _myLogMaxAmountOfFunctions: this._myLogMaxAmountOfFunctions,
            _myLogFunctionsWithCallsCountAbove: this._myLogFunctionsWithCallsCountAbove,
            _myLogFunctionsWithTotalExecutionTimePercentageAbove: this._myLogFunctionsWithTotalExecutionTimePercentageAbove,
            _myLogCallsCountResults: this._myLogCallsCountResults,
            _myLogTotalExecutionTimeResults: this._myLogTotalExecutionTimeResults,
            _myLogTotalExecutionTimePercentageResults: this._myLogTotalExecutionTimePercentageResults,
            _myLogAverageExecutionTimeResults: this._myLogAverageExecutionTimeResults,
            _myFunctionPathsToInclude: this._myFunctionPathsToInclude + (this._myFunctionPathsToInclude.length > 0 && this._myIncludeOnlyArrayExtensionFunctions ? ", " : "") + (this._myIncludeOnlyArrayExtensionFunctions ? "pp_, vec_, vec2_, vec3_, vec4_, quat_, quat2_, mat3_, mat4_, _pp_, _vec_, _quat_" : ""),
            _myFunctionPathsToExclude: this._myFunctionPathsToExclude,
            _myExcludeConstructors: this._myExcludeConstructors,
            _myExcludeJavascriptObjectFunctions: true,
            _myAddPathPrefixToFunctionID: true,
            _myClearConsoleBeforeLog: this._myClearConsoleBeforeLog,
            _myResetMaxResultsShortcutEnabled: this._myResetMaxResultsShortcutEnabled
        });
    }
});
