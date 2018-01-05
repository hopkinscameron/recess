'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the account policy
	accountPolicy = require('../policies/account.server.policy'),
    // the login controller to handle routes
    loginController = require('../controllers/login.server.controller');

module.exports = function (app) {
    // GET gets login page
    // POST log user in
	// format /login
    app.route('/api/login').get(loginController.checkLoggedIn)
        .post(loginController.login);

    // POST signs user up
	// format /signup
    app.route('/api/signup').post(loginController.signUp);

    // GET gets random passphrase
	// format /generateRandomPassphrase
    app.route('/api/generateRandomPassphrase').get(accountPolicy.isAllowed, loginController.generateRandomPassphrase);
};