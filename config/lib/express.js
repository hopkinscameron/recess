'use strict';

/**
 * Module dependencies.
 */
var // the application configuration
    config = require('../config'),
    // the path
    path = require('path'),
    // the server
    express = require('express'),
    // the http request validator
    expressValidator = require('express-validator'),
    // passport for local authentication
	passport = require('passport'),
    // middleware logger
    morgan = require('morgan'),
    // the logger configuration
    logger = require('./logger'),
    // the http body parser
    bodyParser = require('body-parser'),
    // express session used for storing logged in sessions
    session = require('express-session'),
    // mongo store for mongodb
    MongoStore = require('connect-mongo')(session),
    // fav icon serve
    favicon = require('serve-favicon'),
    // file compression
    compress = require('compression'),
    // method overriding
    methodOverride = require('method-override'),
    // cookie parsing
    cookieParser = require('cookie-parser'),
    // helmet for helping secure http headers
    helmet = require('helmet'),
    // flash messages
    flash = require('connect-flash'),
    // handlebars template
    hbs = require('express-hbs'),
    // path 
    path = require('path'),
    // lodash
    _ = require('lodash'),
    // lusca for web application security middleware
    lusca = require('lusca'),
    // tester for ensuring a stronger password
    owasp = require('owasp-password-strength-test');

// configure owasp
owasp.config(config.shared.owasp);

// the alpha characters regex
var alphaCharactersRegex = /^[a-zA-Z]*$/;

/**
 * Initialize local variables
 */
module.exports.initLocalVariables = function (app) {
    // setting application local variables
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    
    // if secure mode
    if (config.secure && config.secure.ssl === true) {
        app.locals.secure = config.secure.ssl;
    }

    app.locals.keywords = config.app.keywords;
    app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
    app.locals.googleMapsJavascriptAPIKey = config.google.mapsJavascript.clientSecret;
    app.locals.appInsightsAnalyticsTrackingID = config.app.appInsightsAnalyticsTrackingID === 'APP_INSIGHTS_ANALYTICS_TRACKING_ID' ? null : config.app.appInsightsAnalyticsTrackingID;
    app.locals.jsFiles = config.files.client.js;
    app.locals.cssFiles = config.files.client.css;
    app.locals.livereload = config.livereload;
    app.locals.logo = config.logo;
    app.locals.favicon = config.favicon;
    app.locals.env = process.env.NODE_ENV;
    app.locals.domain = config.domain;
    app.locals.facebookUsername = config.socialMedia.facebook.username;
    app.locals.instagramUsername = config.socialMedia.instagram.username;
    app.locals.linkedinUsername = config.socialMedia.linkedin.username;
    app.locals.twitterUsername = config.socialMedia.twitter.username;
    app.locals.youtubeUsername = config.socialMedia.youtube.username;

    // passing the request url to environment locals
    app.use(function (req, res, next) {
        res.locals.host = req.protocol + '://' + req.hostname;
        res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
        next();
    });
};

/**
 * Initialize application middleware
 */
module.exports.initMiddleware = function (app) {
    // should be placed before express.static
    app.use(compress({
        filter: function (req, res) {
            return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    // initialize favicon middleware
    //app.use(favicon(app.locals.favicon));

    // enable logger (morgan) if enabled in the configuration file
    if (_.has(config, 'log.format')) {
        app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
    }

    // environment dependent middleware
    if (process.env.NODE_ENV === 'development') {
        // disable views cache
        app.set('view cache', false);
    } 
    else if (process.env.NODE_ENV === 'production') {
        // set cache to memory
        app.locals.cache = 'memory';
    }
    else if (process.env.NODE_ENV === 'developmentp') {
        // set cache to memory
        app.locals.cache = 'memory';
    }
    else {
        // disable views cache
        app.set('view cache', false);
    }

    // request body parsing middleware should be above methodOverride
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());

    // add the cookie parser and flash middleware
    app.use(cookieParser());
    app.use(flash());

    // use header/body validation (add any additional custom validators)
    app.use(expressValidator({
        customValidators: {
            // determines object exists
            exists: (value1) => {
                return value1 !== undefined;
            },
            // determines if two values are strictly equal
            isEqual: (value1, value2) => {
                return value1 === value2;
            },
            // determines if value is strictly less than
            isLessThan: (value1, value2) => {
                return value1 < value2;
            },
            // determines if value is strictly less than or equal to
            isLessThanOrEqualTo: (value1, value2) => {
                return value1 <= value2;
            },
            // determines if value is strictly greater than
            isGreaterThan: (value1, value2) => {
                return value1 > value2;
            },
            // determines if value is strictly greater than
            isGreaterThanOrEqualTo: (value1, value2) => {
                return value1 >= value2;
            },
            // determines if value is of lenth
            isOfLength: (value1, value2) => {
                return typeof(value1) === 'string' && Number.isInteger(value2) && value1.length == value2;
            },
            // determines if value is a type of boolean
            isBoolean: (value) => {
                return typeof(value) === 'boolean';
            },
            // determines if value is a type of string
            isString: (value) => {
                return typeof(value) === 'string';
            },
            // determines if value is a type of date
            isDate: (value) => {
                // try to get date
                return !isNaN(new Date(value).getTime());
            },
            // determines if value exists in arry
            existsInArray: (value, arr) => {
                return _.findIndex(arr, function(o) { 
                    var iata = o.iata.toLowerCase().includes(value.iata && value.iata.length > 0 ? value.iata.toLowerCase() : '');
                    var icao = o.icao.toLowerCase().includes(value.icao && value.icao.length > 0 ? value.icao.toLowerCase() : '');
                    return iata && icao; 
                });
            },
            // determines if password is strong enough
            isStrongPassword: (value) => {
                return !owasp.test(value).errors.length;
            },
            // determines if only contains letters
            onlyContainsAlphaCharacters: (value) => {
                return alphaCharactersRegex.test(value);
            }
        }
    }));
};

/**
 * Configure view engine
 */
module.exports.initViewEngine = function (app) {
    app.engine('server.view.html', hbs.express4({
        extname: '.server.view.html'
    }));
    app.set('view engine', 'server.view.html');
    app.set('views', path.resolve('./'));
};

/**
 * Configure Express session
 */
module.exports.initSession = function (app, db) {
    // Express MongoDB session storage
    app.use(session({
        saveUninitialized: false,
        resave: false,
        secret: config.sessionSecret,
        cookie: {
            maxAge: config.sessionCookie.maxAge,
            expires: config.sessionCookie.expires,
            httpOnly: config.sessionCookie.httpOnly,
            secure: config.sessionCookie.secure && config.secure.ssl
        },
        name: config.sessionKey,
        unset: 'destroy',
        store: new MongoStore({
            mongooseConnection: config.db.options.useMongoClient ? db : db.connection,
            collection: config.sessionCollection,
            clear_interval: config.clearInterval
        })
    }));

    // add Lusca CSRF Middleware
    app.use(lusca(config.csrf));
};

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = function (app, db) {
    // globbing module configuration
    config.files.server.configs.forEach(function (configPath) {
        require(path.resolve(configPath))(app, db);
    });
};

/**
 * Configure Helmet headers configuration for security
 */
module.exports.initHelmetHeaders = function (app) {
    // six months expiration period specified in seconds
    var SIX_MONTHS = 15778476;

    app.use(helmet.frameguard());
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.ieNoOpen());
    app.use(helmet.hsts({
        maxAge: SIX_MONTHS,
            includeSubdomains: true,
            force: true
    }));
    app.disable('x-powered-by');
};

/**
 * Configure the modules static routes
 */
module.exports.initModulesClientRoutes = function (app) {
    // setting the app router and static folder
    app.use('/', express.static(path.resolve('./public'), { maxAge: 86400000 }));

    // globbing static routing
    config.folders.client.forEach(function (staticPath) {
        app.use(staticPath, express.static(path.resolve('./' + staticPath)));
    });
};

/**
 * Configure the modules policies
 */
module.exports.initModulesServerPolicies = function (app) {
    // globbing policy files
    config.files.server.policies.forEach(function (policyPath) {
        require(path.resolve(policyPath)).invokeRolesPolicies();
    });
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
    // globbing routing files
    config.files.server.routes.forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = function (app) {
    // use error routing
    app.use(function (err, req, res, next) {
        // If the error object doesn't exists
        if (!err) {
            return next();
        }

        // log it
        console.error(err.stack);

        // redirect to error page
        res.redirect('/server-error');
    });
};

/**
 * Configure Socket.io
 */
module.exports.configureSocketIO = function (app, db) {
    // load the Socket.io configuration
    var server = require('./socket.io')(app, db);

    // return server object
    return server;
};

/**
 * Initialize the Express application
 */
module.exports.init = function (db) {
    // initialize express app
    var app = express();

    // initialize local variables
    this.initLocalVariables(app);

    // initialize Express middleware
    this.initMiddleware(app);

    // initialize Express view engine
    this.initViewEngine(app);

    // initialize Helmet security headers
    this.initHelmetHeaders(app);

    // initialize modules static client routes, before session!
    this.initModulesClientRoutes(app);

    // initialize Express session
    this.initSession(app, db);

    // initialize Modules configuration
    this.initModulesConfiguration(app);

    // initialize modules server authorization policies
    this.initModulesServerPolicies(app);

    // initialize modules server routes
    this.initModulesServerRoutes(app);

    // initialize error routes
    //this.initErrorRoutes(app);

    // configure Socket.io
    app = this.configureSocketIO(app, db);

    return app;
};