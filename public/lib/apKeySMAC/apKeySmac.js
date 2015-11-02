(function() {
    "use strict";

    var $injector;      // Used by KeySmacConfig.initialize()  $injector set during service start.

    angular.module("apKeySMAC", []);


    // KeySMAC Models

    angular
        .module("apKeySMAC")
        .provider("keySmacModel", function() {

            // ContextInfo

            function ContextInfo(contextName, parent) {
                this.contextName = contextName;
                this.parent = parent;
                this.registrations = [];
            }

            ContextInfo.prototype = {
                addRegistration: function(registration) {
                    this.registrations.push(registration);
                },

                findRegistration: function(shortCut) {
                    var i;
                    for (i = 0; i < this.registrations.length; ++ i) {
                        if (this.registrations[i].shortCut.equals(shortCut))
                            return this.registrations[i];
                    }

                    return null;
                },

                removeRegistration: function(shortCut) {
                    var registrations = [];
                    angular.forEach(this.registrations, function(registration) {
                        if (!registration.shortCut.equals(shortCut))
                            registrations.push(registration);
                    });

                    if (this.registrations.length === registrations.length)
                        return false;

                    this.registrations = registrations;
                    return true;
                }
            };

            ContextInfo.ROOT = "$app";

            ContextInfo.contextNameFromPath = function(nameOrPath) {
                var parts;

                if (nameOrPath.indexOf('/') === -1)
                    return nameOrPath;

                parts = nameOrPath.split('/');
                return parts[parts.length - 1];
            };

            ContextInfo.pathFromContextName = function(contextName, contextHierarchy) {
                var contextInfo;
                var result = "";

                contextInfo = contextHierarchy[contextName];
                while (contextInfo) {
                    if (result.length > 0) result = "/" + result;
                    result = contextInfo.contextName + result;
                    contextInfo = contextInfo.parent ? contextHierarchy[contextInfo.parent] : null;
                }

                return result;
            };


            // KeySmacConfig

            function KeySmacConfig(obj) {
                var that = this;

                that.configId = (obj && obj.configId) ? obj.configId : ++KeySmacConfig.configId;
                that.contexts = [ContextInfo.ROOT];
                that.enabled = true;
                that.logging = false;
                that.registrations = {};

                if (!obj)
                    return;

                if (angular.isArray(obj.contexts)) {
                    angular.forEach(obj.contexts, function (contextNameOrPath) {
                        var contextName = ContextInfo.contextNameFromPath(contextNameOrPath);
                        if (contextName !== ContextInfo.ROOT)
                            that.contexts.push(contextNameOrPath);
                    });
                }

                if (obj.hasOwnProperty("enabled") && !obj.enabled)
                    that.enabled = false;

                this.logging = !!obj.logging;

                if (angular.isObject(obj.registrations))
                    that.registrations = obj.registrations;
            }

            KeySmacConfig.prototype = {
                // The contextHierarchy object is a dictionary.  Each key is a context name.
                // Each value is a ContextInfo.  Since parent is a property of ContextInfo,
                // the contextHierarchy object defines the context hierarchy;
                buildContextHierarchy: function() {
                    var contextHierarchy = {};
                    contextHierarchy[ContextInfo.ROOT] = new ContextInfo(ContextInfo.ROOT, null);

                    angular.forEach(this.contexts, function(path) {
                        var contextName;
                        var i;
                        var parentName;
                        var parts;

                        contextName = ContextInfo.contextNameFromPath(path);
                        if (contextName !== ContextInfo.ROOT) {
                            if (contextHierarchy.hasOwnProperty(contextName))
                                throw new Error("Duplicate registration for '" + contextName + "'");

                            parts = path.split('/');
                            for (i = parts.length - 1; i >= 0; --i) {
                                contextName = parts[i];
                                parentName = (i > 0) ? parts[i - 1] : null;

                                if (!contextHierarchy.hasOwnProperty(contextName))
                                    contextHierarchy[contextName] = new ContextInfo(contextName, parentName);
                            }
                        }
                    });

                    return contextHierarchy;
                },

                // Add registrations defined in config to the appropriate contexts.
                buildRegistrations: function(contextHierarchy) {
                    var contextInfo;
                    var contextName;
                    var key;

                    for (key in this.registrations) {
                        if (this.registrations.hasOwnProperty(key)) {
                            contextName = key;
                            if (!contextHierarchy.hasOwnProperty(contextName))
                                throw new Error("Context '" + context + "' is unknown.");

                            contextInfo = contextHierarchy[contextName];
                            if (angular.isArray(this.registrations[contextName])) {
                                angular.forEach(this.registrations[contextName], function(registration) {
                                    registration = new ShortCutRegistration(registration);
                                    if (contextInfo.findRegistration(registration.shortCut))
                                        throw new Error("Context '" + context + "' already has that shortcut registered.");

                                    contextInfo.addRegistration(registration);
                                });
                            }
                        }
                    }
                },

                initializeService: function() {
                    var keySMAC = $injector.get("keySMAC");
                    return keySMAC.initialize(this);
                }
            };

            KeySmacConfig.CONFIG_NAME = "keySmacConfig";

            KeySmacConfig.configId = 0;



            // ShortCut

            function ShortCut(obj) {
                if (!angular.isObject(obj)) throw new Error("Illegal ShortCut");

                if (!angular.isString(obj.key) || obj.key.length !== 1)
                    throw new Error("Shortcut key must be a single character.");

                this.isAlt = false;
                this.isControl = false;
                this.isMeta = false;
                this.isShift = false;

                this.key = '';

                angular.extend(this, obj);
                this.key = obj.key.match(/[a-z]/i) ? obj.key.toUpperCase() : obj.key;
            }

            ShortCut.prototype = {
                equals: function(rhs) {
                    return rhs &&
                        rhs.isAlt === this.isAlt &&
                        rhs.isControl === this.isControl &&
                        rhs.isMeta === this.isMeta &&
                        rhs.isShift === this.isShift &&
                        rhs.key === this.key;
                },

                toDisplayString: function() {
                    var result = "";
                    if (this.isControl) result += "CONTROL";
                    if (this.isShift) result += (result.length > 0) ? "+SHIFT" : "SHIFT";
                    if (this.isAlt) result += (result.length > 0) ? "+ALT" : "ALT";
                    if (this.isMeta) result += (result.length > 0) ? "+META" : "META";

                    result += (result.length > 0) ? ("+" + this.key) : this.key;
                    return result;
                }
            };

            ShortCut.fromKeyEvent = function(event) {
                return new ShortCut({
                    isAlt: event.altKey,
                    isControl: event.ctrlKey,
                    isMeta: event.metaKey,
                    isShift: event.shiftKey,
                    key: String.fromCharCode(((96 <= event.keyCode && event.keyCode <= 105)
                        ? event.keyCode - 48
                        : event.keyCode )).toUpperCase()
                });
            };


            // ShortCutRegistration

            function ShortCutRegistration(obj) {
                this.callbackFn = null;
                this.callerInfo = {};       // Developer-defined data
                this.description = null;    // What the shortcut does.
                this.shortCut = {};
                this.shortCutName = null;   // The 'short' name.

                angular.extend(this, obj);

                this.shortCut = new ShortCut(obj.shortCut);
            }


            // Config-time Models
            this.KeySmacConfig = KeySmacConfig;
            this.ShortCut = ShortCut;
            this.ShortCutRegistration = ShortCutRegistration;

            // Run-time Models
            this.$get =
                ["$injector",
                function(_$injector_) {

                    $injector = _$injector_;

                    return {
                        ContextInfo: ContextInfo,
                        KeySmacConfig: KeySmacConfig,
                        ShortCut: ShortCut,
                        ShortCutRegistration: ShortCutRegistration
                    }
                }];
        });
})();