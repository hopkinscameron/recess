'use strict';

// set up the module
var coreModule = angular.module('core');

// create the controller
coreModule.controller('DownloadController', ['$scope', '$rootScope', '$compile', '$location', '$window', '$timeout', 'Service', function ($scope, $rootScope, $compile, $location, $window, $timeout, Service) {
    // determines if a page has already sent a request for load
    var pageRequested = false;

    // set jQuery
    $ = window.jQuery;

    // set the path
    Service.afterPath = $location.path();

    // holds the error
    $scope.error = {
        'error': false,
        'title': '',
        'status': 404,
        'message': ''
    };

    // determines if the page is fully loaded
    $scope.pageFullyLoaded = false;

    // downloads app
    $scope.downloadApp = function (platform) {
        // if apple
        if(platform == 'apple') {

        }
        else if(platform == 'android') {
            
        }
    };

    // setup page
    setUpPage();

    // sets up the page
    function setUpPage() {
        // set up the title
        var titleDOM = document.getElementById('pageTitle');
        var title = '\'' + $scope.pageTitle + '\'';
        titleDOM.setAttribute('ng-bind-html', title);
        $compile(titleDOM)($scope);

        // set page fully loaded
        $scope.pageFullyLoaded = true;

        // show the page after a timeout
        $timeout(showPage, $rootScope.$root.showPageTimeout);
    };

    // shows the page
    function showPage() {
        // check if collapsing is already occuring
        if(!angular.element('#pageShow').hasClass('collapsing')) {
            // show the page
            angular.element('#pageShow').collapse('show');
        }
    };
}]);