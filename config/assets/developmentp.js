'use strict';

module.exports = {
    client: {
        lib: {
            css: [
                // bower:css
                'public/lib/bootstrap/bootstrap.min.css',
                'public/lib/bootstrap/bootstrap-reboot.min.css',
                'public/lib/bootstrap/bootstrap-grid.min.css',
                'public/lib/angular-loading-bar/loading-bar.min.css',
                'public/lib/font-awesome/font-awesome.min.css',
                'public/lib/sweet-alert-2/sweetalert2.min.css'
                // endbower
            ],
            js: [
                // bower:js
                //'public/lib/jquery/jquery-1.9.1.min.js',
                'public/lib/angular/angular.min.js',
                'public/lib/angular/angular-animate.min.js',
                'public/lib/angular/angular-cookies.min.js',
                'public/lib/angular/angular-route.min.js',
                'public/lib/angular/angular-sanitize.min.js',
                'public/lib/angular/angular-messages.min.js',
                'public/lib/angular/angular-touch.min.js',
                'public/lib/angular/angular-mocks.min.js',
                'public/lib/angular/angular-resource.min.js',
                'public/lib/angular-loading-bar/loading-bar.min.js',
                'public/lib/angular-ui-bootstrap/ui-bootstrap-tpls-2.5.0.min.js',
                'public/lib/tinymce/tinymce.min.js',
                'public/lib/angular-ui-tinymce/dist/tinymce.min.js',
                'public/lib/bootstrap/bootstrap.min.js',
                'public/lib/chart.js/Chart.bundle.min.js',
                'public/lib/angular-chart/angular-chart.min.js',
                'public/lib/lodash/lodash.min.js',
                'public/lib/waypoints/jquery.waypoints.min.js',
                'public/lib/sweet-alert-2/sweetalert2.min.js',
                'public/lib/owasp-password-strength-test/owasp-password-strength-test.js'
                // endbower
            ]
        },
        css: 'public/dist/recess*.min.css',
        js: 'public/dist/recess*.min.js'
    }
};