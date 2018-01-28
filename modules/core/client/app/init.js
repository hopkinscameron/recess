'use strict';

// start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// configure the module
angular.module(ApplicationConfiguration.applicationModuleName).config(['$routeProvider', '$locationProvider', '$httpProvider', '$compileProvider', '$logProvider', function ($routeProvider, $locationProvider, $httpProvider, $compileProvider, $logProvider, $routeParams) {
    // check browser support to enable html 5
    if (window.history && window.history.pushState) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: true
        });
    }
    else {
        // remove default "!" in has prefix
        $locationProvider.hashPrefix('');

        // remove index.html
        $locationProvider.hashPrefix();
    }

    // set some header defaults
    $httpProvider.defaults.headers.common['Access-Control-Max-Age'] = '600';
    $httpProvider.defaults.headers.common['Accept'] = 'application/json; odata=verbose';
    $httpProvider.defaults.headers.common['Content-Type'] = 'application/json; odata=verbose';

    // disable debug data for production environment
    // @link https://docs.angularjs.org/guide/production
    $compileProvider.debugInfoEnabled(ApplicationConfiguration.applicationEnvironment !== 'production' && ApplicationConfiguration.applicationEnvironment !== 'developmentp');
    $compileProvider.commentDirectivesEnabled(ApplicationConfiguration.applicationEnvironment !== 'production' && ApplicationConfiguration.applicationEnvironment !== 'developmentp');
    $compileProvider.cssClassDirectivesEnabled(ApplicationConfiguration.applicationEnvironment !== 'production' && ApplicationConfiguration.applicationEnvironment !== 'developmentp');
    $logProvider.debugEnabled(ApplicationConfiguration.applicationEnvironment !== 'production' && ApplicationConfiguration.applicationEnvironment !== 'developmentp');
}]);

// configure the route
angular.module(ApplicationConfiguration.applicationModuleName).run(['$rootScope', '$location', '$route', function($rootScope, $location, $route) {
    // get the origional path
    var original = $location.path;

    // redefine the path functionality
    $location.path = function (path, reload) {
        // if not trying to reload
        if (reload === false) {
            // set last route to current route
            var lastRoute = $route.current;

            // on success
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }

        // apply changes
        return original.apply($location, [path]);
    };

    // on a route change (the start of a route change)
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
    })
}]);

// define the init function for starting up the application
angular.element(document).ready(init);

// initialize the application
function init() {
    // initialize the application
    angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
};