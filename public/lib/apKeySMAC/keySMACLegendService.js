(function() {
    "use strict";

    var DEFAULT_TEMPLATE = '' +
        '<table class="keysmac-legend">' +
            '<thead>' +
                '<tr>' +
                    '<th><span>Shortcut</span></th>' +
                    '<th><span>Name</span></th>' +
                    '<th><span>Description</span></th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '<tr ng-repeat="registration in registrations">' +
                    '<td>{{ registration.shortCut.toDisplayString() }}</td>' +
                    '<td>{{ registration.shortCutName }}</td>' +
                    '<td>{{ registration.description }}</td>' +
                '</tr>' +
            '</tbody>' +
        '</table>';

    angular
        .module("apKeySMAC")
        .factory("keySmacLegend",
        ["$compile", "$q", "$rootScope", "$templateRequest", "keySMAC",
        function($compile, $q, $rootScope, $templateRequest, keySMAC) {
            var _template;
            var _templateUrl;


            init();


            function getLegend(contextNameOrPath) {
                contextNameOrPath = contextNameOrPath || keySMAC.getActiveContext();

                return $q(function(accept, reject) {
                    (function(iife) {
                        getTemplate().then(function(template) {
                            var element;
                            var linkFn;
                            var scope;

                            linkFn = $compile(template);
                            scope = $rootScope.$new(true);
                            scope.registrations = keySMAC.getActiveRegistrations(iife.contextNameOrPath);
                            element = linkFn(scope);

                            scope.$applyAsync(function() { accept(element.html()); });
                        });
                    })({contextNameOrPath: contextNameOrPath});
                });
            }

            function getTemplate() {
                if (!(_template || _templateUrl)) throw new Error("keySMAC: no template is defined");

                return $q(function(accept, reject) {
                    if (_template) {
                        accept(wrapTemplate(_template));
                    } else {
                        $templateRequest(_templateUrl).then(function (template) {
                            accept(wrapTemplate(template));
                        });
                    }
                });
            }

            function init() {
                setTemplate(DEFAULT_TEMPLATE);
            }

            function setTemplate(template) {
                _template = template;
                _templateUrl = null;
            }

            function setTemplateUrl(templateUrl) {
                _template = null;
                _templateUrl = templateUrl;
            }

            function wrapTemplate(html) {
                return "<div>" + html + "</div>";
            }


            return {
                getLegend: getLegend,
                setTemplate: setTemplate,
                setTemplateUrl: setTemplateUrl
            };
        }]);
})();