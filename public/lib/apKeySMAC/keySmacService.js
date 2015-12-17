(function() {
    "use strict";

    var SERVICE_NAME = "keySMAC";

    var ALT_KEYCODE = 18;
    var CTRL_KEYCODE = 17;
    var META_KEYCODE = 91;
    var SHIFT_KEYCODE = 16;

    angular
        .module("apKeySMAC")
        .factory(SERVICE_NAME,
        ["$document", "$injector", "$log", "$rootScope", "keySmacModel",
        function($document, $injector, $log, $rootScope, keySmacModel) {
            var ContextInfo = keySmacModel.ContextInfo;
            var KeySmacConfig = keySmacModel.KeySmacConfig;
            var ShortCut = keySmacModel.ShortCut;
            var ShortCutRegistration = keySmacModel.ShortCutRegistration;

            var _bus = null;
            var _config = null;
            var _configId = null;
            var _contextHierarchy = {};
            var _isEnabled = null;
            var _stack = [];

            initialize(null);


            function addContext(contextNameOrPath) {
                var addedContextNames = [];
                var contextName;
                var i;
                var parentName;
                var parts;
                var path;

                path = contextNameOrPath;
                contextName = ContextInfo.contextNameFromPath(path);
                if (_contextHierarchy.hasOwnProperty(contextName))
                    return false;

                parts = path.split('/');
                if (parts.length === 1) {
                    _contextHierarchy[contextName] = new ContextInfo(contextName, null);
                    return true;
                }

                for (i = parts.length - 1; i >= 0; --i) {
                    contextName = parts[i];
                    parentName = ( i > 0 ) ? parts[i - 1] : null;

                    if (!_contextHierarchy.hasOwnProperty(contextName)) {
                        _contextHierarchy[contextName] = new ContextInfo(contextName, parentName);
                        addedContextNames.push(contextName);
                    }
                }

                if (_config.logging) {
                    angular.forEach(addedContextNames, function(contextName) {
                        $log.info("keySMAC: Added context '" +
                            ContextInfo.pathFromContextName(contextName, _contextHierarchy) + "'");
                    });
                }

                return (addedContextNames.length > 0);
            }

            // usage:   addRegistration(contextName, registration)  -- registers shortcut with indicated context.
            //          addRegistration(registration)   -- registers shortcut to active context.
            function addRegistration() {
                var contextName = (arguments.length == 2) ? arguments[0] : _stack[0];
                var registration = arguments[arguments.length - 1];

                var contextInfo;

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                contextInfo = _contextHierarchy[contextName];
                if (contextInfo.findRegistration(registration.shortCut))
                    throw new Error("Context '" + contextName + "' already has that shortcut registered.");

                registration = new ShortCutRegistration(registration);
                contextInfo.addRegistration(registration);

                if (_config.logging)
                    $log.info("keySMAC: Added registration " + JSON.stringify(registration));
            }

            // Clear the context stack.
            // An empty stack only contains the "global" context.
            function clear() {
                if (_stack.length == 1)
                    return false;

                _stack = [ContextInfo.ROOT];

                publish("keySMAC.context.change", _stack[0]);

                if (_config.logging)
                    $log.info("keySMAC: Context stack cleared");

                return true;
            }

            function deleteContext(nameOrPath) {
                var contextChanged = false;
                var contextInfo;
                var contextName;
                var key;
                var newContextHierarchy = {};
                var newStack = [];
                var path;
                var target;

                contextName = ContextInfo.contextNameFromPath(nameOrPath);
                path = ContextInfo.pathFromContextName(contextName, _contextHierarchy);
                if (!_contextHierarchy.hasOwnProperty(contextName))
                    return false;

                target = _contextHierarchy[contextName];

                // If any context is referencing the target as a parent, rewrite the reference one level up.
                for (key in _contextHierarchy) {
                    if (_contextHierarchy.hasOwnProperty(key)) {
                        contextName = key;
                        contextInfo = _contextHierarchy[contextName];

                        if (contextInfo.parent === target.contextName)
                            contextInfo.parent = target.parent;

                        if (contextName != target.contextName)
                            newContextHierarchy[contextName] = contextInfo;
                    }
                }

                // Ensure that the deleted context is not in the stack
                if (_stack[0] === target.contextName)
                    contextChanged = true;

                angular.forEach(_stack, function(item) {
                    if (item !== target.contextName)
                        newStack.push(item);
                });

                _contextHierarchy = newContextHierarchy;

                if (contextChanged)
                    publish("keySMAC.context.change", ContextInfo.pathFromContextName(_stack[0], _contextHierarchy));

                if (_config.logging)
                    $log.info("keySMAC: deleted context '" + path + "'");

                if (_stack.length != newStack.length) {
                    _stack = newStack;

                    if (_config.logging) {
                        $log.info("keySMAC: stack modified as a result of deleting context '" + path + "'");
                        $log.info(JSON.stringify(_stack));
                    }
                }

                return true;
            }

            // usage:   deleteRegistration(context, shortcut)   -- removes shortcut from indicated context
            //          deleteRegistration(shortcut)    -- removes shortcut from first context in stack that has shortcut.

            // The context hierarchy is traversed (from the indicated context) upward, and the first matching shortcut
            // is removed.
            function deleteRegistration() {
                var isContextSpecified = (arguments.length === 2);
                var contextName = isContextSpecified ? arguments[0] : _stack[0];
                var registration;
                var shortCut = new ShortCut(arguments[arguments.length - 1]);

                var contextInfo;

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                contextInfo = _contextHierarchy[contextName];
                while (contextInfo) {
                    registration = contextInfo.findRegistration(shortCut);
                    if (registration) {
                        contextInfo.removeRegistration(shortCut);

                        if (_config.logging)
                            $log.info("keySmac: Deleted registration " + JSON.stringify(registration));
                        return true;
                    }

                    // If a context is specified, do not walk the hierarchy.
                    contextInfo = (!isContextSpecified && contextInfo.parent)
                        ? _contextHierarchy[contextInfo.parent] : null;
                }

                return false;
            }

            // Turn off keyboard shortcuts.
            function disable(config) {
                $document.unbind("keydown", keyHandler);
                _isEnabled = false;

                if (config.logging)
                    $log.info("keySMAC: Keyboard shortcuts disabled");
            }

            // Turn on keyboard shortcuts.
            function enable() {
                var contextName;
                var path;

                $document.bind("keydown", keyHandler);
                _isEnabled = true;

                if (_config.logging) {
                    contextName = _stack[0];
                    path = ContextInfo.pathFromContextName(contextName, _contextHierarchy);
                    $log.info("keySMAC: Keyboard shortcuts enabled; active context '" + path + "'");
                }
            }

            // usage:   findRegistration(context, shortcut)   -- finds a shortcut given a context
            //          findRegistration(shortcut)    -- finds a shortcut using the active context.
            // The context is searched hierarchically.
            // Return:  The context that has the found shortcut (or null).
            function findRegistration() {
                var contextName = (arguments.length === 2) ? arguments[0] : _stack[0];
                var shortCut = new ShortCut(arguments[arguments.length - 1]);

                var contextInfo;
                var registration;

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                contextInfo = _contextHierarchy[contextName];
                while (contextInfo) {
                    registration = contextInfo.findRegistration(shortCut);
                    if (registration)
                        return ContextInfo.pathFromContextName(contextInfo.contextName, _contextHierarchy);

                    contextInfo = contextInfo.parent ? _contextHierarchy[contextInfo.parent] : null;
                }

                return null;
            }

            function getActiveContext() {
                var contextName = _stack[0];
                return ContextInfo.pathFromContextName(contextName, _contextHierarchy);
            }

            // Return the set of registrations that could be triggered from a keyboard event. If a context is specified,
            // then the list will reflect the registrations when that context becomes active.  Otherwise, the context
            // that is currently active will be used.
            //
            // Note that only registrations that could fire will be returned, a shortcut defined at a higher level of
            // the hierarchy will not be returned if it has been overridden by a lower-level context.
            function getActiveRegistrations(contextNameOrPath) {
                var contextInfo;
                var contextName = contextNameOrPath ? ContextInfo.contextNameFromPath(contextNameOrPath) : _stack[0];
                var registration;
                var result = new ContextInfo();

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                contextInfo = _contextHierarchy[contextName];
                while (contextInfo) {
                    angular.forEach(contextInfo.registrations, function(item) {
                        if (!result.findRegistration(item.shortCut)) {
                            registration = new ShortCutRegistration(item);
                            registration.context = contextInfo;
                            result.addRegistration(registration);
                        }
                    });
                    contextInfo = contextInfo.parent ? _contextHierarchy[contextInfo.parent] : null;
                }

                return result.registrations;
            }

            function initialize(config) {
                var contextInfo;
                var contextName;
                var key;
                var Lamb;
                var path;

                if (!_bus) {
                    Lamb = $injector.has("Lamb") ? $injector.get("Lamb") : null;
                    _bus = Lamb ? new Lamb(SERVICE_NAME, $rootScope) : null;
                }

                if (!config)
                    config = $injector.has(KeySmacConfig.CONFIG_NAME)
                        ? new KeySmacConfig($injector.get(KeySmacConfig.CONFIG_NAME))
                        : new KeySmacConfig();

                if (config.configId === _configId)
                    return false;

                disable(config);

                _config = config;
                _configId = config.configId;
                _contextHierarchy = _config.buildContextHierarchy();    // Build the context hierarchy.
                _config.buildRegistrations(_contextHierarchy);          // Add the registrations from the configuration.
                clear();                                                // Initialize the context stack with the global context;

                if (_config.logging) {
                    for (key in _contextHierarchy) {
                        if (_contextHierarchy.hasOwnProperty(key)) {
                            contextName = key;
                            path = ContextInfo.pathFromContextName(contextName, _contextHierarchy);
                            $log.info("keySMAC: Added context '" + path + "'");

                            contextInfo = _contextHierarchy[contextName];
                            angular.forEach(contextInfo.registrations, function(registration) {
                                $log.info("keySMAC: Added registration " + JSON.stringify(registration));
                            });
                        }
                    }
                }

                if (_config.enabled)
                    enable();

                return true;
            }

            function keyHandler(keyEvent) {
                if (!_isEnabled)
                    return true;

                if (keyEvent.keyCode === ALT_KEYCODE || keyEvent.keyCode === CTRL_KEYCODE ||
                    keyEvent.keyCode === META_KEYCODE || keyEvent.keyCode === SHIFT_KEYCODE)
                    return false;

                var contextInfo;
                var contextName;
                var registration;
                var shortCut;

                shortCut = ShortCut.fromKeyEvent(keyEvent);

                contextName = _stack[0];
                contextInfo = _contextHierarchy[contextName];
                while (contextInfo) {
                    registration = contextInfo.findRegistration(shortCut);
                    if (registration && registration.callbackFn) {
                        (function(iife) {
                            $rootScope.$apply(function() {
                                iife.registration.callbackFn(iife.registration);
                            });
                        })({ registration: registration });

                        if (_config.logging)
                            $log.info("keySMAC: Shortcut " + shortCut.toDisplayString() + " handled by context '" + contextInfo.contextName + "'");

                        keyEvent.preventDefault();
                        return false;
                    }

                    contextInfo = (contextInfo.parent) ? _contextHierarchy[contextInfo.parent] : null;
                }

                if (_config.logging)
                    $log.warn("keySMAC: Shortcut " + shortCut.toDisplayString() + " was not handled.");

                return true;
            }

            // Pop the context off the top of the stack.  Any shortcut defined by this context will not be used.
            // If a context name is passed in, the stack will only be popped if the named context is on top.
            function pop(contextNameOrPath) {
                var contextName;

                if (_stack.length === 1) {
                    if (_config.logging)
                        $log.warn("keySMAC: Attempting to pop from empty stack");
                    return null;
                }

                if (contextNameOrPath) {
                    contextName = ContextInfo.contextNameFromPath(contextNameOrPath, _contextHierarchy);
                    if (_stack[0] !== contextName)
                        return null;
                }

                contextName = _stack.shift();
                var path = ContextInfo.pathFromContextName(contextName, _contextHierarchy);

                if (_stack.length === 0)
                    clear();

                publish("keySMAC.context.pop", path);

                if (_config.logging)
                    $log.info("keySMAC: popping '" + path + "'");

                return path;
            }

            function publish(topic, data) {
                if (_bus)
                    _bus.publish(topic, data);
            }

            // Push a context onto the stack.  This context will be the initial target for searching shortcuts.
            function push(contextNameOrPath) {
                var contextName = ContextInfo.contextNameFromPath(contextNameOrPath, _contextHierarchy);
                var path;

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                _stack.unshift(contextName);

                path = ContextInfo.pathFromContextName(contextName, _contextHierarchy);

                publish("keySMAC.context.push", path);

                if (_config.logging)
                    $log.info("keySMAC: pushing '" + path + "'")
            }

            // usage:   replaceRegistration(context, registration)   -- re-registers shortcut in given context.
            //          replaceRegistration(shortcut)    -- re-registers shortcut from first context in stack that has
            //              shortcut.  (Both calls) If the shortcut is not found, it will be added.
            //
            // return:  The name of the context where the registration was replaced or added.
            function replaceRegistration() {
                var isContextSpecified = (arguments.length === 2);
                var contextName = isContextSpecified ? arguments[0] : _stack[0];
                var newRegistration = new ShortCutRegistration(arguments[arguments.length - 1]);
                var shortCut = newRegistration.shortCut;

                var contextInfo;
                var registration;

                if (!_contextHierarchy.hasOwnProperty(contextName))
                    throw new Error("Context '" + contextName + "' is unknown.");

                contextInfo = _contextHierarchy[contextName];
                while (contextInfo) {
                    registration = contextInfo.findRegistration(shortCut);
                    if (registration) {
                        angular.extend(registration, newRegistration);

                        if (_config.logging)
                            $log.info("keySmac: Replaced registration " + JSON.stringify(registration));

                        return ContextInfo.pathFromContextName(contextInfo.contextName, _contextHierarchy);
                    }

                    // If a context is specified, do not walk the hierarchy.
                    contextInfo = (!isContextSpecified && contextInfo.parent)
                        ? _contextHierarchy[contextInfo.parent] : null;
                }

                addRegistration(contextName, newRegistration);
                return ContextInfo.pathFromContextName(contextName, _contextHierarchy);
            }


            return {
                ContextInfo: ContextInfo,
                KeySmacConfig: KeySmacConfig,
                ShortCut: ShortCut,
                ShortCutRegistration: ShortCutRegistration,

                addContext: addContext,
                addRegistration: addRegistration,
                clearContextStack: clear,
                deleteContext: deleteContext,
                deleteRegistration: deleteRegistration,
                disable: function() { disable(_config); },
                enable: enable,
                findRegistration: findRegistration,
                getActiveContext: getActiveContext,
                getActiveRegistrations: getActiveRegistrations,
                initialize: initialize,
                popContext: pop,
                pushContext: push,
                replaceRegistration: replaceRegistration
            }
        }]);
})();