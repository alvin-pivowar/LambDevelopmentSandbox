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

            var PseudoKeys = {
                BACKSPACE: 8,
                BREAK: 19,
                CAPS_LOCK: 20,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                INSERT: 45,
                LEFT: 37,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                RIGHT: 39,
                SPACE: 32,
                TAB: 9,
                UP: 38
            };

            // The key can be a single character, an integer (keycode), or a PseudoKey name (string)
            function ShortCut(obj) {

                if (!angular.isObject(obj)) throw new Error("Illegal ShortCut");

                this.isAlt = false;
                this.isControl = false;
                this.isMeta = false;
                this.isShift = false;
                angular.extend(this, obj);

                this.key = null;

                if (angular.isString(obj.key)) {
                    if (obj.key.length === 1)
                        this.key = obj.key.toUpperCase();
                    else if (PseudoKeys.hasOwnProperty(obj.key))
                        obj.key = PseudoKeys[obj.key];
                }

                if (angular.isNumber(obj.key)) {
                    this.key = String.fromCharCode(((96 <= obj.key && obj.key <= 105)
                        ? obj.key - 48
                        : obj.key )).toUpperCase()
                }

                if (!this.key)
                    throw new Error("Unable to determine shortcut key from '" + obj.key + "'");
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

                    var getDisplayableCharacter = function(key) {
                        var code = key.charCodeAt(0);
                        var name;

                        for (name in PseudoKeys) {
                            if (PseudoKeys.hasOwnProperty(name) && PseudoKeys[name] === code)
                                return name;
                        }

                        return key;
                    };

                    var result = "";
                    if (this.isControl) result += "CONTROL";
                    if (this.isShift) result += (result.length > 0) ? "+SHIFT" : "SHIFT";
                    if (this.isAlt) result += (result.length > 0) ? "+ALT" : "ALT";
                    if (this.isMeta) result += (result.length > 0) ? "+META" : "META";

                    result += (result.length > 0)
                        ? ("+" + getDisplayableCharacter(this.key))
                        : getDisplayableCharacter(this.key);

                    return result;
                }
            };

            ShortCut.PseudoKeys = PseudoKeys;

            ShortCut.fromKeyEvent = function(event) {
                return new ShortCut({
                    isAlt: event.altKey,
                    isControl: event.ctrlKey,
                    isMeta: event.metaKey,
                    isShift: event.shiftKey,
                    key: event.keyCode
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