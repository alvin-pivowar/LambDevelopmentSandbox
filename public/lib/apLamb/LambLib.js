// Copyright (c) 2015, Alvin Pivowar
// All rights reserved.

(function() {
    "use strict";

    var LAMB_CONFIG_NAME = "lambConfig";

    var LogLevelEnum = {
        NONE: "None",
        NORMAL: "Normal",
        VERBOSE: "Verbose"
    };
    LogLevelEnum.all = [LogLevelEnum.NONE, LogLevelEnum.NORMAL, LogLevelEnum.VERBOSE];

    angular.module("apLamb", []);

    angular
        .module("apLamb")
        .run(
        ["$q", "$rootScope", "lambConfigService",
        function($q, $rootScope, lambConfigService) {
            if (! angular.isPromise) {
                angular.isPromise = function(obj) {
                    return (obj && obj.then && String(obj.then) === String($q(function(accept, reject) {accept();}).then));
                }
            }

            if (! angular.isScope) {
                angular.isScope = function (obj) {
                    return (obj && obj.$digest && String(obj.$digest) === String($rootScope.$digest));
                }
            }
        }]);

    angular
        .module("apLamb")
        .factory("lambConfigService",
        ["$injector",
        function($injector) {
            var _currentLogLevel;
            var _socks = [];

            init();

            function getLogLevel() {
                return _currentLogLevel;
            }

            function getSocks() {
                return _socks;
            }

            function init() {
                var lambConfigService;
                _currentLogLevel = "None";

                if ($injector.has(LAMB_CONFIG_NAME)) {
                    lambConfigService = $injector.get(LAMB_CONFIG_NAME);
                    if (lambConfigService.logLevel)
                        setLogLevel(lambConfigService.logLevel);
                    _socks = lambConfigService.socks;
                }
            }

            function setLogLevel(logLevel) {
                var enumItem;
                var errorMessage;
                var i;
                var proposedLogLevel = logLevel ? logLevel.toLowerCase() : "";

                for (i = 0; i < LogLevelEnum.all.length; ++ i) {
                    enumItem = LogLevelEnum.all[i];
                    if (proposedLogLevel === enumItem.toLowerCase()) {
                        _currentLogLevel = enumItem;
                        return;
                    }
                }

                errorMessage = "Illegal " + LAMB_CONFIG_NAME + ".logLevel '" + logLevel + "' - Valid values are ";
                for (i = 0; i < LogLevelEnum.all.length; ++ i) {
                    if (i > 0) errorMessage += ((i < LogLevelEnum.all.length - 1) ? ", " : " and ");
                    errorMessage += "'" + LogLevelEnum.all[i] + "'";
                }

                throw new Error(errorMessage);
            }

            return {
                LAMB_CONFIG_NAME: LAMB_CONFIG_NAME,
                LogLevelEnum: LogLevelEnum,

                getLogLevel: getLogLevel,
                setLogLevel: setLogLevel,
                getSocks: getSocks
            };
        }]);

    function LambConfig(logLevel, socks) {
        this.logLevel = logLevel;   // default: "None"
        this.socks = socks;         // default: null, but default sock protocol, host, and port default to server that
                                    // hosted the index.html page.  The default channel is "BLEAT".
    }
})();