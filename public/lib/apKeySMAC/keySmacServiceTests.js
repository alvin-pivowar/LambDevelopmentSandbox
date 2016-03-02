describe("keySMAC Service Tests", function() {

    var ContextInfo;
    var KeySmacConfig;

    var service;


    // Initialization

    beforeEach(function() {
        module("apKeySMAC");
    });

    beforeEach(function() {
        inject(["keySmacModel", "keySMAC", function(keySmacModel, keySMAC) {
            ContextInfo = keySmacModel.ContextInfo;
            KeySmacConfig = keySmacModel.KeySmacConfig;

            service = keySMAC;
        }]);
    });

    beforeEach(function() {
        service.initialize();
    });


    // Helper Methods

    function addShortcut(context, isAlt, isControl, isMeta, isShift, key) {
        var registration;
        var shortCut;

        shortCut = new service.ShortCut({
            isAlt: isAlt,
            isControl: isControl,
            isMeta: isMeta,
            isShift: isShift,
            key: key
        });

        registration = new service.ShortCutRegistration({
            callbackFn: function() {},
            callerInfo: {},
            description: "test registration",
            shortCut: shortCut,
            shortCutName: shortCut.toDisplayString()
        });

        service.addRegistration(context, registration);
    }


    function setUpHierarchy()
    {
        service.addContext(ContextInfo.ROOT + "/moe/larry/curly");

        service.addRegistration(new service.ShortCutRegistration({
            shortCutName: "app",
            shortCut: new service.ShortCut({ isShift: true, key: '$'})
        }));

        service.addRegistration("moe", new service.ShortCutRegistration({
            shortCutName: "moe",
            shortCut: new service.ShortCut({ isShift: true, key: 'm'})
        }));

        service.addRegistration("larry", new service.ShortCutRegistration({
            shortCutName: "larry",
            shortCut: new service.ShortCut({ isShift: true, key: 'l'})
        }));

        service.addRegistration("curly", new service.ShortCutRegistration({
            shortCutName: "curly",
            shortCut: new service.ShortCut({ isShift: true, key: 'c'})
        }));
    }

    function triggerKeyboardEvent(isAlt, isControl, isMeta, isShift, key) {
        var event;

        event = new window.KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true
        });


        delete event.keyCode;
        Object.defineProperty(event, "keyCode", { "value": key.charCodeAt(0)});
        Object.defineProperty(event, "altKey", { "value": isAlt});
        Object.defineProperty(event, "ctrlKey", { "value": isControl});
        Object.defineProperty(event, "metaKey", { "value": isMeta});
        Object.defineProperty(event, "shiftKey", { "value": isShift});

        window.document.dispatchEvent(event);
    }


    // Tests

    it("addContext_simpleTest", function() {
        expect(service.addContext("x")).toBeTruthy();
        expect(service.addContext("x")).toBeFalsy();
    });

    it("addContext_partsTest", function() {
        expect(service.addContext(ContextInfo.ROOT + "/moe/larry/curly")).toBeTruthy();
        expect(service.addContext(ContextInfo.ROOT + "/moe/larry/curly")).toBeFalsy();
        expect(service.addContext(ContextInfo.ROOT + "/moe/larry/shemp")).toBeTruthy();
    });

    it("addContext_hierarchyTest", function() {
        var registrations;

        setUpHierarchy();
        service.pushContext("curly");
        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(4);

        angular.forEach(registrations, function(registration) {
            var contextInfo = registration.context;
            switch(registration.shortCutName) {
                case "app":
                    expect(contextInfo.parent).toBeNull();
                    break;
                case "moe":
                    expect(contextInfo.parent).toBe(ContextInfo.ROOT);
                    break;
                case "larry":
                    expect(contextInfo.parent).toBe("moe");
                    break;
                case "curly":
                    expect(contextInfo.parent).toBe("larry");
                    break;
            }
        });
    });

    it("addRegistration_addToActiveTest", function() {
        var contextInfo;
        var registration;
        var registrations;
        var shortCut;

        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(0);

        shortCut = new service.ShortCut({ isMeta: true, key: 'a' });

        registration = new service.ShortCutRegistration({
            callbackFn: function() { return "testCallbackFn"; },
            callerInfo: { moe: 1897, larry: 1902, curly: 1903 },
            description: "testDescription",
            shortCut: shortCut,
            shortCutName: "testShortCutName"
        });

        service.addRegistration(registration);

        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(1);

        registration = registrations[0];
        expect(registration.callbackFn()).toBe("testCallbackFn");

        expect(angular.isObject(registration.callerInfo)).toBeTruthy();
        expect(registration.callerInfo.moe).toBe(1897);
        expect(registration.callerInfo.larry).toBe(1902);
        expect(registration.callerInfo.curly).toBe(1903);

        expect(registration.description).toBe("testDescription");

        shortCut = registration.shortCut;
        expect(shortCut.isAlt).toBeFalsy();
        expect(shortCut.isControl).toBeFalsy();
        expect(shortCut.isMeta).toBeTruthy();
        expect(shortCut.isShift).toBeFalsy();
        expect(shortCut.key).toBe('A');

        expect(registration.shortCutName).toBe("testShortCutName");

        // Extras
        expect(angular.isObject(registration.context)).toBeTruthy();
        contextInfo = registration.context;
        expect(contextInfo.contextName).toBe(ContextInfo.ROOT);
        expect(contextInfo.parent).toBeNull();

        delete registrations[0].context;
        expect(JSON.stringify(contextInfo.registrations)).toMatch(JSON.stringify(registrations));
    });

    it("addRegistration_addToSpecifiedTest", function() {
        var registration;
        var registrations;
        var shortCut;

        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(0);

        service.addContext("x");
        shortCut = new service.ShortCut({ isMeta: true, key: 'a' });
        registration = new service.ShortCutRegistration({ shortCut: shortCut });
        service.addRegistration("x", registration);

        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(0);

        service.pushContext("x");
        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(1);
    });

    it("clearContextStackTest", function() {
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT);
        expect(service.clearContextStack()).toBeFalsy();
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT);

        service.addContext(ContextInfo.ROOT + "/x");
        service.pushContext("x");
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT + "/x");

        expect(service.clearContextStack()).toBeTruthy();
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT);
    });

    it("deleteContext_simpleTest", function() {
        expect(service.deleteContext("x")).toBeFalsy();

        service.addContext("x");
        expect(service.deleteContext("x")).toBeTruthy();
        expect(service.deleteContext("x")).toBeFalsy();
    });

    it("deleteContext_hierarchyTest", function() {
        var registrations;

        setUpHierarchy();
        service.pushContext("curly");

        // When we delete the 'larry' context, curly's parent should change to moe.
        expect(service.deleteContext("larry")).toBeTruthy();

        registrations = service.getActiveRegistrations();
        expect(registrations.length).toBe(3);

        angular.forEach(registrations, function(registration) {
            var contextInfo = registration.context;
            switch(registration.shortCutName) {
                case "app":
                    expect(contextInfo.parent).toBeNull();
                    break;
                case "moe":
                    expect(contextInfo.parent).toBe(ContextInfo.ROOT);
                    break;
                case "larry":
                    throw new Error("larry context should have been deleted");
                case "curly":
                    expect(contextInfo.parent).toBe("moe");
                    break;
            }
        });
    });

    it("deleteContext_topOfStackTest", function() {
        service.addContext("w");
        service.addContext("x");
        service.addContext("y");
        service.addContext("z");

        service.pushContext("z");
        service.pushContext("y");
        service.pushContext("x");
        service.pushContext("w");

        expect(service.getActiveContext()).toBe("w");

        expect(service.deleteContext("w")).toBeTruthy();
        expect(service.getActiveContext()).toBe("x");
    });

    it("deleteContext_middleOfStackTest", function() {
        service.addContext("w");
        service.addContext("x");
        service.addContext("y");
        service.addContext("z");

        service.pushContext("z");
        service.pushContext("y");
        service.pushContext("x");
        service.pushContext("w");

        expect(service.getActiveContext()).toBe("w");

        expect(service.deleteContext("x")).toBeTruthy();
        expect(service.getActiveContext()).toBe("w");

        expect(service.popContext()).toBe("w");
        expect(service.getActiveContext()).toBe("y");
    });

    it("deleteRegistration_badContextTest", function() {
        expect(function() {
            service.deleteRegistration("badContext", new service.ShortCut({ key: 'A' }));
        }).toThrow();
    });

    it("deleteRegistration_unknownShortcutTest", function() {
        expect(service.deleteRegistration(ContextInfo.ROOT, new service.ShortCut({ key: 'A' }))).toBeFalsy();
    });

    it("deleteRegistration_contextTest", function() {
        var shortCut;

        setUpHierarchy();

        // Attempting to delete larry's shortcut, given curly should fail.
        shortCut = new service.ShortCut({ isShift: true, key: 'l'});
        expect(service.deleteRegistration("curly", shortCut)).toBeFalsy();

        // But if we choose larry, it should succeed.
        expect(service.deleteRegistration("larry", shortCut)).toBeTruthy();
    });

    it("delete_registration_contextHierarchyTest", function() {
        var shortCut;

        setUpHierarchy();
        service.pushContext("curly");

        // Attempting to delete larry's shortcut given the active context (curly) should succeed.
        shortCut = new service.ShortCut({ isShift: true, key: 'l'});
        expect(service.deleteRegistration(shortCut)).toBeTruthy();
    });

    it("disableAndEnableTest", function() {
        var callbackFn;
        var registration;
        var shortCut;
        var wasHandled;

        callbackFn = function() {
          wasHandled = true;
        };

        shortCut = new service.ShortCut({ isControl: true, key: 't' });
        registration = new service.ShortCutRegistration({
            callbackFn: callbackFn,
            shortCut: shortCut
        });
        service.addRegistration(registration);

        wasHandled = false;
        service.enable();
        triggerKeyboardEvent(false, true, false, false, 'T');
        expect(wasHandled).toBeTruthy();

        wasHandled = false;
        service.disable();
        triggerKeyboardEvent(false, true, false, false, 'T');
        expect(wasHandled).toBeFalsy();
    });

    it("getActiveContextTest", function() {
        setUpHierarchy();

        expect(service.getActiveContext()).toBe(ContextInfo.ROOT);
        service.pushContext("moe");
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT + "/moe");
        service.pushContext("larry");
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT + "/moe/larry");
        service.pushContext("curly");
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT + "/moe/larry/curly");

        expect(service.popContext()).toBe(ContextInfo.ROOT + "/moe/larry/curly");
        service.clearContextStack();
        expect(service.getActiveContext()).toBe(ContextInfo.ROOT);
    });

    //  'ROOT': alt 'A'
    //      alpha: ctrl 'A'
    //          beta: ctrl 'B'
    //              gamma: alt 'A'
    //
    //  one: shift 'A'
    //      two: shift 'B'
    it("getActiveRegistrations_contextTest", function() {
        var registrations;

        service.addContext(ContextInfo.ROOT + "/alpha/beta/gamma");
        service.addContext("one/two");

        addShortcut(ContextInfo.ROOT, true, false, false, false, 'a');
        addShortcut("alpha", false, true, false, false, 'a');
        addShortcut("beta", false, true, false, false, 'b');
        addShortcut("gamma", true, false, false, false, 'a');

        addShortcut("one", false, false, false, true, 'a');
        addShortcut("two", false, false, false, true, 'b');

        // The gamma registrations have three:
        // alt 'A' overridden by gamma
        // ctrl 'A' from alpha
        // ctrl 'B' from beta
        registrations = service.getActiveRegistrations("gamma");
        expect(registrations.length).toBe(3);

        // The 'two' registrations have two:
        // shift 'A' from one
        // shift 'B' from two
        registrations = service.getActiveRegistrations("two");
        expect(registrations.length).toBe(2);
    });

    it("initialization_differentConfigTest", function() {
        var config12 = new KeySmacConfig({ contexts: ["$app/config1/config2"] });
        var config34 = new KeySmacConfig({ contexts: ["config3", "config4"] });

        expect(service.initialize(config12)).toBeTruthy();
        service.pushContext("config2");

        expect(service.initialize(config34)).toBeTruthy();
        service.pushContext("config3");
    });

    it("initialization_sameConfigTest", function() {
        var config12 = new KeySmacConfig({ contexts: ["$app/config1/config2"] });

        expect(service.initialize(config12)).toBeTruthy();
        expect(service.initialize(config12)).toBeFalsy();
    });

    it("popAndPushTest", function() {
        var contextName;
        var contextNames = [];
        var contextCount;
        var i;

        contextCount = Math.floor(10 * Math.random());
        for (i = 0; i < contextCount; ++i) {
            contextName = "context" + String.fromCharCode('A'.charCodeAt(0) + i);
            service.addContext(contextName);
            contextNames.push(contextName);
        }

        while (contextNames.length > 0) {
            contextName = contextNames.pop();
            service.pushContext(contextName);
            expect(service.getActiveContext()).toBe(contextName);
        }

        contextName = service.getActiveContext();
        while (contextName != ContextInfo.ROOT) {
            expect(service.popContext()).toBe(contextName);
            contextName = service.getActiveContext();
        }
    });
});