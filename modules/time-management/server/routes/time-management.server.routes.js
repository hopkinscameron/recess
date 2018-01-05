'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the time management policy
	timeManagementPolicy = require('../policies/time-management.server.policy'),
    // the time management controller to handle routes
    timeManagementController = require('../controllers/time-management.server.controller');

module.exports = function (app) {
    // GET gets time management page information
	// format /api/timeManagement
    app.route('/api/timeManagement').all([timeManagementPolicy.isAllowed, timeManagementController.readDB])
    .get(timeManagementController.getTimeOff)
    .post(timeManagementController.addTimeOff)
    .delete(timeManagementController.deleteTimeOff);
};