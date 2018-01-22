'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the account policy
	accountPolicy = require('../policies/account.server.policy'),
    // the account controller to handle routes
    accountController = require('../controllers/account.server.controller');

module.exports = function (app) {
    // =========================================================================
    // Profile Routes ==========================================================
    // =========================================================================

    // GET gets user's edit profile information
    // POST updates user's profile information
	// format /api/edit-profile
    app.route('/api/account/edit-profile').all([accountPolicy.isAllowed, accountController.readDB])
    .get(accountController.readProfile)
    .post(accountController.updateProfile);


    
    // =========================================================================
    // Password Routes =========================================================
    // =========================================================================

    // POST updates user's password
	// format /api/change-password
    app.route('/api/account/change-password').all([accountPolicy.isAllowed, accountController.readDB])
    .post(accountController.updatePassword);

    // POST resets specific user's password
	// format /api/change-password
    app.route('/api/account/reset-password').all([accountPolicy.isAdminAllowed, accountController.readDB])
    .post(accountController.resetPassword);
}