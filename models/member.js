var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uuid = require('node-uuid');
var moment = require('moment');
var bcrypt = require('bcrypt');

var coerce = require('../lib/coercions');
var validate = require('../lib/validation');
var common = require('../lib/common');

var schema = new Schema({
	wid: { type: String, default: uuid.v1, index: true, unique: true },
	username: { type: String, index: true, match: /[a-zA-Z0-9_!?.,-]{3,}/, required: true, unique: true },
	password: { type: String, validate: validate.password, required: true, select: false },
	email: { type: String, index: true, required: true, unique: true, lowercase: true, match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i },
	firstname: { type: String, match: /^[A-Z][a-zA-Z ]*/, required: true },
	lastname: { type: String, match: /^[A-Z][a-zA-Z ]*/, required: ture },
	avatarKey: String,
	types: [String],
	favoriteVerses: [{ reference: String, text: String }],
	favoriteSermons: [Schema.Types.ObjectId]
	joined: { type: Date, default: Date.now, get: coerce.toDate },
	birthday: { type: Date, set: coerce.fromDate, get: coerce.toDate }
});

schema.statics.findByWid = common.findByWid;

schema.methods.is = function(type) {
	return this.types.indexOf(type) !== -1;
}

schema.pre('save', function(next){
    bcrypt.hash(this.password, 8, function(err, hash) {
       next(); 
    });
});

schema.statics.authenticate = function(pw, username, cb) {
	var query = {};
	var field = /@/.test(username) ? 'email' : 'username';
	query[field] = username;
	this.findOne(query, '+password', function(err, member){
		bcrypt.compare(pw, member.password, function(err, res){
			if (res) cb(null, member);
			else cb('Invalid password');
		});
	});
}

var Member = exports.Member = mongoose.model('Member', schema);
