'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stockSchema = new Schema({
    stock_name: String
});

module.exports = mongoose.model('Stock', stockSchema);
