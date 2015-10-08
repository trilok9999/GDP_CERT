var conf = require('../../config/serverconf.js');
var uuid = require('uuid'),
	mongo = require('mongodb'),
  	Server = mongo.Server,
Db = mongo.Db;
var pdfDoc=require('pdfkit');
var multer = require('multer');
var url = require('url');
var fs = require('fs');
var upload = multer({ dest: '../../Client/images/' });
//var phantom = require('phantom');
var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('CERT', server);
var async = require("async");
var mongoDB;

db.open(function(err, db) {
  if(!err) {
    console.log("We are connected");
	mongoDB= db
  }
});
module.exports.login = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var query = JSON.parse(body);
		mongoDB.collection('USER', function(err, coll) {
			coll.findOne(query, {_id : 0, password: 0}, function(err, data){
				if(data!=null && data != undefined){
					delete data.password;
					delete data._id;
					mongoDB.collection('USER_SESSION', function(err, coll) {
						var sessionId=req.sessionID;
						var sess = {sessionId:sessionId,user:data};
						coll.insert(sess, function(err){
							if(!err){
								if(data.isApproved){
									data['success'] = true;
									delete data.isApproved;
									res.send(JSON.stringify(data));
								}else{
									res.send("inactive");
								}
							}else{
								res.send("Login Failed");
							}
						});
					});	
				}else{
					res.send("invalid");
				}
			})
		});
	});
}
module.exports.logincheck = function(req, res){
	mongoDB.collection('USER_SESSION', function(err, coll) {
		coll.findOne({sessionId:req.sessionID},{ _id:0}, function(err, data) {
       		if(data!=null && data != undefined){
				   data['success'] = true;
				   res.send(data);
			   }else{
				   var temp={};
				   temp['success'] = false;
				   res.send(temp);
			   }
     	});
	});
}

module.exports.logout = function(req, res){
	var sessionId = req.sessionID;
	 req.session.destroy();
	mongoDB.collection('USER_SESSION', function(err, coll) {
		coll.remove({sessionId:sessionId});
		res.send("success");
	});
}

module.exports.register = function(req, res){
	var  file = req.files.file;
	var uid = uuid.v1();
	fs.rename(file.path,'./images/'+uid+'.jpg');
	var body = req.body;
	body['isApproved'] = false;
	body['userid'] = uid;
	mongoDB.collection('USER', function(err, coll) {
		coll.insert(body, function(err){
			if(!err){
				delete body.password;
				body['success'] = true;
				res.send(body);
			}else{
				res.send("invalid user");
			}
		})
	});
}

module.exports.getusers = function(req, res){
	mongoDB.collection('USER', function(err, coll) {
		coll.find({isApproved:true,groupid:null},{password:0, _id:0, isApproved:0}).toArray(function(err, items) {
       		var response = {};
			if(!err){
				response = {"success":true, members:items}
				res.send(response);
			}else{
				response = {"success":true, members:[]}
				res.send(response);
			}
      });
	});
}

module.exports.getSepusers = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var query = {'userid':{'$in':JSON.parse(body)}};
		mongoDB.collection('USER', function(err, coll) {
			coll.find(query,{password:0, _id:0, isApproved:0}).toarry(function(err, items) {
					var response = {};
					if(!err){
						response = {"success":true, members:items}
						res.send(response);
					}else{
						response = {"success":true, members:[]}
						res.send(response);
					}
			});
		});
	});
}

module.exports.createIncedent = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		body = JSON.parse(body)
		body['incedentid'] = uuid.v1();
		body['status'] = 'A';
		body['createDate'] = new Date();
		mongoDB.collection('INCEDENTS', function(err, coll) {
			coll.insert(body, function(err, data) {
				if(!err){
					res.send({"success":true});
				}else{
					res.send({"success":false});
				}
			});
		});
	});
}

module.exports.addIncedentStatus = function(req, res){
	var  file = req.files.file;
	var body = req.body;
	var uid = uuid.v1();
	if(file!=null && file!=undefined){
		fs.rename(file.path,'./images/'+uid+'.jpg');
		body['img'] = './'+uid+'.jpg'
	}
	body['id'] = uid;
	body['createDate'] = new Date();
	mongoDB.collection('INCEDENTS_WALL', function(err, coll) {
		coll.insert(body, function(err, data) {
			if(!err){
				res.send({"success":true});
			}else{
				res.send({"success":false});
			}
		});
	});
}

module.exports.getIncedents = function(req, res){
	mongoDB.collection('INCEDENTS', function(err, coll) {
		coll.find({},{_id:0}).toArray(function(err, items) {
			if(!err){
				items.forEach(function(incident){
					incident['id']=incident.incedentid;
					var templocation=incident.location;
					templocation.latitude=parseFloat(templocation.latitude);
					templocation.longitude=parseFloat(templocation.longitude);
					incident.location=templocation;
				});
				res.send({"success":true,'incedents':items});
			}else{
				res.send({"success":false,'incedents':[]});
			}
		});
	});
}

module.exports.getIncedentStatus = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		body = JSON.parse(body)
		mongoDB.collection('INCEDENTS_WALL', function(err, coll) {
			coll.find(body,{_id:0}).toArray(function(err, data) {
				if(!err){
					var pUsers = arrayOfValues(data,'postedby');
					mongoDB.collection('USER', function(err, ucoll) {
						ucoll.find({'userid':{'$in':pUsers}},{_id:0}).toArray(function(err,tdata) {
							for(var j = 0; j< data.length; j++ ){
								for(var i = 0; i< tdata.length; i++ ){
									if(data[j]['postedby']=== tdata[i]['userid']){
										 tdata[i]['img'] = "./"+tdata[i]['userid']+".jpg";
										data[j]['postedby'] = tdata[i];
									}
								}
							}
							res.send({"success":true,'incedentStatus':data});
						});
					});
					
				}else{
					res.send({"success":false,'incedentStatus':[]});
				}
			});
		});
	});
}

module.exports.getuser = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var query = JSON.parse(body);
		mongoDB.collection('USER', function(err, coll) {
			coll.findOne(query,{password:0, _id:0, isApproved:0}, function(err, data) {
					if(data!=null && data != undefined){
					data['success'] = true;
					res.send(data);
				}else{
					var temp={};
					temp['success'] = false;
					res.send(temp);
				}
			});
		});
	});
}

module.exports.getpendingusers = function(req, res){
	mongoDB.collection('USER', function(err, coll) {
		coll.find({isApproved:false},{password:0, _id:0, isApproved:0}).toArray(function(err, items) {
       		var response = {};
			if(!err){
				response = {"success":true, members:items}
				res.send(response);
			}else{
				response = {"success":true, members:[]}
				res.send(response);
			}
      });
	});
}


module.exports.activateuser = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var query = JSON.parse(body);
		mongoDB.collection('USER', function(err, coll) {
			coll.update(query, {$set: {isApproved:true}}, function(err, result){
				if(!err){
					res.send({"success":true});
				}
			});
		});
	});
}

module.exports.rejectuser = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var query = JSON.parse(body);
		mongoDB.collection('USER', function(err, coll) {
			coll.remove(query, function(err){
				if(!err){
					res.send({"success":true});
				}
			});
		});
	});
}



module.exports.pendactusers = function(req, res){
	mongoDB.collection('USER', function(err, coll) {
		coll.find({isApproved:false},{password:0, _id:0, isApproved:0}).toArray(function(err, items) {
			var response = {};
			if(!err){
				response = {"success":true, members:items}
				res.send(response);
			}else{
				response = {"success":true, members:[]}
				res.send(response);
			}
      });
	});
}

module.exports.creategroup = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		body = JSON.parse(body);
		mongoDB.collection('GROUPS', function(err, coll) {
			if( body['groupid'] == undefined || body['groupid'] == null ){
				body['groupid'] = uuid.v1();
				var tMem = body.members;
				var mem = arrayOfValues(tMem, 'userid');
				body.members = mem;
				coll.insert(body, function(err){
					if(!err){
						mongoDB.collection('USER' , function(err, ucoll) {
							ucoll.update({'userid':{'$in':mem}},{'$set':{groupid:body.groupid}},{ multi: true });
							ucoll.update({'userid':body.leader},{'$set':{'leader':body.groupid}});
						});
						body['success'] = true;
						res.send(body);
					}else{
						res.send({success:false,message:'create group is failed..'});
					}
				});
			}else{
				var tempMem = body.members;
				var tmem = arrayOfValues(tempMem, 'userid');
				body.members = tmem;
				
				coll.findOne({'groupid':body.groupid},function(err,data){
					var emem = data.members;
					mongoDB.collection('USER', function(err, ucoll) {
					ucoll.update({'userid':{'$in':emem}},{'$unset':{'groupid':''}},{multi:true});
					ucoll.update({'userid':data.leader},{'$unset':{'leader':''}});
					coll.update({groupid:body.groupid},body, function(err){
						if(!err){
							body['success'] = true;
							ucoll.update({'userid':{'$in':tmem}},{'$set':{'groupid':body.groupid}},{ multi: true });
							ucoll.update({'userid':body.leader},{'$set':{'leader':body.groupid}});
							res.send(body);
						}else{
							res.send({success:false,message:'update group is failed..'});
						}
					});
				});
			});
			}
		});
	});
}

module.exports.deletegroup = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		body = JSON.parse(body);
		mongoDB.collection('GROUPS', function(err, coll) {
			if( body['groupid'] != undefined || body['groupid'] != null ){
				var query = {groupid : body.groupid};
				coll.findOne({groupid:body.groupid},{members:1,leader:1},function(err,data){
					var emem = data.members;
					mongoDB.collection('USER', function(err, ucoll) {
					ucoll.update({'userid':{'$in':emem}},{'$unset':{'groupid':''}},{'multi':true});
					ucoll.update({'userid':data.leader},{'$unset':{'leader':''}});
					coll.remove(query, function(err){
						if(!err){
							res.send({"success":true, message:"Deleted Successfully."});
						}else{
							res.send({"success":false, message:"Delete is Failed."});
						}
					});
				});
			});
			}else{
				res.send({"success":false, message:"No such a group Exists.!"});
			}
			
		});
	});
}


module.exports.getgroups = function(req, res){
	
	mongoDB.collection('GROUPS', function(err, coll) {
		coll.find({},{_id:0}).toArray(function(err, items) {
        	var response = {};
			if(!err){
				var users = groupMembers(items);
				var mQuery = {"userid":{"$in":users}};
				mongoDB.collection('USER', function(err, ucoll) {
					ucoll.find(mQuery,{_id:0,password:0,isApproved:0}).toArray(function(err, fusers){
						var grps = groupsTransform(items, fusers);
						response = {"success":true, "groups":grps};
						res.send(response);
					});
				});
			}else{
				response = {"success":true, groups:[]}
				res.send(response);
			}
		}); 
	});
}

module.exports.getmessages = function(req, res){
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){
		var currentUserid =[];
		body = JSON.parse(body)
		currentUserid.push(body);
		var query = {users:{'$in':currentUserid}}
		mongoDB.collection('MESSAGES', function(err, coll) {
			coll.find(query,{_id:0}).toArray(function(err, items) {
				var resData = {};
				if(!err){
					for (var i = 0, len = items.length; i < len; i++) {
						var item = items[i];
						var users = item.users;
						var index = findIndexByKeyValue(users,'userid',body.userid)
						users.splice(index, 1);
						var user = users[0];
						item['cuser'] = user;
						delete item.users;
						if(items.length-1==i){
							resData = {"success":true, "messages":items}
							res.send(resData);
						}
					}
				}else{
					resData = {"success":false, "messages":[]}
					res.send(resData);
				}
			});
		});
	})
}


module.exports.onlineusers = function(req, res){
	
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){		
		var currentUserid =[];
		currentUserid.push(body);
		var query={"userid":{"$nin":currentUserid}, "online" : true};
		mongoDB.collection('USER', function(err, coll) {
			coll.find(query,{password:0, _id:0, isApproved:0}).toArray(function(err, items) {
				var response = {};
				if(!err){
					response = {"success":true, "users":items}
					res.send(response);
				}else{
					response = {"success":true, "users":[]}
					res.send(response);
				}
			});
		});
	});
}

module.exports.getmessage = function(req, res){
	
	var body = "";
	req.on('data', function(item){
		body+= item;
	});
	req.on('end', function(){		
		var currentUserid =[];
		body = JSON.parse(body);
		currentUserid = body.users;
		var query = {users:{'$all':currentUserid}}
		mongoDB.collection('MESSAGES', function(err, coll) {
			coll.findOne(query,{_id:0}, function(err, item) {
				var resData = {};
				if(!err && item !=null){
					var users = item.users;
					var index = findIndexByKeyValue(users,'userid', body.userid);
					users.splice(index, 1);
					var user = users[0];
					item['cuser'] = user;
					delete item.users;
					resData = {"success":true, "message":item}
					res.send(resData);
				}else{
					resData = {"success":false, "message":{}}
					res.send(resData);
				}
			});
		});
	});
}

module.exports.getPdf=function(req,res){
	var doc = new pdfDoc(),firstTag = true;

	mongoDB.collection('INCEDENTS', function(err, coll) {
		coll.find({"name":req.query.name}).toArray(function(err, items) {
			if(!err){
				items.forEach(function(incident){
					incident['id']=incident.incedentid;
					var templocation=incident.location;
					templocation.latitude=parseFloat(templocation.latitude);
					templocation.longitude=parseFloat(templocation.longitude);
					incident.location=templocation;
					if (firstTag) {// First page is automatically created
						firstTag = false;
					} else {// The rest must be added
						doc.addPage();
					}
					doc.fontSize(40).text(incident.name);
					incident.groups.forEach(function(group){
						doc.fontSize(20).text(group.name);
						group.members.forEach(function(member){
							doc.fontSize(20).text(member.fname+" "+member.lname);
						});
					});
					doc.fontSize(20).text(incident.type);

				});


				doc.pipe(res);

				doc.end();
			}else{
				res.send({"success":false,'incedents':[]});
			}
		});
	});

}

function findIndexByKeyValue(arraytosearch, key, valuetosearch) {    
    for (var i = 0; i < arraytosearch.length; i++) {
      if (arraytosearch[i][key] == valuetosearch) {
        return i;
        }
      }
    return null;
}

function groupMembers(items){
	var li = []; 
	for(var i = 0; i < items.length; i++){
		var arraytosearch = items[i].members;
		for (var j = 0; j < arraytosearch.length; j++) {
			li.push(arraytosearch[j]);	
     }
	}
	return li;
}


function arrayOfValues(arraytosearch, key){ 
	var li = []; 
	for (var i = 0; i < arraytosearch.length; i++) {
		li.push(arraytosearch[i][key]);	
     }
	 return li;
}

function groupsTransform(groups, users){
	for(var i = 0; i < groups.length; i++){
		var members = groups[i].members;
		var mem = [];
		for(var j = 0; j < members.length; j++){
			for(var k = 0 ; k< users.length; k++){
				if(members[j]===users[k]['userid']){
					users[k]['img'] = "./"+users[k]['userid']+".jpg";
					mem.push(users[k]);
				}
			}
		}
		for(var l = 0 ; l< mem.length; l++){
			if(mem[l]['userid']===groups[i].leader){
				groups[i].leadername = mem[l].fname;
				groups[i].img = mem[l].img;
				groups[i].leader = mem[l];
			}
		}
		groups[i].members = mem;
	}
	return groups;
}