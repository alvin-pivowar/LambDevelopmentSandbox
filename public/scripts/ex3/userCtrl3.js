(function() {
    "use strict";

    var CONTROLLER_NAME = "userCtrl3";

    angular
        .module("LambSample")
        .controller(CONTROLLER_NAME,
        ["$scope", "Lamb", "userService3",
        function($scope, Lamb, userService3) {
            var bus = new Lamb(CONTROLLER_NAME, $scope);

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
            }

            function create(newUser) {
                delete newUser.id;
                userService3.createUser(newUser);
                cancelEdit();
            }

            function deleteOp(id) {
                userService3.deleteUser(id);
            }

            function edit(id) {
                angular.forEach(vm.users, function(user) {
                    if (user.id === id) {
                        angular.extend(vm.editUser, user);
                    }
                });
            }

            function init() {
                userService3.getAllUsers().then(function(data) {
                    vm.users = data.data;
                });

                bus.subscribe("users.create.*", function(createdUser) {
                    vm.users.push(createdUser);
                });

                bus.subscribe("users.update.*", function(updatedUser) {
                    angular.forEach(vm.users, function(user) {
                        if (user.id === updatedUser.id) {
                            angular.extend(user, updatedUser);
                        }
                    });
                });

                bus.subscribe("users.delete.*", function(id) {
                    var updatedUserList = [];
                    angular.forEach(vm.users, function(user) {
                        if (user.id !== id)
                            updatedUserList.push(user);
                    });
                    vm.users = updatedUserList;
                });
            }

            function update(updatedUser) {
                userService3.updateUser(updatedUser);
                cancelEdit();
            }
        }]);
})();