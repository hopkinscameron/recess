'use strict';

/**
 * Module dependencies.
 */
var // the path
    path = require('path'),
    // the core policy
	corePolicy = require('../policies/core.server.policy'),
    // the core controller to handle routes
    coreController = require('../controllers/core.server.controller');

module.exports = function (app) {
    /*
    // Define error pages
    app.route('/server-error').get(core.renderServerError);
    */
    
    // Return a 404 for all undefined api, module or lib routes
    app.route('/:url(api|modules|lib)/*')
    .get(coreController.renderNotFound);

    // GET gets core information
	// format /api/core
    app.route('/api/core').all(coreController.readDB)
    .post(coreController.getCoreData);

    // POST shortens the url
    // format /api/shortenUrl
    app.route('/api/shortenUrl').all(corePolicy.isAllowed)
    .post(coreController.shortenUrl);

    // define application route
    //app.route('/*').get(coreController.renderIndex);
    app.route('/*').all(coreController.renderIndex);
    //app.use(coreController.renderIndex);
};