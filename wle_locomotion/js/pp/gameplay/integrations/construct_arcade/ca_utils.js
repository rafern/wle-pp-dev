PP.CAUtils = {
    _myDummyServer: null,
    _myUseDummyServerOnSDKMissing: false,
    _myUseDummyServerOnError: false,
    setUseDummyServerOnSDKMissing: function (useDummyServer) {
        PP.CAUtils._myUseDummyServerOnSDKMissing = useDummyServer;
    },
    setUseDummyServerOnError: function (useDummyServer) {
        PP.CAUtils._myUseDummyServerOnError = useDummyServer;
    },
    setDummyServer: function (dummyServer) {
        PP.CAUtils._myDummyServer = dummyServer;
    },
    isUseDummyServerOnSDKMissing: function () {
        return PP.CAUtils._myUseDummyServerOnSDKMissing;
    },
    isUseDummyServerOnError: function () {
        return PP.CAUtils._myUseDummyServerOnError;
    },
    getDummyServer: function () {
        return PP.CAUtils._myDummyServer;
    },
    isSDKAvailable: function () {
        return "casdk" in window;
    },
    getLeaderboard: function (leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError, overrideUseDummyServer = null) {
        if (PP.CAUtils.isSDKAvailable()) {
            if (!isAroundPlayer) {
                casdk.getLeaderboard(leaderboardID, isAscending, isAroundPlayer, scoresAmount).then(function (result) {
                    if (result.leaderboard) {
                        if (callbackOnDone) {
                            callbackOnDone(result.leaderboard);
                        }
                    } else {
                        if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                            (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                            PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                        } else if (callbackOnError) {
                            let error = {};
                            error.reason = "Get leaderboard failed";
                            error.type = PP.CAUtils.ErrorType.GET_LEADERBOARD_FAILED;
                            callbackOnError(error, result);
                        }
                    }
                }).catch(function (result) {
                    if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                        (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                        PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                    } else if (callbackOnError) {
                        let error = {};
                        error.reason = "Get leaderboard failed";
                        error.type = PP.CAUtils.ErrorType.GET_LEADERBOARD_FAILED;
                        callbackOnError(error, result);
                    }
                });
            } else {
                PP.CAUtils.getUser(
                    function (user) {
                        let userName = user.displayName;
                        casdk.getLeaderboard(leaderboardID, isAscending, isAroundPlayer, scoresAmount).then(function (result) {
                            if (result.leaderboard) {
                                let userValid = false;
                                for (let value of result.leaderboard) {
                                    if (value.displayName == userName && value.score != 0) {
                                        userValid = true;
                                        break;
                                    }
                                }
                                if (userValid) {
                                    if (callbackOnDone) {
                                        callbackOnDone(result.leaderboard);
                                    }
                                } else {
                                    if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                                        (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                                        PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                                    } else if (callbackOnError) {
                                        let error = {};
                                        error.reason = "Searching for around player but the user has not submitted a score yet";
                                        error.type = PP.CAUtils.ErrorType.USER_HAS_NO_SCORE;
                                        callbackOnError(error, result);
                                    }
                                }
                            } else {
                                if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                                    (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                                    PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                                } else if (callbackOnError) {
                                    let error = {};
                                    error.reason = "Get leaderboard failed";
                                    error.type = PP.CAUtils.ErrorType.GET_LEADERBOARD_FAILED;
                                    callbackOnError(error, result);
                                }
                            }
                        }).catch(function (result) {
                            if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                                (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                                PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                            } else if (callbackOnError) {
                                let error = {};
                                error.reason = "Get leaderboard failed";
                                error.type = PP.CAUtils.ErrorType.GET_LEADERBOARD_FAILED;
                                callbackOnError(error, result);
                            }
                        });

                    },
                    function () {
                        if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                            (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                            PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
                        } else if (callbackOnError) {
                            let error = {};
                            error.reason = "Searching for around player but the user can't be retrieved";
                            error.type = PP.CAUtils.ErrorType.GET_USER_FAILED;
                            callbackOnError(error, result);
                        }
                    },
                    false);
            }
        } else {
            if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getLeaderboard != null &&
                (PP.CAUtils._myUseDummyServerOnSDKMissing && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                PP.CAUtils.getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
            } else if (callbackOnError) {
                let error = {};
                error.reason = "Construct Arcade SDK missing";
                error.type = PP.CAUtils.ErrorType.CA_SDK_MISSING;
                callbackOnError(error, null);
            }
        }
    },
    getLeaderboardDummy(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError) {
        if (PP.CAUtils._myDummyServer) {
            PP.CAUtils._myDummyServer.getLeaderboard(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError);
        } else {
            if (callbackOnError) {
                let error = {};
                error.reason = "Dummy server not initialized";
                error.type = PP.CAUtils.ErrorType.DUMMY_NOT_INITIALIZED;
                callbackOnError(error);
            }
        }
    },
    submitScore: function (leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError, overrideUseDummyServer = null) {
        if (PP.CAUtils.isSDKAvailable()) {
            casdk.submitScore(leaderboardID, scoreToSubmit).then(function (result) {
                if (result.error) {
                    if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.submitScore != null &&
                        (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                        PP.CAUtils.submitScoreDummy(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError);
                    } else if (callbackOnError) {
                        let error = {};
                        error.reason = "Submit score failed";
                        error.type = PP.CAUtils.ErrorType.SUBMIT_SCORE_FAILED;
                        callbackOnError(error, result);
                    }
                } else {
                    callbackOnDone();
                }
            }).catch(function (result) {
                if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.submitScore != null &&
                    (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                    PP.CAUtils.submitScoreDummy(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError);
                } else if (callbackOnError) {
                    let error = {};
                    error.reason = "Submit score failed";
                    error.type = PP.CAUtils.ErrorType.SUBMIT_SCORE_FAILED;
                    callbackOnError(error, result);
                }
            });
        } else {
            if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.submitScore != null &&
                (PP.CAUtils._myUseDummyServerOnSDKMissing && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                PP.CAUtils.submitScoreDummy(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError);
            } else if (callbackOnError) {
                let error = {};
                error.reason = "Construct Arcade SDK missing";
                error.type = PP.CAUtils.ErrorType.CA_SDK_MISSING;
                callbackOnError(error, null);
            }
        }
    },
    submitScoreDummy(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError) {
        if (PP.CAUtils._myDummyServer) {
            PP.CAUtils._myDummyServer.submitScore(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError);
        } else {
            if (callbackOnError) {
                let error = {};
                error.reason = "Dummy server not initialized";
                error.type = PP.CAUtils.ErrorType.DUMMY_NOT_INITIALIZED;
                callbackOnError(error);
            }
        }
    },
    getUser: function (callbackOnDone, callbackOnError, overrideUseDummyServer = null) {
        if (PP.CAUtils.isSDKAvailable()) {
            casdk.getUser().then(function (result) {
                if (result.user) {
                    if (callbackOnDone) {
                        callbackOnDone(result.user);
                    }
                } else {
                    if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getUser != null &&
                        (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                        PP.CAUtils.getUserDummy(callbackOnDone, callbackOnError);
                    } else if (callbackOnError) {
                        let error = {};
                        error.reason = "Get user failed";
                        error.type = PP.CAUtils.ErrorType.GET_USER_FAILED;
                        callbackOnError(error, result);
                    }
                }
            }).catch(function (result) {
                if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getUser != null &&
                    (PP.CAUtils._myUseDummyServerOnError && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                    PP.CAUtils.getUserDummy(callbackOnDone, callbackOnError);
                } else if (callbackOnError) {
                    let error = {};
                    error.reason = "Get user failed";
                    error.type = PP.CAUtils.ErrorType.GET_USER_FAILED;
                    callbackOnError(error, result);
                }
            });
        } else {
            if (PP.CAUtils._myDummyServer != null && PP.CAUtils._myDummyServer.getUser != null &&
                (PP.CAUtils._myUseDummyServerOnSDKMissing && overrideUseDummyServer == null) || (overrideUseDummyServer != null && overrideUseDummyServer)) {
                PP.CAUtils.getUserDummy(callbackOnDone, callbackOnError);
            } else if (callbackOnError) {
                let error = {};
                error.reason = "Construct Arcade SDK missing";
                error.type = PP.CAUtils.ErrorType.CA_SDK_MISSING;
                callbackOnError(error, null);
            }
        }
    },
    getUserDummy(callbackOnDone, callbackOnError) {
        if (PP.CAUtils._myDummyServer) {
            PP.CAUtils._myDummyServer.getUser(callbackOnDone, callbackOnError);
        } else {
            if (callbackOnError) {
                let error = {};
                error.reason = "Dummy server not initialized";
                error.type = PP.CAUtils.ErrorType.DUMMY_NOT_INITIALIZED;
                callbackOnError(error);
            }
        }
    },
    ErrorType: {
        DUMMY_NOT_INITIALIZED: 0,
        CA_SDK_MISSING: 1,
        SUBMIT_SCORE_FAILED: 2,
        GET_LEADERBOARD_FAILED: 3,
        GET_USER_FAILED: 4,
        USER_HAS_NO_SCORE: 5
    }
};

PP.CADummyServer = class CADummyServer {

    constructor() {
    }

    getLeaderboard(leaderboardID, isAscending, isAroundPlayer, scoresAmount, callbackOnDone, callbackOnError) {
        let leaderboard = null;

        if (PP.CAUtils.isSDKAvailable()) {
            leaderboard = [
                { rank: 0, displayName: "An", score: 0 },
                { rank: 1, displayName: "Error", score: 0 },
                { rank: 2, displayName: "Has", score: 0 },
                { rank: 3, displayName: "Occurred", score: 0 },
                { rank: 4, displayName: "While", score: 0 },
                { rank: 5, displayName: "Trying", score: 0 },
                { rank: 6, displayName: "To", score: 0 },
                { rank: 7, displayName: "Retrieve", score: 0 },
                { rank: 8, displayName: "The", score: 0 },
                { rank: 9, displayName: "Leaderboard", score: 0 }
            ];
        } else {
            if (isAroundPlayer) {
                leaderboard = [
                    { rank: 0, displayName: "Sign In", score: 0 },
                    { rank: 1, displayName: "And", score: 0 },
                    { rank: 2, displayName: "Play", score: 0 },
                    { rank: 3, displayName: "On", score: 0 },
                    { rank: 4, displayName: "HeyVR", score: 0 },
                    { rank: 5, displayName: "To", score: 0 },
                    { rank: 6, displayName: "Submit", score: 0 },
                    { rank: 7, displayName: "Your", score: 0 },
                    { rank: 8, displayName: "Own", score: 0 },
                    { rank: 9, displayName: "Score", score: 0 }
                ];
            } else {
                leaderboard = [
                    { rank: 0, displayName: "The", score: 0 },
                    { rank: 1, displayName: "Top 10", score: 0 },
                    { rank: 2, displayName: "Leaderboard", score: 0 },
                    { rank: 3, displayName: "Is", score: 0 },
                    { rank: 4, displayName: "Available", score: 0 },
                    { rank: 5, displayName: "Only", score: 0 },
                    { rank: 5, displayName: "When", score: 0 },
                    { rank: 7, displayName: "Playing", score: 0 },
                    { rank: 8, displayName: "On", score: 0 },
                    { rank: 9, displayName: "HeyVR", score: 0 },
                ];
            }
        }

        while (leaderboard.length > scoresAmount) {
            leaderboard.pop();
        }

        if (callbackOnDone) {
            callbackOnDone(leaderboard);
        }
    }

    submitScore(leaderboardID, scoreToSubmit, callbackOnDone, callbackOnError) {
        if (callbackOnDone) {
            callbackOnDone();
        }
    }

    getUser(callbackOnDone, callbackOnError) {
        let user = {};
        user.displayName = "J";

        if (callbackOnDone) {
            callbackOnDone(user);
        }
    }
};