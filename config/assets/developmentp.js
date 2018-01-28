'use strict';

module.exports = {
    client: {
        lib: {
            css: [
                // bower:css
                'public/lib/bootstrap/bootstrap.min.css',
                'public/lib/bootstrap/bootstrap-reboot.min.css',
                'public/lib/bootstrap/bootstrap-grid.min.css'
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
                'public/lib/angular-ui-bootstrap/ui-bootstrap-tpls-2.5.0.min.js',
                'public/lib/bootstrap/bootstrap.min.js'
                // endbower
            ]
        },
        css: 'public/dist/recess*.min.css',
        js: 'public/dist/recess*.min.js'
    }
};