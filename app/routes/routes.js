'use strict';

var path = process.cwd();
var MainController = require(path + '/app/controllers/main_controller.js');
var default_route = '/';

module.exports = function(app, passport) {

    var main_controller = new MainController();

    app.route('/')
        .get(main_controller.home);

    app.route('/logout')
        .get(function(req, res) {
            req.logout();
            res.redirect(default_route);
        });

    app.route('/auth/github')
        .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
        .get(passport.authenticate('github', {
            successRedirect: default_route,
            failureRedirect: default_route
        }));
};
