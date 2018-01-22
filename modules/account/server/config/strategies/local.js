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
    User = require(path.resolve('./modules/account/server/models/model-user'));

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
            User.findOne({ 'internalName': username }, function(err, user) {
                // if there are any errors, return the error
                if (err) {
                    return done(err);
                }

                // check to see if theres already a user with that username
                if (user) {
                    return done(null, null, 'That username is already taken.');
                } 
                else {
                    // create the user and set the user's local credentials
                    var newUser = {
                        'username': username,
                        'password': password,
                        'email': req.body.email,
                        'firstName': req.body.firstName,
                        'lastName': req.body.lastName
                    };

                    // save the user
                    User.save(newUser, function(err, newSavedUser) {
                        // if error occurred
                        if (err) {
                            throw err;
                        }

                        // save the id since it will be lost when going to object
                        // hide the password for security purposes
                        var id = newSavedUser._id;
                        var user = User.toObject(newSavedUser, { 'hide': 'password lastPasswords internalName created resetPasswordToken resetPasswordExpires' });
                        user._id = id;

                        // hide the password
                        return done(null, user);
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
        // by default, local strategy uses username and password
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function (req, username, password, done) {
        // convert to lowercase
        username = username ? username.toLowerCase() : username;

        // find a user whose username is the same as the forms username
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'internalName': username }, function (err, user) {
            // if error occurred
            if (err) {
                return done(err);
            } 

            // if no user is found, return the message
            if (!user) {
                // req.flash is the way to set flashdata using connect-flash
                return done(null, false, 'User not found');
            }

            // compare equality
            User.comparePassword(user, password, function(err, isMatch) {
                // if the user is found but the password is wrong or an error occurred
				if (err || !isMatch) {
                    // create the login message and save it to session as flashdata
                    return done(null, false);
				}

                // set updated values 
                var updatedValues = {
                    'lastLogin': new Date()
                };

                // update user
                User.update(user, updatedValues, function(err, updatedUser) {
                    // if error occurred
                    if (err) {
                        return done(err);
                    }
                    else if(updatedUser) {
                        // save the id since it will be lost when going to object
                        // hide the password for security purposes
                        var id = updatedUser._id;
                        updatedUser = User.toObject(updatedUser, { 'hide': 'password lastPasswords internalName created' });
                        updatedUser._id = id;

                        // login
                        req.login(updatedUser, function (err) {
                            // if error occurred
                            if (err) {
                                return done(err);
                            } 
                            else {
                                // all is well, return successful user
                                return done(null, updatedUser);
                            }
                        });
                    }
                    else {
                        // save the id since it will be lost when going to object
                        // hide the password for security purposes
                        var id = user._id;
                        user = User.toObject(user, { 'hide': 'password internalName created' });
                        user._id = id;

                        // login
                        req.login(user, function (err) {
                            // if error occurred
                            if (err) {
                                return done(err);
                            } 
                            else {
                                // all is well, return successful user
                                return done(null, user);
                            }
                        });
                    }
                });
			});	
        });
    }));
};
