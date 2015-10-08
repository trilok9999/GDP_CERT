var certCtrl = require('../controller/cert-controller.js');
var conf = require('../../config/serverconf.js');


module.exports = function(app){
	app.post('/login', certCtrl.login);
	app.get('/logincheck', certCtrl.logincheck);
	app.post('/register', certCtrl.register);
	app.get('/getusers', certCtrl.getusers);
	app.get('/getpendingusers', certCtrl.getpendingusers);
	app.post('/activateuser', certCtrl.activateuser);
	app.post('/rejectuser', certCtrl.rejectuser);
	app.get('/pendactusers', certCtrl.pendactusers);
	app.post('/creategroup', certCtrl.creategroup);
	app.post('/deletegroup', certCtrl.deletegroup);
	app.get('/getgroups', certCtrl.getgroups);
	app.post('/getmessages', certCtrl.getmessages);
	app.post('/getuser', certCtrl.getuser);
	app.post('/getSepusers', certCtrl.getSepusers);
	app.post('/onlineusers', certCtrl.onlineusers);
	app.post('/getmessage', certCtrl.getmessage);
	app.get('/logout', certCtrl.logout);
	app.post('/createIncedent', certCtrl.createIncedent);
	app.post('/addIncedentStatus', certCtrl.addIncedentStatus);
	app.get('/getIncedents', certCtrl.getIncedents);
	app.post('/getIncedentStatus', certCtrl.getIncedentStatus);
	app.get('/pdf',certCtrl.getPdf);
}