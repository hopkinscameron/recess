'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the account policy
	accountPolicy = require(path.resolve('./modules/account/server/policies/account.server.policy')),
    // the account controller to handle routes
    accountController = require(path.resolve('./modules/account/server/controllers/account.server.controller')),
    // the time management policy
	timeManagementPolicy = require('../policies/time-management.server.policy'),
    // the time management controller to handle routes
    timeManagementController = require('../controllers/time-management.server.controller');

module.exports = function (app) {
    // GET gets time management information
    // POST adds time management information
    // DELETE deletes time management information
	// format /api/timeManagement
    app.route('/api/timeManagement').all([timeManagementPolicy.isAllowed, timeManagementController.readDB])
    .get(timeManagementController.getTimeOff)
    .post(timeManagementController.addTimeOff)
    .delete(timeManagementController.deleteTimeOff);

    // GET gets all users time management information
	// format /api/timeManagement/all
    app.route('/api/timeManagement/all').all([timeManagementPolicy.isAdminAllowed, timeManagementController.readDB, accountPolicy.isAllowed, accountController.readDB])
    .get(timeManagementController.getUsersTimeOff);

    // GET gets all users time management information for today
	// format /api/timeManagement/today
    app.route('/api/timeManagement/today').all([timeManagementPolicy.isAllowed, timeManagementController.readDB, accountPolicy.isAllowed, accountController.readDB])
    .get(timeManagementController.getUsersTimeOffToday);

    // GET gets time management information
    app.route('/api/timeManagement/types')
    .get(timeManagementController.getTimeOffTypes)
};