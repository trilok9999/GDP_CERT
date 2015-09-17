var express = require('express');  
var app = express();  
var uuid = require('uuid');
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var chatmongo = require('mongodb'),
  	MongoServer = chatmongo.Server,
	ChatDb = chatmongo.Db;
var mserver = new MongoServer('localhost', 27017, {auto_reconnect: true});
var chatdb = new ChatDb('CERT', mserver);
var events = require("events");
var EventEmitter = require("events").EventEmitter;
 
var event = new EventEmitter();


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});


var chatmongoDB;
 var a=1;
chatdb.open(function(err, db) {
  if(!err) {
    console.log("We are connected");
	chatmongoDB= db
  }
});


io.on('connection', function(socket) {  
    socket.on('userlogin', function(data) {
      var query = data;
       chatmongoDB.collection('USER', function(err, coll) {
        coll.update(query, {$set: {online:true}}, function(err, result){
          if(!err){
            socket.broadcast.emit('newlogin')
            chatmongoDB.collection('USER_SOCKET', function(err, colltest) {
              var socObj = {'users':data, 'socketId':socket.id}
              colltest.insert(socObj, function(err){
                  if(!err){
                  }
              });
            });
          }
        });
      });
    });
    
   socket.on('disconnect', function(){
     chatmongoDB.collection('USER_SOCKET', function(err, coll) {
        coll.remove({'socketId':socket.id});
     });
   });
   
   socket.on('message', function(data){
     var query = {'users':{'$all':data.users}};
     var query1 = {'users':{'$in':data.users}};
     chatmongoDB.collection('MESSAGES', function(err, coll) {
       coll.count(query, function(err,count){
         if(count!=0){
           coll.update(query, {'$push': { 'messages': data.messages} ,'$set':{'lastupdated':new Date().getTime()}}, function(err){
            if(!err){
              coll.findOne(query, {_id:0}, function(cerr,item){
                if(!cerr){
                  event.emit("sendmsg",query1,item);
                }
              });
            }
          });
         }else{
           var uid = uuid.v1();
            var message = data.messages;
            var msg = [];
            msg.push(message);
            data['messages'] = msg;
            data['messageid'] = uid;
            data['lastupdated'] = new Date().getTime();
            coll.insert(data, function(err){
              if(!err){
                 event.emit("sendmsg",query1,data);
                
              }
            });
         }
      });
      })
   });
   
   event.on('sendmsg',function(query, data){
     chatmongoDB.collection('USER_SOCKET', function(err, coll) { 
      coll.find(query, {_id:0}).toArray(function(err, items) {
        
            for (var i = 0, len = items.length; i < len; i++) {
              var item = items[i];
              var sockId = item.socketId;
              io.to(sockId).emit('message', data);
            }
        });
    });
     
   });
});

server.listen(2000);
console.log("Chat server started at 2000");