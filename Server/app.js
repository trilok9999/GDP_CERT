var express = require('express');
var app = express();
var path = require('path');
var session = require('express-session');
//var bodyParser=require('body-parser');
//var cookieParser = require('cookie-parser');
var session      = require('express-session');
var MongoStore = require('connect-mongo')(session);
var done = false;

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*.*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//app.use(bodyParser());
//app.use(cookieParser());
app.use(session({
    cookie: { maxAge: 1000 * 60 * 2 },
    secret: "certSatya",
    store: new MongoStore({
		db: 'CERT',
		host: 'localhost',
		port: 27017,
		collection: 'session',
		auto_reconnect: true
    })
}));
app.use(function(req, res, next) {  
    res.header('Access-Control-Allow-Origin', '*.*');
    next();
});
var multipart = require('connect-multiparty');

app.use(multipart({
    uploadDir: './images'
}));

app.use("/myapp",express.static(path.join(__dirname, "../Client")));
app.use("/xml",express.static(path.join(__dirname, "../Client/xmlfileupload")));
app.use('/myapp',express.static(path.join(__dirname, './images')));

var sess;

require('./app/router/cert-router.js')(app);

app.listen(1000);
console.log('Sever Started on 1000');