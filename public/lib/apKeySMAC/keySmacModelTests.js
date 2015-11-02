describe("keySmacModelProvider Tests", function() {

    var ContextInfo;
    var KeySmacConfig;
    var ShortCut;
    var ShortCutRegistration;

    var service;

    beforeEach(angular.mock.module("apKeySMAC"));

    beforeEach(angular.mock.inject(function(keySmacModel, keySMAC) {
        ContextInfo = keySmacModel.ContextInfo;
        KeySmacConfig = keySmacModel.KeySmacConfig;
        ShortCut = keySmacModel.ShortCut;
        ShortCutRegistration = keySmacModel.ShortCutRegistration;

        service = keySMAC;
    }));


    // ContextInfo Tests

    it("ContextInfo_addRegistrationTest", function() {
        var contextInfo = new ContextInfo();
        expect(contextInfo.registrations.length).toBe(0);

        contextInfo.addRegistration("testRegistration");
        expect(contextInfo.registrations.length).toBe(1);
        expect(contextInfo.registrations[0]).toBe("testRegistration");
    });

    it("ContextInfo_findRegistrationTest", function() {
        var contextInfo = new ContextInfo();
        var registration;

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isAlt: true, key: 'a' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isControl: true, key: 'b' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isMeta: true, key: 'c' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isShift: true, key: 'd' })
        }));


        expect(contextInfo.findRegistration(new ShortCut({ isControl: true, key: 'c' }))).toBeNull();

        registration = contextInfo.findRegistration(new ShortCut({ isShift: true, key: 'D' }));
        expect(registration).toBeDefined();
        expect(registration.shortCut.isShift).toBeTruthy();
        expect(registration.shortCut.key).toBe('D');
    });

    it("ContextInfo_removeRegistrationTest", function() {
        var contextInfo = new ContextInfo();

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isAlt: true, key: 'a' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isControl: true, key: 'b' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isMeta: true, key: 'c' })
        }));

        contextInfo.addRegistration(new ShortCutRegistration({
            shortCut: new ShortCut({ isShift: true, key: 'd' })
        }));

        expect(contextInfo.registrations.length).toBe(4);
        expect(contextInfo.findRegistration(new ShortCut({ isMeta: true, key: 'c' }))).toBeDefined();

        expect(contextInfo.removeRegistration(new ShortCut({ isControl: true, key: 'c' }))).toBeFalsy();
        expect(contextInfo.findRegistration(new ShortCut({ isMeta: true, key: 'c' }))).toBeDefined();

        expect(contextInfo.removeRegistration(new ShortCut({ isMeta: true, key: 'c' }))).toBeTruthy();
        expect(contextInfo.findRegistration(new ShortCut({ isMeta: true, key: 'c' }))).toBeNull();
    });

    it("ContextInfo_ROOT", function() {
        expect(ContextInfo.ROOT).toBe("$app");
    });

    it("ContextInfo_contextNameFromPath", function() {
        expect(ContextInfo.contextNameFromPath("a")).toBe("a");
        expect(ContextInfo.contextNameFromPath("$app/a/b")).toBe("b");
        expect(ContextInfo.contextNameFromPath("a/b/c")).toBe("c");
        expect(ContextInfo.contextNameFromPath("$app/a/b/c/d")).toBe("d");
    });

    it("ContextInfo_pathFromContextName", function() {
        var contextHierarchy;

        contextHierarchy = {
            $app: new ContextInfo("$app", null),
            one: new ContextInfo("one", "$app"),
            two: new ContextInfo("two", "one"),
            three: new ContextInfo("three", "one"),
            alpha: new ContextInfo("alpha", null),
            beta: new ContextInfo("beta", "alpha"),
            gamma: new ContextInfo("gamma", "beta")
        };

        expect(ContextInfo.pathFromContextName(ContextInfo.ROOT, contextHierarchy)).toBe("$app");
        expect(ContextInfo.pathFromContextName("one", contextHierarchy)).toBe("$app/one");
        expect(ContextInfo.pathFromContextName("two", contextHierarchy)).toBe("$app/one/two");
        expect(ContextInfo.pathFromContextName("three", contextHierarchy)).toBe("$app/one/three");
        expect(ContextInfo.pathFromContextName("alpha", contextHierarchy)).toBe("alpha");
        expect(ContextInfo.pathFromContextName("beta", contextHierarchy)).toBe("alpha/beta");
        expect(ContextInfo.pathFromContextName("gamma", contextHierarchy)).toBe("alpha/beta/gamma");
    });


    // KeySmacConfig Tests

    it("KeySmacConfig_constructor_configId", function() {
        var config1;
        var config2;
        var config3;

        config1 = new KeySmacConfig();
        expect(isFinite(config1.configId)).toBeTruthy();
        config2 = new KeySmacConfig();
        expect(isFinite(config1.configId)).toBeTruthy();
        expect(config2.configId).not.toBe(config1.configId);

        config3 = new KeySmacConfig(config1);
        expect(isFinite(config3.configId)).toBeTruthy();
        expect(config3.configId).toBe(config1.configId);
    });

    it("KeySmacConfig_constructor_contexts", function() {
        var config;

        config = new KeySmacConfig();
        expect(config.contexts.length).toBe(1);
        expect(config.contexts[0]).toBe(ContextInfo.ROOT);

        config = new KeySmacConfig({
            contexts: ["a", "$app/b", "c/d"]
        });
        expect(config.contexts.length).toBe(4);
        expect(config.contexts[0]).toBe(ContextInfo.ROOT);
        expect(config.contexts[1]).toBe("a");
        expect(config.contexts[2]).toBe("$app/b");
        expect(config.contexts[3]).toBe("c/d");
    });

    it("KeySmacConfig_constructor_enabled", function() {
        var config;

        config = new KeySmacConfig();
        expect(config.enabled).toBe(true);

        config = new KeySmacConfig({ enabled: true });
        expect(config.enabled).toBe(true);

        config = new KeySmacConfig({ enabled: false });
        expect(config.enabled).toBe(false);
    });

    it("KeySmacConfig_buildContextHierarchy", function() {
        var config;
        var contextHierarchy;
        var contextInfo;
        var key;

        config = new KeySmacConfig({
            contexts: ["$app/one/two", "one/three", "alpha/beta/gamma"]
        });
        contextHierarchy = config.buildContextHierarchy();

        for (key in contextHierarchy) {
            if (contextHierarchy.hasOwnProperty(key)) {
                contextInfo = contextHierarchy[key];

                switch(contextInfo.contextName) {
                    case "$app":
                        expect(contextInfo.parent).toBeNull();
                        break;
                    case "alpha":
                        expect(contextInfo.parent).toBeNull();
                        break;
                    case "beta":
                        expect(contextInfo.parent).toBe("alpha");
                        break;
                    case "gamma":
                        expect(contextInfo.parent).toBe("beta");
                        break;
                    case "one":
                        expect(contextInfo.parent).toBe("$app");
                        break;
                    case "three":
                        expect(contextInfo.parent).toBe("one");
                        break;
                    case "two":
                        expect(contextInfo.parent).toBe("one");
                }
            }
        }
    });

    it("KeySmacConfig_buildRegistrationsTest", function() {
        var config;
        var contextHierarchy;

        config = new KeySmacConfig({
            contexts: ["$app/one/two", "one/three", "alpha/beta/gamma"],
            registrations: {
                $app: [new ShortCutRegistration({ shortCut: new ShortCut({ isControl: true, key: 'A' }) })],
                alpha: [new ShortCutRegistration({ shortCut: new ShortCut({ isMeta: true, key: 'A' }) })],
                beta: [new ShortCutRegistration({ shortCut: new ShortCut({ isMeta: true, key: 'B' }) })],
                gamma: [new ShortCutRegistration({ shortCut: new ShortCut({ isMeta: true, key: 'G' }) })],
                one: [new ShortCutRegistration({ shortCut: new ShortCut({ isShift: true, key: 'O' }) })],
                two: [new ShortCutRegistration({ shortCut: new ShortCut({ isShift: true, key: 'T' }) })],
                three: [new ShortCutRegistration({ shortCut: new ShortCut({ isShift: true, key: 'T' }) })]
            }
        });

        contextHierarchy = config.buildContextHierarchy();
        config.buildRegistrations(contextHierarchy);

        expect(contextHierarchy.$app.registrations[0].shortCut.key).toBe('A');
        expect(contextHierarchy.alpha.registrations[0].shortCut.key).toBe('A');
        expect(contextHierarchy.beta.registrations[0].shortCut.key).toBe('B');
        expect(contextHierarchy.gamma.registrations[0].shortCut.key).toBe('G');
        expect(contextHierarchy.one.registrations[0].shortCut.key).toBe('O');
        expect(contextHierarchy.two.registrations[0].shortCut.key).toBe('T');
        expect(contextHierarchy.three.registrations[0].shortCut.key).toBe('T');
    });

    it("KeySmacConfig_initialize", function() {
        var config;

        expect(service.getActiveRegistrations().length).toBe(0);

        config = new KeySmacConfig({
            registrations: {
                $app: [new ShortCutRegistration({ shortCut: new ShortCut({ isControl: true, key: 'A' }) })]
            }
        });

        expect(config.initializeService()).toBeTruthy();
        expect(service.getActiveRegistrations().length).toBe(1);

        expect(config.initializeService()).toBeFalsy();
    });

    it("KeySmacConfig_CONFIG_NAME", function() {
        expect(KeySmacConfig.CONFIG_NAME).toBe("keySmacConfig");
    });


    // ShortCut

    it("ShortCut_constructor_illegal", function() {
        expect(function() {
            new ShortCut();
        }).toThrow();
    });

    it("ShortCut_constructor_badKey", function() {
        expect(function() {
            new ShortCut({ key: null });
        }).toThrow();

        expect(function() {
            new ShortCut({ key: "illegal" });
        }).toThrow();
    });

    // Alphabetic characters are converted to upper case,
    // all others are stored unchanged.
    it("ShortCut_constructor_key", function() {
        var shortCut;

        shortCut = new ShortCut({ key: '^'});
        expect(shortCut.key).toBe('^');

        shortCut = new ShortCut({ key: '6'});
        expect(shortCut.key).toBe('6');

        shortCut = new ShortCut({ key: 't'});
        expect(shortCut.key).toBe('T');

        shortCut = new ShortCut({ key: 'Y'});
        expect(shortCut.key).toBe('Y');
    });

    it("ShortCut_equals", function() {
        expect(new ShortCut({ key: 'o'}).equals(new ShortCut({ key: 'O'}))).toBeTruthy();
        expect(new ShortCut({ key: 'o'}).equals(new ShortCut({ key: '0'}))).toBeFalsy();


        expect(new ShortCut({ isControl: true, key: 'K'})
            .equals(new ShortCut({ isControl: true, key: 'K'}))).toBeTruthy();

        expect(new ShortCut({ isAlt: true, key: 'K'})
            .equals(new ShortCut({ isAlt: true, key: 'K'}))).toBeTruthy();

        expect(new ShortCut({ isControl: true, isMeta: true, key: 'K'})
            .equals(new ShortCut({ isControl: true, isMeta: true, key: 'K'}))).toBeTruthy();

        expect(new ShortCut({ isAlt: true, isControl: true, isMeta: true, isShift: true, key: 'K'})
            .equals(new ShortCut({ isAlt: true, isControl: true, isMeta: true, isShift: true, key: 'K'}))).toBeTruthy();

        expect(new ShortCut({ isAlt: true, isControl: true, key: 'K'})
            .equals(new ShortCut({ isAlt: true, isControl: true, key: 'K'}))).toBeTruthy();


        expect(new ShortCut({ isAlt: true, isControl: true, key: 'K'})
            .equals(new ShortCut({ isControl: true, isShift: true, key: 'K'}))).toBeFalsy();

        expect(new ShortCut({ isControl: true, key: 'K'})
            .equals(new ShortCut({ key: 'K'}))).toBeFalsy();

        expect(new ShortCut({ isAlt: true, isMeta: true, isShift: true, key: 'K'})
            .equals(new ShortCut({ isAlt: true, isMeta: true, key: 'K'}))).toBeFalsy();

        expect(new ShortCut({ isAlt: true, isMeta: true, key: 'K'})
            .equals(new ShortCut({ isAst: true, isControl: true, isMeta: true, isShift: true, key: 'K'}))).toBeFalsy();

        expect(new ShortCut({ isControl: true, isMeta: true, key: 'K'})
            .equals(new ShortCut({ isMeta: true, key: 'K'}))).toBeFalsy();
    });

    it("ShortCut_toDisplayString", function() {
        expect(new ShortCut({ isControl: true, key: 'i'}).toDisplayString()).toBe("CONTROL+I");
        expect(new ShortCut({ isAlt: true, key: '8'}).toDisplayString()).toBe("ALT+8");
        expect(new ShortCut({ isControl: true, isMeta: true, key: '*'}).toDisplayString()).toBe("CONTROL+META+*");
        expect(new ShortCut({ isAlt: true, isControl: true, isMeta: true, isShift: true, key: '&'})
            .toDisplayString()).toBe("CONTROL+SHIFT+ALT+META+&");
        expect(new ShortCut({ isAlt: true, isControl: true, key: 'y'}).toDisplayString()).toBe("CONTROL+ALT+Y");
    });

    it("ShortCut_fromKeyEvent", function() {
        var event;
        var shortCut;

        event = { altKey: true, ctrlKey: true, keyCode: 34 };
        shortCut = ShortCut.fromKeyEvent(event);
        expect(shortCut.isAlt).toBeTruthy();
        expect(shortCut.isControl).toBeTruthy();
        expect(shortCut.isMeta).toBeFalsy();
        expect(shortCut.isShift).toBeFalsy();
        expect(shortCut.key).toBe('"');

        event = { ctrlKey: true, shiftKey: true, keyCode: 41 };
        shortCut = ShortCut.fromKeyEvent(event);
        expect(shortCut.isAlt).toBeFalsy();
        expect(shortCut.isControl).toBeTruthy();
        expect(shortCut.isMeta).toBeFalsy();
        expect(shortCut.isShift).toBeTruthy();
        expect(shortCut.key).toBe(')');

        event = { shiftKey: true, keyCode: 118 };
        shortCut = ShortCut.fromKeyEvent(event);
        expect(shortCut.isAlt).toBeFalsy();
        expect(shortCut.isControl).toBeFalsy();
        expect(shortCut.isMeta).toBeFalsy();
        expect(shortCut.isShift).toBeTruthy();
        expect(shortCut.key).toBe('V');

        event = { altKey: true, ctrlKey: true, shiftKey: true, keyCode: 82 };
        shortCut = ShortCut.fromKeyEvent(event);
        expect(shortCut.isAlt).toBeTruthy();
        expect(shortCut.isControl).toBeTruthy();
        expect(shortCut.isMeta).toBeFalsy();
        expect(shortCut.isShift).toBeTruthy();
        expect(shortCut.key).toBe('R');

        event = { ctrlKey: true, metaKey: true, shiftKey: true, keyCode: 68 };
        shortCut = ShortCut.fromKeyEvent(event);
        expect(shortCut.isAlt).toBeFalsy();
        expect(shortCut.isControl).toBeTruthy();
        expect(shortCut.isMeta).toBeTruthy();
        expect(shortCut.isShift).toBeTruthy();
        expect(shortCut.key).toBe('D');
    })
});