'use strict';

/**
 * Module dependencies
 */
var // passport for authentication
    passport = require('passport'),
    // the local strategy
    LocalStrategy = require('passport-local').Strategy,
    // the path
    path = require('path'),
    // the User model
    User = require('mongoose').model('User');

module.exports = function () {
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            // convert to lowercase
            username = username ? username.toLowerCase() : username;

            // find a user whose username is the same as the forms username
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'internalName': username }, function(err, foundUser) {
                // if there are any errors, return the error
                if (err) {
                    return done(err);
                }

                // check to see if theres already a user with that username
                if (foundUser) {
                    return done(null, null, { 'message': 'That username is already taken' });
                } 
                else {
                    // if there is no user with that username
                    // create the user
                    var newUser = new User({
                        'username': username,
                        'password': password,
                        'email': req.body.email,
                        'firstName': req.body.firstName,
                        'lastName': req.body.lastName
                    });

                    // save the user
                    newUser.save(function(err) {
                        // if error occurred
                        if (err) {
                            throw err;
                        }
                            
                        return done(null, newUser);
                    });
                }
            });    
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username/email and password
        usernameField: 'usernameOrEmail',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function (req, usernameOrEmail, password, done) {
        // convert to lowercase
        usernameOrEmail = usernameOrEmail ? usernameOrEmail.toLowerCase() : usernameOrEmail;

        // find a user whose username/email is the same as the forms username/email
        // we are checking to see if the user trying to login already exists
        const orOption = { $or: [{ 'username': usernameOrEmail.toLowerCase() }, { 'email': usernameOrEmail.toLowerCase()}] };
        User.findOne(orOption, function (err, foundUser) {
            // if error occurred
            if (err) {
                return done(err);
            } 

            // if no user is found, return the message
            if (!foundUser) {
                // req.flash is the way to set flashdata using connect-flash
                return done(null, false, { 'message': 'User not found' });
            }

            // compare equality
            foundUser.comparePassword(password, function(err, isMatch) {
                // if the user is found but the password is wrong or an error occurred
				if (err || !isMatch) {
                    // create the login message and save it to session as flashdata
                    return done(null, false);
				}

                // set updated values 
                foundUser.lastLogin = new Date();

                // update user
                foundUser.save(function(err) {
                    // if error occurred
                    if (err) {
                        return done(err);
                    }
                    
                    // login
                    req.login(foundUser, function (err) {
                        // if error occurred
                        if (err) {
                            return done(err);
                        } 
                        else {
                            // all is well, return successful user
                            return done(null, foundUser);
                        }
                    });
                });
			});	
        });
    }));
};
