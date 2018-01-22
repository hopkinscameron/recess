'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // chalk for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // lodash
    _ = require('lodash'),
    // passport for local authentication
    passport = require('passport'),
    // the application configuration
    config = require(path.resolve('./config/config')),
    // generator for a strong password
    generatePassword = require('generate-password'),
    // tester for ensuring a stronger password
    owasp = require('owasp-password-strength-test'),
    // the User model
    User = require(path.resolve('./modules/account/server/models/model-user'));

// configure owasp
owasp.config(config.shared.owasp);

/**
 * Checks if user is already authenticated
 */
exports.checkLoggedIn = function (req, res) {
    // if user is authenticated in the session
    if (req.isAuthenticated()) {
        // return is logged in
        res.json({ 'd': { 'isLoggedIn': true } });
    }
    else {
        // return is logged in
        res.json({ 'd': { 'isLoggedIn': false } });
    }
};

/**
 * Signs user up
 */
exports.signUp = function (req, res, next) {
    // validate existence
    req.checkBody('username', 'Username is required.').notEmpty();
    req.checkBody('firstName', 'First name is required.').notEmpty();
    req.checkBody('lastName', 'Last name is required.').notEmpty();
    req.checkBody('email', 'Email is required.').notEmpty();
    req.checkBody('password', 'Password is required.').notEmpty();
    req.checkBody('password', `Please enter a passphrase or password with ${config.shared.owasp.minLength} or more characters, numbers, lowercase, uppercase, and special characters.`).isStrongPassword();
    req.checkBody('confirmedPassword', 'Confirmed password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password should be equal to new password.').isEqual(req.body.password);
    
    // validate errors
    req.getValidationResult().then(function(errors) {
        // if any errors exists
        if(!errors.isEmpty()) {
            // holds all the errors in one text
            var errorText = '';

            // add all the errors
            for(var x = 0; x < errors.array().length; x++) {
                // if not the last error
                if(x < errors.array().length - 1) {
                    errorText += errors.array()[x].msg + '\r\n';
                }
                else {
                    errorText += errors.array()[x].msg;
                }
            }

            // send bad request
            res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
        } 
        else {
            // authenticate the user with a signup
            passport.authenticate('local-signup', { failureFlash : true }, function (err, user) {
                // if error occurred
                if(err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                }
                // if user is not signed up 
                else if(!user) {
                    // return not signed up 
                    res.json({ 'd': { error: true, title: 'Username already taken.', message: 'Username already taken.' } });
                }
                else {
                    // return authenticated
                    res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: errorHandler.getGenericErrorMessage({ code: 200 }) + ' Successful sign up.' } });
                }
            })(req, res, next);
        }
    });
};

/**
 * Logs user in
 */
exports.login = function (req, res, next) {
    // authenticate user login
    passport.authenticate('local-login', function (err, user, info) {
        // if error occurred
        if(err) {
            // send internal error
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
        }
        // if user is not authenticated 
        else if(!user && info) {
            // return not authenticated
            res.json({ 'd': { error: true, title: 'Incorrect username/password.', message: 'Incorrect username/password.' } });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(info.message)));
        }
        // if user is not authenticated 
        else if(!user) {
            // return not authenticated
            res.json({ 'd': { error: true, title: 'Incorrect username/password.', message: 'Incorrect username/password.' } });
        }
        else {
            // return authenticated
            res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: errorHandler.getGenericErrorMessage({ code: 200 }) + ' Successful login.' } });
        }
    })(req, res, next);
};

/**
 * Generates random passphrase
 */
exports.generateRandomPassphrase = function (req, res, next) {
    // if user is authenticated in the session
    if (req.isAuthenticated() && _.indexOf(req.user.roles, 'admin') != -1) {
        var passphrase = generateRandomPassphrase();

        // if not passphrase
        if(!passphrase) {
            // try one more time
            passphrase = generateRandomPassphrase();
        }

        // return passphrase
        res.json({ 'd': { 'passphrase': passphrase } });
    }
    else {
        // create forbidden error
        res.status(403).send({ title: errorHandler.getErrorTitle({ code: 403 }), message: errorHandler.getGenericErrorMessage({ code: 403 }) });
    }
};

// Generates random passphrase
function generateRandomPassphrase() {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
        // build the random password
        password = generatePassword.generate({
            length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
            numbers: true,
            symbols: false,
            uppercase: true,
            excludeSimilarCharacters: true
        });

        // check if we need to remove any repeating characters
        password = password.replace(repeatingCharacters, '');
    }

    // send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
        return null;
    } 
    else {
        // return with the validated passphrase
        return password;
    }
}