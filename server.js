var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var errorHandler = require('errorhandler');
var ensureLogin = require('connect-ensure-login');
var db = require('./db');

var index = require('./routes/index');
var users = require('./routes/users');
var profile = require('./routes/profile');

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(function (username, password, cb) {
    db.users.findByUsername(username, function (err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            return cb(null, false);
        }
        if (user.password != password) {
            return cb(null, false);
        }
        return cb(null, user);
    });
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.set('port', process.env.PORT || 3000);

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: false, saveUninitialized: false}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

if ('development' === app.get('env')) {
    app.use(errorHandler());
}

// Define routes.
app.use('/', index);
app.use('/users', users);
app.use('/profile', profile);

//404
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404-NotFound');
});

//500
app.use(function (err, req, res, next) {
    console.log(err.stack);
    res.status(500);
    res.type('text/plain');
    res.send('500-ServerError');
});

app.listen(app.get('port'), function () {
    console.log('The server is started at http://localhost:'
        + app.get('port') + '; press Ctrl-C to terminate');
});
