'use strict';

/**
 * Module dependencies
 */
var // passport for authentication
    passport = require('passport'),
    // path
    path = require('path'),
    // the application configuration
    config = require(path.resolve('./config/config')),
    // the User model
    User = require('mongoose').model('User');

/**
 * Module init function
 */
module.exports = function (app, db) {
    // =========================================================================
    // Passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // Passport needs ability to serialize and unserialize users out of session
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        // find the user
        User.findOne({ '_id': id }, '-password -lastPasswords', function(err, user) {
            done(err, user);
        });
    });

    // initialize strategies
    config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
        require(path.resolve(strategy))(config);
    });

    // add passport's middleware
    app.use(passport.initialize());
    app.use(passport.session());
};