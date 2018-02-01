'use strict';

/**
 * Module dependencies.
 */
module.exports = {
    app: {
        title: 'Recess',
        description: 'Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js',
        keywords: 'mongodb, express, angularjs, node.js, passport, full-stack',
        googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID',
        appInsightsAnalyticsTrackingID: process.env.APP_INSIGHTS_ANALYTICS_TRACKING_ID || 'APP_INSIGHTS_ANALYTICS_TRACKING_ID'
    },
    db: {
        promise: global.Promise,
        options: {
            // TODO: only use this in less than 5.0 versions
            useMongoClient: true
        }
    },
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    // DOMAIN config should be set to the fully qualified application accessible
    // URL. For example: https://www.myapp.com (including port if required).
    domain: process.env.DOMAIN || 'http://127.0.0.1:80',
    // session options
    // sessionSecret should be changed for security measures and concerns
    sessionSecret: process.env.SESSION_SECRET || 'Recess',
    // sessionKey is the cookie session name
    sessionKey: 'sessionId',
    sessionCollection: 'sessions',
    // session Cookie settings
    sessionCookie: {
        // session expiration is set by default to 24 hours (in milliseconds)
        // maxAge: 24 * (60 * 60 * 1000), // 24 * (60 * 60 * 1000) -> 24 hours, // 60000 -> 1 minute
        expires: 'Wed, 1 Jan 2020 00:00:00 EST', // 'Wed, 1 Jan 2020 00:00:00 EST' -> expires on Jan 1, 2020 at midnight
        // httpOnly flag makes sure the cookie is only accessed
        // through the HTTP protocol and not JS/browser
        httpOnly: true,
        // secure cookie should be turned to true to provide additional
        // layer of security so that the cookie is set only when working
        // in HTTPS mode.
        secure: false
    },
    saltRounds: parseInt(process.env.SALT_ROUNDS) || 10,
    // clear interval after session expires (in seconds)
    clearInterval: 60,
    // Lusca config
    csrf: {
        csrf: false,
        csp: false,
        xframe: 'SAMEORIGIN',
        p3p: 'ABCDEF',
        xssProtection: true
    },
    // encryption
    encryption: {
        'secret': process.env.ENCRYPTION_SECRET || 'TEST',
        'type': process.env.ENCRYPTION_TYPE || 'aes192',
        'digest': process.env.ENCRYPTION_DIGEST || 'hex',
    }, 
    logo: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'developmentp' ? 'public/dist/img/logo.jpg' : 'modules/core/client/img/brand/logo.png',
    favicon: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'developmentp' ? 'public/dist/img/favicon.ico' : 'modules/core/client/img/brand/favicon.ico',
    illegalUsernames: ['administrator', 'password', 'admin', 'user', 'unknown', 'anonymous', 'null', 'undefined', 'api'],
    uploads: {
        profile: {
            image: {
                dest: '',
                limits: {
                    fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
                }
            }
        }
    },
    shared: {
        owasp: {
            allowPassphrases: true,
            maxLength: 128,
            minLength: 10,
            minPhraseLength: 20,
            minOptionalTestsToPass: 4
        },
        googleMapsTimeZone: process.env.GOOGLE_MAPS_TIMEZONE_API_KEY
    },
    socialMedia: {
        facebook: {
            username: process.env.FACEBOOK_USERNAME || 'FACEBOOK_USERNAME'
        },
        instagram: {
            username: process.env.INSTAGRAM_USERNAME || 'INSTAGRAM_USERNAME'
        },
        linkedin: {
            username: process.env.LINKEDIN_USERNAME || 'LINKEDIN_USERNAME'
        },
        twitter: {
            username: process.env.TWITTER_USERNAME || 'TWITTER_USERNAME'
        },
        youtube: {
            channel: process.env.YOUTUBE_USERNAME || 'YOUTUBE_USERNAME'
        }
    }
};
