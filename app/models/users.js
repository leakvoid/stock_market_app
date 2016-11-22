'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

/*
var voteSchema = new Schema({
    ip_address: String,
    vote_owner: [{ type: ObjectId, ref: 'User'}]
});

var choiceSchema = new Schema({
    name: String,
    votes: [voteSchema]
});

var pollSchema = new Schema({
    name: String,
    choices: [choiceSchema]
});
*/

var userSchema = new Schema({
    github: {
        id: String,
        displayName: String,
        username: String,
        publicRepos: Number
    }
});

module.exports = mongoose.model('User', userSchema);
