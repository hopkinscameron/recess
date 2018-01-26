'use strict';

/**
 *  Name: The User Schema
    Description: Determines how a user is defined
 */

/**
 * Module dependencies
 */
var // mongoose
    mongoose = require('mongoose'),
    // mongoose schema
    Schema = mongoose.Schema,
    // the path
    path = require('path'),
    // validator
    validator = require('validator'),
    // get the default config
    defaultConfig = require(path.resolve('./config/env/default')),
    // lodash
    _ = require('lodash'),
    // clc colors for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // bcrypt for cryptography
    bcrypt = require('bcryptjs'),
    // password generator
    generatePassword = require('generate-password'),
    // password strength tester
    owasp = require('owasp-password-strength-test');

owasp.config(defaultConfig.shared.owasp);

// the max length of password array
const maxPasswordLength = 5;

/**
 * A Validation function for email
 */
var validateEmail = function (email) {
    return (!this.updated || validator.isEmail(email, { require_tld: false }));
};

/**
 * A Validation function for username
 * - at least 3 characters
 * - only a-z0-9_-.
 * - contain at least one alphanumeric character
 * - not in list of illegal usernames
 * - no consecutive dots: "." ok, ".." nope
 * - not begin or end with "."
 */
var validateUsername = function(username) {
    // the regex for legal usernames
    var usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
    return username && usernameRegex.test(username) && defaultConfig.illegalUsernames.indexOf(username) < 0;
};

/**
 * A validation for maintaining an array of certain length
 * @param {*} passwords 
 */
var validateLastPasswordsLength = function(passwords) {
    return passwords.length <= maxPasswordLength;
};

/**
 * User Schema
 */ 
var UserSchema = new Schema ({
    created: {
        type: Date
    },
    roles: {
        type: [{
          type: String,
          enum: ['user', 'admin']
        }],
        default: ['user'],
        required: [true, 'Please provide at least one role']
    },
    displayName: {
        type: String,
        trim: true
    },
    firstName: {
        type: String,
        trim: true,
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        trim: true,
        required: [true, 'First name is required']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'Username already exists'],
        validate: [validateUsername, 'Please enter a valid username: 3+ characters long, non restricted word, characters "_-.", no consecutive dots, does not begin or end with dots, letters a-z and numbers 0-9.'],
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        index: {
            unique: true,
            sparse: true
        },
        default: '',
        required: [true, 'Email is required'],
        unique: [true, 'There is an account already in use with this email address'],
        validate: [validateEmail, 'Please enter a valid email address'],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    passwordUpdatedLast: {
        type: Date
    },
    lastPasswords: {
        type: [{
            type: String
        }],
        default: new Array(),
        validate: [validateLastPasswordsLength, `Last passwords must not exceed ${maxPasswordLength}`]
    },
    updated: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre('validate', function (next) {
    // set user
    var user = this;

    // if password, and modified
    if (user.password && user.isModified('password')) {
        // test new password strength
        var result = owasp.test(user.password);

        // if errors
        if (result.errors.length > 0) {
            // set error and invalidate
            var error = result.errors.join(' ');
            user.invalidate('password', error);
        }
        
        // holds the number of iterations completed
        var indiciesCompleted = 0;

        // if last passwords
        if(user.lastPasswords.length > 0) {
            // check if this password has been used before
            _.forEach(user.lastPasswords, function(lastPassword) {
                // compare the plain text password to the encrypted password
                bcrypt.compare(user.password, lastPassword, function(err, isMatch) {
                    // increase the number completed
                    indiciesCompleted++;

                    // if error
                    if (err) {
                        // invalidate
                        user.invalidate('password', err);
                    }
                    else if(isMatch) {
                        // invalidate
                        user.invalidate('password', 'This password was used previousl');
                    }
                    else if(indiciesCompleted == user.lastPasswords.length) {
                        next();
                    }
                });
            });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
});

/**
 * Hook a pre save method to hash password
 */
UserSchema.pre('save', function(next) {
    // set user
    var user = this;

    // if first save
    if(!user.created) {
        user.created = Date.now();
    }

    // set new date for last updated
    user.updated = Date.now();

    // if first or last name was modified
    if(user.isModified('firstName') || user.isModified('lastName')) {
        user.displayName = user.firstName + ' ' + user.lastName;
    }

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        return next();
    } 

    // generate a salt
    bcrypt.genSalt(defaultConfig.saltRounds, function(err, salt) {
        // if error occurred
        if (err) {
            return next(err);
        }

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            // if error occurred
            if (err) {
                return next(err);
            }

            // check if max number of saved passwords has been hit
            if(user.lastPasswords.length == maxPasswordLength) {
                // pop off the last password
                user.lastPasswords.pop();
            }

            // override the cleartext password with the hashed one
            user.password = hash;
            user.passwordUpdatedLast = new Date();
            user.lastPasswords.unshift(hash);

            next();
        });
    });
});

/**
 * Create instance method to compare passwords
 */
UserSchema.methods.comparePassword = function(plainTextPassword, callback) {
    // compare the plain text password to the encrypted password
    bcrypt.compare(plainTextPassword, this.password, function(err, isMatch) {
        // if error
        if (err) {
            return callback(err);
        }
        
        callback(null, isMatch);
    });
};

// specify the transform schema option
if (!UserSchema.options.toObject) {
    UserSchema.options.toObject = {};
}

/**
 * Create instance method to return an object
 */
UserSchema.options.toObject.transform = function (doc, ret, options) {
    // if hide options
    if (options.hide) {
        // go through each option and remove
        options.hide.split(' ').forEach(function (prop) {
            delete ret[prop];
        });
    }

    // always hide the id and version
    //delete ret['_id'];
    delete ret['__v'];

    // return object
    return ret;
};

/**
 * Create instance method to generate a random passphrase
 */
UserSchema.statics.generateRandomPassphrase = function () {
    return new Promise(function (resolve, reject) {
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
            reject(new Error('An unexpected problem occured while generating the random passphrase'));
        } 
        else {
            // resolve with the validated passphrase
            resolve(password);
        }
    });
};

// set the static seed function
UserSchema.statics.seed = seed;

// export for other uses
module.exports = mongoose.model('User', UserSchema);

/**
* Seeds the User collection with document (User)
* and provided options.
*/
function seed(doc, options) {
    // get User model
    var User = mongoose.model('User');
  
    return new Promise(function (resolve, reject) {
        skipDocument().then(add).then(function (response) {
            return resolve(response);
        })
        .catch(function (err) {
            return reject(err);
        });
  
        // skips a document
        function skipDocument() {
            return new Promise(function (resolve, reject) {
                User.findOne({ 'username': doc.username }).exec(function (err, existing) {
                    // if error, reject
                    if (err) {
                        return reject(err);
                    }
    
                    // if doesn't exist, resolve
                    if (!existing) {
                        return resolve(false);
                    }
        
                    // if existing and not overwriting, resolve
                    if (existing && !options.overwrite) {
                        return resolve(true);
                    }
    
                    // remove User (overwrite)
                    existing.remove(function (err) {
                        // if error, reject
                        if (err) {
                            return reject(err);
                        }
        
                        // resolve
                        return resolve(false);
                    });
                });
            });
        };
    
        // adds user
        function add(skip) {
            return new Promise(function (resolve, reject) {
                // if skip
                if (skip) {
                    return resolve({
                        message: clc.info(`Database Seeding: User\t\t${doc.username} skipped`)
                    });
                }
    
                // if password is present
                if(doc.password) {
                    // create User
                    var user = new User(doc);
                    user.displayName = user.firstName + ' ' + user.lastName;
        
                    // save User
                    user.save(function (err) {
                        // if error
                        if (err) {
                            return reject(err);
                        }
        
                        return resolve({
                            message: `Database Seeding: User\t\t${user.username} added with password set to ${user.password}`
                        });
                    });
                }
                else {
                    // generate random passphreas
                    User.generateRandomPassphrase().then(function (passphrase) {
                        // create User
                        var user = new User(doc);
                        user.displayName = user.firstName + ' ' + user.lastName;
                        user.password = passphrase;
            
                        // save User
                        user.save(function (err) {
                            // if error
                            if (err) {
                                return reject(err);
                            }
            
                            return resolve({
                                message: `Database Seeding: User\t\t${user.username} added with password set to ${passphrase}`
                            });
                        });
                    })
                    .catch(function (err) {
                        return reject(err);
                    });
                }
            });
        };
    });
};