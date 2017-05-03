var express = require('express');
var ensureLogin = require('connect-ensure-login');
var router = express.Router();

router.get('/', ensureLogin.ensureLoggedIn(), function (req, res) {
    res.render('profile', {user: req.user});
});

module.exports = router;