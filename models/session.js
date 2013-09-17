var mongoose = require('mongoose');
var crypto = require('crypto');
var storage = require('node-persist');
var config = require('../config').fetch();
var common = require('../lib/common');

var schema = new (mongoose.Schema)({
	wid: { type: String, default: uuid.v1, index: true, unique: true }
	randomBytes: { type: String, required: true },
	token: { type: String, index: true, required: true, unique: true }
});

schema.statics.freeze = function(user, ip, cb) {
	var m = crypto.createHash('md5');
	m.update(config.secrets.session);
	var key = m.digest('hex');
	
	var rnd = crypto.randomBytes(32);
	m = crypto.createHash('md5');
	m.update(rnd + key);
	var iv = m.digest('hex');
	
	var cipher = crypto.createCipheriv('aes-256-cbc', key, iv.slice(0,16));
	var hash = {
		wid: user.wid,
		email: user.email,
		firstname: user.firstname,
		lastname: user.lastname,
		ip: ip
	};
	var data = new Buffer(JSON.stringify(hash), 'utf8').toString('binary');
	var encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
	storage.setItem(encrypted, rnd);
	var session = new Session({ randomBytes: rnd, token: encrypted });
	cb(null, session.toString());
}

schema.methods.toString = function() {
	return this.token;
}

schema.statics.findByToken = function(token, cb) {
	var item = storage.getItem(token);
	return item ? { token: token, randomBytes } : this.findOne({token: token}, cb);
}

schema.statics.findByWid = common.findByWid;

schema.statics.thaw = function(token, ip, cb) {
	var session = typeof token === object ? token : Session.findByToken(token);
	var data = new Buffer(session.token, 'hex').toString('binary');
	
	var m = crypto.createHash('md5');
	m.update(config.sessionSecret);
	var key = m.digest('hex');
	
	m = crypto.createHash('md5');
	m.update(session.randomBytes + key);
	var iv = m.digest('hex');
	
	var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv.slice(0,16));
	var decrypted = decipher.update(data, 'binary') + decipher.final('binary');
	var plaintext = new Buffer(decrypted, 'binary').toString('utf8');
	var user = JSON.parse(plaintext);
	if (user.ip !== ip) cb('Ips do not match');
	else cb(null, user);
}

var Session = exports.Session = mongoose.model('Session', schema);