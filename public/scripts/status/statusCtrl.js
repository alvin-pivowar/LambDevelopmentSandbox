(function() {
    "use strict";

    angular
        .module("LambSample")
        .controller("statusCtrl",
        ["$sce", "$scope", "keySMAC", "keySmacLegend", "statusSettings", "userService1",
        function($sce, $scope, keySMAC, keySmacLegend, statusSettings, userService1) {
            var vm = this;
            vm.editUser = {};
            vm.users = [];

            vm.cancelEdit = cancelEdit;
            vm.create = create;
            vm.add = add;
            vm.delete = deleteOp;
            vm.edit = edit;
            vm.update = update;

            init();

            function add() {
                vm.editUser = { id: "new"};
            }

            function cancelEdit() {
                vm.editUser = {};
                keySMAC.popContext();
                updateLegend();
            }

            function create(newUser) {
                delete newUser.id;
                userService1.createUser(newUser).then(function(data) {
                    newUser.id = data.data.id;
                    vm.users.push(newUser);
                });
                cancelEdit();
            }

            function deleteOp(id) {
                userService1.deleteUser(id).then(function() {
                    var updatedUserList = [];
                    angular.forEach(vm.users, function(user) {
                        if (user.id !== id)
                            updatedUserList.push(user);
                    });
                    vm.users = updatedUserList;
                });
            }

            function edit(id) {
                angular.forEach(vm.users, function(user) {
                    if (user.id === id) {
                        angular.extend(vm.editUser, user);
                        keySMAC.pushContext("editContext");
                        updateLegend();
                    }
                });
            }

            function init() {
                userService1.getAllUsers().then(function(data) {
                    var i;
                    var registration;
                    var shortCut;

                    vm.users = data.data;
                    for (i = 0; i < vm.users.length; ++i) {
                        shortCut = new keySMAC.ShortCut({
                            isAlt: true,
                            key: String.fromCharCode('0'.charCodeAt(0) + i)
                        });
                        registration = new keySMAC.ShortCutRegistration({
                            shortCut: shortCut,
                            shortCutName: "edit",
                            description: "Edit the corresponding row (1 - based)",
                            callbackFn: onShortCut
                        });
                        keySMAC.addRegistration(registration);
                    }

                    var registrations = keySMAC.getActiveRegistrations();
                    updateLegend();
                });

                statusSettings.useToast = true;
                $scope.$on("$destroy", function() {
                    var path;

                    statusSettings.useToast = false;

                    keySMAC.deleteContext("statusContext");
                    keySMAC.deleteContext("editContext");
                });

                keySMAC.addContext("editContext");
                keySMAC.addRegistration("editContext", new keySMAC.ShortCutRegistration({
                    shortCut: new keySMAC.ShortCut({
                        isControl: true,
                        key: 'C'
                    }),
                    shortCutName: "cancel",
                    description: "Cancel the edit operation",
                    callbackFn: cancelEdit
                }));
                keySMAC.addRegistration("editContext", new keySMAC.ShortCutRegistration({
                    shortCut: new keySMAC.ShortCut({
                        isControl: true,
                        key: 'S'
                    }),
                    shortCutName: "save",
                    description: "Save the user",
                    callbackFn: function() {
                        update(vm.editUser);
                    }
                }));

                keySMAC.addContext("$app/statusContext");
                keySMAC.pushContext("statusContext");
                updateLegend();
            }

            function onShortCut(registration) {
                var index = eval(registration.shortCut.key);
                var user = vm.users[index - 1];
                var id = user.id;

                edit(id);
            }

            function update(updatedUser) {
                userService1.updateUser(updatedUser).then(function() {
                    angular.forEach(vm.users, function(user) {
                        if (user.id === updatedUser.id) {
                            angular.extend(user, updatedUser);
                        }
                    });
                    cancelEdit();
                });
            }

            function updateLegend() {
                //keySmacLegend.setTemplateUrl("keyLegend.html");
                keySmacLegend.getLegend().then(function(legend) {
                    vm.legend = $sce.trustAsHtml(legend);
                });
            }
        }]);
})();