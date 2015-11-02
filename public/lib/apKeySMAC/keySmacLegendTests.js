describe("keySmacLegendService Tests", function() {

    var $rootScope;
    var $templateCache;

    var ContextInfo;
    var ShortCut;
    var ShortCutRegistration;

    var keyService;
    var legendService;

    beforeEach(angular.mock.module("apKeySMAC"));

    // Initialization

    //noinspection JSCheckFunctionSignatures
    beforeEach(angular.mock.inject(
        ["$rootScope", "$templateCache", "keySmacModel", "keySMAC", "keySmacLegend",
        function(_$rootScope_, _$templateCache_, keySmacModel, keySMAC, keySmacLegend) {
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;

            ContextInfo = keySmacModel.ContextInfo;
            ShortCut = keySmacModel.ShortCut;
            ShortCutRegistration = keySmacModel.ShortCutRegistration;

            keyService = keySMAC;
            legendService = keySmacLegend;
        }]
    ));


    // Tests

    it("getTemplate_activeContextTest", function() {
        var element = null;
        var tdList;

        keyService.addRegistration(new ShortCutRegistration({
            shortCutName: "Moe",
            shortCut:  new ShortCut({ key: 'M' }),
            description: "Moe Howard - 1897"
        }));

        keyService.addRegistration(new ShortCutRegistration({
            shortCutName: "Larry",
            shortCut:  new ShortCut({ key: 'L' }),
            description: "Larry Fine - 1902"
        }));

        keyService.addRegistration(new ShortCutRegistration({
            shortCutName: "Curly",
            shortCut:  new ShortCut({ key: 'C' }),
            description: "Curly Howard - 1903"
        }));

        expect(keyService.getActiveRegistrations().length).toBe(3);

        legendService.getLegend().then(function(legend) {
            element = angular.element(legend);
        });

        $rootScope.$apply();
        $rootScope.$apply();

        tdList = element.find("td");
        expect(tdList.length).toBe(9);

        expect(tdList[0].innerText).toBe('M');
        expect(tdList[1].innerText).toBe("Moe");
        expect(tdList[2].innerText).toBe("Moe Howard - 1897");

        expect(tdList[3].innerText).toBe('L');
        expect(tdList[4].innerText).toBe("Larry");
        expect(tdList[5].innerText).toBe("Larry Fine - 1902");

        expect(tdList[6].innerText).toBe('C');
        expect(tdList[7].innerText).toBe("Curly");
        expect(tdList[8].innerText).toBe("Curly Howard - 1903");
    });

    it("getTemplate_namedContextTest", function() {
        var element = null;
        var tdList;

        keyService.addContext("stooges");

        keyService.addRegistration("stooges", new ShortCutRegistration({
            shortCutName: "Moe",
            shortCut:  new ShortCut({ key: 'M' }),
            description: "Moe Howard - 1897"
        }));

        keyService.addRegistration("stooges", new ShortCutRegistration({
            shortCutName: "Larry",
            shortCut:  new ShortCut({ key: 'L' }),
            description: "Larry Fine - 1902"
        }));

        keyService.addRegistration("stooges", new ShortCutRegistration({
            shortCutName: "Curly",
            shortCut:  new ShortCut({ key: 'C' }),
            description: "Curly Howard - 1903"
        }));

        expect(keyService.getActiveRegistrations().length).toBe(0);

        legendService.getLegend("stooges").then(function(legend) {
            element = angular.element(legend);
        });

        $rootScope.$apply();
        $rootScope.$apply();

        tdList = element.find("td");
        expect(tdList.length).toBe(9);

        expect(tdList[0].innerText).toBe('M');
        expect(tdList[1].innerText).toBe("Moe");
        expect(tdList[2].innerText).toBe("Moe Howard - 1897");

        expect(tdList[3].innerText).toBe('L');
        expect(tdList[4].innerText).toBe("Larry");
        expect(tdList[5].innerText).toBe("Larry Fine - 1902");

        expect(tdList[6].innerText).toBe('C');
        expect(tdList[7].innerText).toBe("Curly");
        expect(tdList[8].innerText).toBe("Curly Howard - 1903");
    });

    it("setTemplate_simpleTest", function() {
        var markup = null;
        var template = "<p>This is a simple, do nothing template!</p>";

        legendService.setTemplate(template);
        legendService.getLegend().then(function(legend) {
            markup = legend;
        });

        $rootScope.$apply();
        $rootScope.$apply();

        expect(markup.indexOf("do nothing")).not.toBe(-1);
    });

    it("setTemplate_bindingTest", function() {
        var element = null;
        var spanList;
        var template;

        keyService.addContext("stooges");

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Moe", shortCut:  new ShortCut({ key: 'M' }) }));

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Larry", shortCut:  new ShortCut({ key: 'L' }) }));

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Curly", shortCut:  new ShortCut({ key: 'C' }) }));

        expect(keyService.getActiveRegistrations("stooges").length).toBe(3);

        template = '<div><span ng-repeat="registration in registrations">{{registration.shortCutName}}</span></div>';
        legendService.setTemplate(template);

        legendService.setTemplate(template);
        legendService.getLegend("stooges").then(function(legend) {
            element = angular.element(legend);
        });

        $rootScope.$apply();
        $rootScope.$apply();

        spanList = element.find("span");
        expect(spanList.length).toBe(3);

        expect(spanList[0].innerText).toBe("Moe");
        expect(spanList[1].innerText).toBe("Larry");
        expect(spanList[2].innerText).toBe("Curly");
    });

    it("setTemplateUrl_simpleTest", function() {
        var markup = null;

        $templateCache.put("simple.html", "<p>This is a simple, do nothing template!</p>");

        legendService.setTemplateUrl("simple.html");
        legendService.getLegend(ContextInfo.ROOT).then(function(legend) {
            markup = legend;
        });

        $rootScope.$apply();
        $rootScope.$apply();

        expect(markup.indexOf("do nothing")).not.toBe(-1);
    });

    it("setTemplateUrl_bindingTest", function() {
        var element = null;
        var spanList;

        keyService.addContext("stooges");

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Moe", shortCut:  new ShortCut({ key: 'M' }) }));

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Larry", shortCut:  new ShortCut({ key: 'L' }) }));

        keyService.addRegistration("stooges",
            new ShortCutRegistration({ shortCutName: "Curly", shortCut:  new ShortCut({ key: 'C' }) }));

        expect(keyService.getActiveRegistrations("stooges").length).toBe(3);

        $templateCache.put("stooges.html",
            '<div><span ng-repeat="registration in registrations">{{registration.shortCutName}}</span></div>');
        legendService.setTemplateUrl("stooges.html");

        expect(keyService.getActiveRegistrations().length).toBe(0);
        keyService.pushContext("stooges");
        expect(keyService.getActiveRegistrations().length).toBe(3);

        legendService.getLegend().then(function(legend) {
            element = angular.element(legend);
        });

        $rootScope.$apply();
        $rootScope.$apply();

        spanList = element.find("span");
        expect(spanList.length).toBe(3);

        expect(spanList[0].innerText).toBe("Moe");
        expect(spanList[1].innerText).toBe("Larry");
        expect(spanList[2].innerText).toBe("Curly");
    });
});