'use strict';

var Users = require('../models/users.js');
var mongoose = require('mongoose');

function MainController() {

    this.home = function(req, res) {
        res.render('main/home',
                   { 'title': 'Home Page',
                     'auth_status': req.isAuthenticated() });
    };

}

module.exports = MainController;
