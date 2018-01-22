'use strict';

// set up the module
var coreRoutesModule = angular.module('core.routes');

// configure the module
coreRoutesModule.config(['$routeProvider', function ($routeProvider, $routeParams) {
    $routeProvider
        .when('/', {
            templateUrl: '/modules/core/client/views/download.client.view.html'
        })
        .otherwise({
            templateUrl: '/modules/core/client/views/download.client.view.html'
        })
}]);