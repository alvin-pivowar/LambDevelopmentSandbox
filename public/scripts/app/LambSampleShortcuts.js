/* Copyright (c) 2015 Alvin Pivowar */
(function(){
    "use strict";

    var $location;

    var KeySmacConfig = null;
    var ShortCut;
    var ShortCutRegistration;


    // Get the keySMAC models from the provider
    (function() {
        var $injector = angular.injector(["apKeySMAC"]);
        var keySmacModel = $injector.get("keySmacModel");

        KeySmacConfig = keySmacModel.KeySmacConfig;
        ShortCut = keySmacModel.ShortCut;
        ShortCutRegistration = keySmacModel.ShortCutRegistration;
    })();


    angular
        .module("LambSample")
        .provider(KeySmacConfig.CONFIG_NAME, function() {
            var config;

            var example1ShortCut = new ShortCut({ isAlt: true, key: '1' });
            var example2ShortCut = new ShortCut({ isAlt: true, key: '2' });
            var example3ShortCut = new ShortCut({ isAlt: true, key: '3' });
            var colorChipShortCut = new ShortCut({ isAlt: true, key: 'c' });
            var statusShortCut = new ShortCut({ isAlt: true, key: 's' });

            function onNavShortcut(registration) {
                var urls = {
                    '1': "/ex1",
                    '2': "/ex2",
                    '3': "/ex3",
                    'C': "/chip",
                    'S': "/status"
                };

                var url = urls[registration.shortCut.key];
                $location.path(url);
            }

            config = new KeySmacConfig({
                logging: true,
                registrations: {
                    $app: [
                        new ShortCutRegistration({
                            shortCut: example1ShortCut,
                            shortCutName: "Example 1",
                            description: "Navigate to the first tab",
                            callbackFn: onNavShortcut
                        }),

                        new ShortCutRegistration({
                            shortCut: example2ShortCut,
                            shortCutName: "Example 2",
                            description: "Navigate to the second tab",
                            callbackFn: onNavShortcut
                        }),

                        new ShortCutRegistration({
                            shortCut: example3ShortCut,
                            shortCutName: "Example 3",
                            description: "Navigate to the third tab",
                            callbackFn: onNavShortcut
                        }),

                        new ShortCutRegistration({
                            shortCut: colorChipShortCut,
                            shortCutName: "Color Chip",
                            description: "Navigate to the fourth tab",
                            callbackFn: onNavShortcut
                        }),

                        new ShortCutRegistration({
                            shortCut: statusShortCut,
                            shortCutName: "Status",
                            description: "Navigate to the fifth tab",
                            callbackFn: onNavShortcut
                        })
                    ]
                }
            });

            return {
                $get: [function() { return config; }]
            }
        });

    angular
        .module("LambSample")
        .run(["$location", "keySMAC", KeySmacConfig.CONFIG_NAME, function(_$location_, keySMAC, config) {
            $location = _$location_;
            config.initializeService();
        }]);
})();
