var myApp = angular.module('myApp',['ngMaterial', 'ngAria', 'ngAnimate','ngFileUpload','uiGmapgoogle-maps']);


myApp.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('deep-purple', {
      'default': '400', // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    })
    // If you specify less than all of the keys, it will inherit from the
    // default shades
    .accentPalette('grey', { 
      'default': 'A400' // use shade 200 for default, and keep all other shades the same
    });
});

myApp.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyD0BHXdv1_QwK5H_lrb1jFSdrwfDkn9KyA',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});
//controller for maps
myApp.controller('certContrl',function($scope, uiGmapGoogleMapApi,$http,$window){
    uiGmapGoogleMapApi.then(function(maps) {

        $scope.map = { center: { latitude: 40.35245, longitude:-94.8822529999999}, zoom: 8 };


        $http.get("http://localhost:1000/getIncedents").success(function (response) {
            response.incedents.forEach(function(incident){
                incident['icon']="./images/"+incident.type+".png";
            });

            $scope.incidentArray = response.incedents;



        });

        $scope.generatePDF=function(incident){
            var myPdfUrl = 'http://localhost:1000/pdf?name='+incident.name+'';
            $window.open(myPdfUrl);
            //$http.get(myPdfUrl)
            //    .success(function(data){
            //        //data is link to pdf
            //        $window.open(data);
            //    });
        };



    });

});
myApp.controller('certController',certController);



function certController($timeout, $q, $scope, $rootScope, $mdSidenav, $mdDialog, $http, Upload, $filter, $mdMedia, socket) {
 
  $scope.flag = "home";
  $scope.ulog = true;
  $rootScope.cgformid = "cgform1";
  $rootScope.cgformtitle = "Create Group";
  $rootScope.edit=false;
  $rootScope.menuItemHome = true;
  $scope.menuitems = [{'title':'HOME','id':'home'}];
  $rootScope.bgroups = ['A+','O+','B+','AB+','A-','O-','B-','AB-'];
  $rootScope.groups = [];      
  $rootScope.members = [];
  $scope.user={};
  $rootScope.mdMedia=$mdMedia;

  $scope.setGrpMembers = function(group){
    var dupeUserIndexes = [];
    for(var j=0;j<group.members.length;j++){
      for(var i=0;i<$scope.members.length;i++){
        if($scope.members[i].fname===group.members[j].fname){
          $scope.members.splice(i,1);
          $scope.members.push(group.members[j]);
        }
      }
    }
  }
  $scope.selectedIncident='';
  $scope.getSelectedIncident = function(){
    ////console.log($scope.selectedIncident);
    return $scope.selectedIncident;
  }

  $scope.selectedPUser = '';
  $scope.userselected = false;
  $scope.getSelectedPUser = function(){
    return $scope.selectedPUser;
  }
  $scope.isUserSelected = function(){
    ////alert('lol');
    return $scope.userselected;
  }
  $scope.resetUserSelected = function(){
    $scope.userselected=false;
  }

  $rootScope.getuser = function (userid) {
    $scope.selectedPUser = userid;
    $scope.userselected = true;
     $http.post('http://localhost:1000/getuser', JSON.stringify({'userid':userid})).then(function (response) {
        if(response.data.success){
          delete response.data.success;
          var user = response.data;
          user.photo = './'+response.data.userid+'.jpg'
          $rootScope.curuser = user;
        }
     }, function (response) {
     });
   };


                        
   $rootScope.login = function (user) {
    var tempU= {};
    tempU["emailid"] = user.emailid;
    tempU["password"] = user.password;
     $http.post('http://localhost:1000/login', JSON.stringify(tempU)).then(function (response) {
        if(response.data.success){
          delete response.data.success;
          var user = response.data;
          user.photo = './'+response.data.userid+'.jpg'
          $scope.user = user;
          $rootScope.user= user;
          $scope.ulog = false;
          socket.emit('userlogin', {"username":user.fname,"userid":user.userid});
          $rootScope.onlineusers();
          $rootScope.getMessages();
          $scope.menuitems = [{'title':'HOME','id':'home'},
                        {'title':'MESSGAES','id':'messages'},
                        {'title':'PENDING REQUESTS','id':'pndngreqs'},
                        {'title':'MANAGE GROUPS','id':'mnggrps'},
                        {'title':'INCIDENTS','id':'incidents'},
                        {'title':'MAPS','id':'maps'},
                        {'title':'REPORTS','id':'reports'}];
        }else if(response.data==='invalid'){
          //alert('Invalid credentials');
        }else if(response.data==='inactive'){
          //alert('Your account is inactive, please contact Administator');
        }
     }, function (response) {
     });
   };
    $rootScope.loginCheck = function (user) {
     $http.get('http://localhost:1000/logincheck', JSON.stringify(user)).then(function (response) {
        if(response.data.success){
         delete response.data.success;
          var user = response.data.user;
          user.photo = './'+user.userid+'.jpg'
          $scope.user = user;
          $rootScope.user= user;
          $scope.ulog = false;
          socket.emit('userlogin', {"username":user.fname,"userid":user.userid});
          $rootScope.onlineusers();
          $rootScope.getMessages();
          $scope.menuitems = [{'title':'HOME','id':'home'},
                        {'title':'MESSGAES','id':'messages'},
                        {'title':'PENDING REQUESTS','id':'pndngreqs'},
                        {'title':'MANAGE GROUPS','id':'mnggrps'},
                        {'title':'INCIDENTS','id':'incidents'},
                        {'title':'MAPS','id':'maps'},
                        {'title':'REPORTS','id':'reports'}];
        }else{
          $scope.ulog = true;
        }
     }, function (response) {
     });
   };
   $rootScope.logout = function (user) {
     $http.get('http://localhost:1000/logout').then(function (response) {
        if(response.data=="success"){
          $scope.flag = "home";
          $scope.ulog = true;
          $rootScope.cgformid = "cgform1";
          $rootScope.cgformtitle = "Create Group";
          $rootScope.edit=false;
          $rootScope.menuItemHome = true;
          $scope.menuitems = [{'title':'HOME','id':'home'}];
        }
     }, function (response) {
     });
   };
  $rootScope.loginCheck();              
  $rootScope.register = function (user) {
    if(user.password===user.cpassword){
        delete user.cpassword;
        if (!$rootScope.file.$error) {
            Upload.upload({
                url: 'http://localhost:1000/register',
                fields: user,
                file: $rootScope.file
            }).success(function(data){
              $rootScope.avatarUrl = data.url;
            }).error(function(data,status){
            });
          }
     }else{
       //alert("Password mismatch..!!");
     }
     
   };

   $rootScope.updateStatus = function (status) {
    if(status!==undefined&&status.message!==''){
      status.postedby = $rootScope.user.userid;
    status.incident = $rootScope.curincident.incedentid;
    ////console.log($rootScope.file.$error);
        if ($rootScope.statusfile===undefined||!$rootScope.statusfile.$error) {
            Upload.upload({
                url: 'http://localhost:1000/addIncedentStatus',
                fields: status,
                file: $rootScope.statusfile
            }).success(function(data){
              status.message='';
              status={};
              $rootScope.statusfile='';
              $scope.getincidentwall($rootScope.curincident);
            }).error(function(data,status){
            });
          }
     
        } else {
          alert("status message can't be empty")
        }
    
     
   };

   $scope.getincidentwall = function(incident){
    $scope.selectedIncident=incident.incedentid;
    $rootScope.curincident=incident;
    $http.post('http://localhost:1000/getIncedentStatus',{'incident':$rootScope.curincident.incedentid}).success(function (response) {
        if(response.success){
          ////alert('in success')
          $rootScope.incidentwall=response.incedentStatus;
          $rootScope.createIncident = false;
          /////alert(JSON.stringify($rootScope.groupsforincident));
        }
      }).error(function(data){
        //alert('error!')
      });
   }
   
  $rootScope.newMessage = function (messages) {
    var users = $rootScope.group.members;
   for (var i = 0; i < users.length; i++) {
          var user = users[i];
          user['username'] = user.fname;
           $rootScope.sendMessage(user,messages);
        };     
   };

  $rootScope.cgnext = function() {
    $rootScope.cgformtitle ="Add Members";
    $rootScope.cgformid ="cgform2";
  } 
  $rootScope.cgback = function() {
    $rootScope.cgformtitle="Create Group";
    $rootScope.cgformid ="cgform1";
  };
  
    $rootScope.cgcreate = function() {
      $rootScope.cgformid="cgform1";
      $rootScope.cgformtitle="Create Group";
  };
  
    $scope.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
    if(menuId==='right'){
      $rootScope.onlineusers();
    }
  }; 
  
  /*$scope.toggleRight = function(){
   $mdSidenav('right')
              .toggle()
              .then(function () {
                
              });
          }*/
  $scope.setitem = function (item) {
    $scope.flag=item;
  } 
  
  $scope.showAdvanced = function(ev) {
    var model_tpl_url = './html/'+ev+'.html';
    $mdDialog.show({
      controller: DialogController,
      templateUrl: model_tpl_url,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true
    })
    .then(function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.status = 'You cancelled the dialog.';
    });
  };

  $scope.getGroupsForIncident = function(){
    ////alert('in')
        $http.get('http://localhost:1000/getgroups').success(function (response) {
        if(response.success){
          ////alert('in success')
          delete response.success;
          $rootScope.groupsforincident= response.groups;
          $rootScope.incidenttypes = ['Water', 'Fire', 'Electricity', 'Tornado'];
          /////alert(JSON.stringify($rootScope.groupsforincident));
        }
      }).error(function(data){
        //alert('error!')
      });
  }

  $scope.getAllIncidents = function(){
    $http.get('http://localhost:1000/getIncedents').success(function (response) {
        if(response.success){
          ////alert('in success')
          delete response.success;
          $rootScope.incidents= response.incedents;
          /////alert(JSON.stringify($rootScope.groupsforincident));
        }
      }).error(function(data){
        //alert('error!')
      });
  }

  $scope.saveIncident = function(){
    $http.post('http://localhost:1000/createIncedent',$rootScope.curincident).success(function (response) {
        if(response.success){
          ////alert('in success')
          $scope.getGroupsForIncident();
          $scope.getAllIncidents();
          $rootScope.createIncident = false;
          /////alert(JSON.stringify($rootScope.groupsforincident));
        }
      }).error(function(data){
        //alert('error!')
      });
  }

  

  $scope.getMembers = function(){
       $http.get('http://localhost:1000/getusers').success(function (response) {
        if(response.success){
          delete response.success;
          for(var i=0; i<response.members.length; i++){
            response.members[i].img='./'+response.members[i].userid+'.jpg'
          }
          $rootScope.members= response.members;
          $scope.setGrpMembers($rootScope.group);
        }
      }).error(function(data){
        //alert('error!')
      });
  }

  $scope.getPendingMembers = function(){
       $http.get('http://localhost:1000/getpendingusers').success(function (response) {
        if(response.success){
          delete response.success;
          for(var i=0; i<response.members.length; i++){
            response.members[i].img='./'+response.members[i].userid+'.jpg'
          }
          $rootScope.pendingmembers= response.members;
        }
      }).error(function(data){
        //alert('error!')
      });
  }


  $rootScope.curuser={};
  $rootScope.activateuser = function (userid) {
     $http.post('http://localhost:1000/activateuser', JSON.stringify({'userid':userid})).success(function (data) {
        if(data.success){
          $scope.getPendingMembers();
        }
     });
   };
   $rootScope.rejectuser = function (userid) {
     $http.post('http://localhost:1000/rejectuser', JSON.stringify({'userid':userid})).success(function (data) {
        if(data.success){
          $scope.getPendingMembers();
        }
     });
   };
   $scope.deleteGroup = function (groupid,event) {
    
    event.preventDefault();
    event.stopPropagation();
     $http.post('http://localhost:1000/deletegroup', JSON.stringify({'groupid':groupid})).success(function (data) {
        if(data.success){
         $scope.getGroups();
        }
     });
   };

  $scope.$watch(function() {
    return $rootScope.pendingmembers;
  }, function() {
    var members=$rootScope.pendingmembers
    if(members.length>0){
      $rootScope.getuser(members[0].userid);
    }
  }, true);

  $rootScope.group={'members':''};

  $scope.$watch(function() {
    return $rootScope.group.members;
  }, function() {
    var curGrp = $rootScope.group;
    var leader = $filter('filter')(curGrp.members,{'userid':curGrp.leader.userid});
    if(leader===undefined||leader===null|| leader.length<=0){
      //alert('lol!!')
      curGrp.leader=undefined;
    }
  }, true);

  //$rootScope.$watch($rootScope.group.members, $rootScope.isLeaderDeleted($rootScope.group), true);

  
  $scope.getMembers();
    $scope.saveGroup = function(){
      var group = angular.fromJson(JSON.stringify($rootScope.group));
      $http.post('http://localhost:1000/creategroup', group).success(function (response) {
        if(response.success){
         
        }
      }).error(function(data){
        //alert('error!')
      });
    }

    $scope.getGroups = function(){
        $http.get('http://localhost:1000/getgroups').success(function (response) {
        if(response.success){
          delete response.success;
          $rootScope.groups= response.groups;
        }
      }).error(function(data){
        //alert('error!')
      });
  }
  
    $rootScope.filterSelected = true;
    $rootScope.group = {'name':'','members':[]};
    /**
     * Search for contacts.
     */
     $rootScope.querySearch = function(query) {
      var results = query ?
          $rootScope.members.filter($rootScope.createFilterFor(query)) : [];
      return results;
    }

    $rootScope.querySearchGFI = function(query) {
      var results = query ?
          $rootScope.groupsforincident.filter($rootScope.createFilterForGFI(query)) : [];
      return results;
    }
    /**
     * Create filter function for a query string
     */
    $rootScope.createFilterFor = function(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(member) {
        return ((angular.lowercase(member.fname)).indexOf(lowercaseQuery) != -1);;
      };
    }

    $rootScope.createFilterForGFI = function(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(group) {
        return ((angular.lowercase(group.name)).indexOf(lowercaseQuery) != -1);;
      };
    }
    $rootScope.onlineusers = function () {
     var userid = $rootScope.user.userid;
     $http.post('http://localhost:1000/onlineusers', $rootScope.user.userid).then(function (response) {
        if(response.data.success){
          delete response.data.success;
          var users = response.data.users;
          for(var i=0; i<users.length; i++){
            users[i].img='./'+users[i].userid+'.jpg'
          }
          $rootScope.olusers = users;
        }
     }, function (response) {
     });
   };
  $rootScope.getMessages = function () {
     var reqObj = {'username':$rootScope.user.fname,'userid':$rootScope.user.userid};
     $http.post('http://localhost:1000/getmessages', JSON.stringify(reqObj)).then(function (response) {
        if(response.data.success){
          delete response.data.success;
          if(response.data.messages!=null && response.data.messages!=undefined){
             $rootScope.messages = response.data.messages;
          }else{
             $rootScope.messages = [];
          }
         
        }
     }, function (response) {
     });
   };

    
   $rootScope.sendMessage = function (touser,message) {
     var users = [];
     var touser = {'username':touser.username, 'userid': touser.userid};
     var fromuser = {'username':$rootScope.user.fname,'userid':$rootScope.user.userid};
     users.push(touser);
     users.push(fromuser);
     var msg = {'username':$rootScope.user.fname,'userid':$rootScope.user.userid, 'messages' : message, 'date':new Date()}; 
     var req = {'users':users, 'messages':msg};
     //console.log("sendMessage");
     socket.emit('message',req);

   };

   $rootScope.chatusers=[];

   $rootScope.chatuser = function(user){
    var reqObj ={userid:$rootScope.user.userid, users:[{'username':user.fname, 'userid':user.userid}, {'username':$rootScope.user.fname, 'userid':$rootScope.user.userid}]};
    $http.post('http://localhost:1000/getmessage', JSON.stringify(reqObj)).then(function (response) {
        if(response.data.success){
          delete response.data.success;
          var cmsg = response.data.message;
          if(cmsg!=null && cmsg!=undefined){
              $rootScope.chatusers.push(cmsg);
          }else{
            var tuser = {'cuser':{'username':user.fname, 'userid':user.userid}, 'messages':[]};
            $rootScope.chatusers.push(tuser);
          }
         
        }else{
          var tuser = {'cuser':{'username':user.fname, 'userid':user.userid}, 'messages':[]};
          $rootScope.chatusers.push(tuser);
        }
     }, function (response) {
     });
      $scope.toggleSidenav('right');
   }

$rootScope.findIndexByKeyValue = function (arraytosearch, key, valuetosearch) {    
    for (var i = 0; i < arraytosearch.length; i++) {
      if (arraytosearch[i][key] == valuetosearch) {
        return i;
        }
      }
    return null;
}

   //socket calls

    socket.on('newlogin',function(data){
      $rootScope.onlineusers()
    }); 
    /*message revicing*/
    socket.on('message',function(data){
      var users = data.users;
      var uIndex = $rootScope.findIndexByKeyValue(users,'userid',$rootScope.user.userid);
      users.splice(uIndex, 1);
      var user = users[0];
      data['cuser'] = user;
      delete data.users;
      var msgIndex = $rootScope.findIndexByKeyValue($rootScope.messages,'messageid',data.messageid);
      /*if(msgIndex!=-1){
        $rootScope.messages.splice($rootScope.messages.indexOf(msgIndex),1);
      }
      $rootScope.messages.push(data);*/
       $rootScope.messages[msgIndex].messages = data.messages;
       $rootScope.messages[msgIndex].lastupdated = data.lastupdated;
      /*
      var chatIndex = findIndexByKeyValue($rootScope.chatusers,'messageid',data.messageid);
      if(chatIndex!=-1){
        //console.log(data);
        $rootScope.chatusers[chatIndex].messages = data.messages;
      }else{
        $rootScope.chatusers.push(data);
      }*/
    }); 


};


  
function DialogController($scope, $rootScope, $mdDialog) {

  //$scope.cgformtitle = $rootScope.cgformtitle;
  //$scope.cgformid =  $rootScope.cgformid;
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.mdRegister = function(user) {
    $rootScope.register(user);
    $mdDialog.cancel();
  };
$scope.mdMsgSend = function(users, message) {
    $rootScope.newMessage(users,message);
    $mdDialog.cancel();
  };

  $scope.mdlogin = function(user) {
   $rootScope.login(user);
    $mdDialog.cancel();
  };
   $scope.mdcgcreate = function() {
      $rootScope.mdcgcreate();
      $mdDialog.cancel();
    
  };
  $scope.mdcgnext = function() {
     $rootScope.cgnext();
     //$scope.cgformid =  $rootScope.cgformid;
  };
  $scope.mdcgback = function() {
   $rootScope.cgback();
   //$scope.cgformid =  $rootScope.cgformid;
  };
}

/*myApp.directive('checkFirst', function($rootScope) {
   return{
      restrict: 'A',
      scope:{members:'='}
      link:function (scope, element, attrs) {
        //alert('in func')
        if (scope.$first) {
          //alert(JSON.stringify(scope.member));
           $rootScope.getuser(scope.member.userid);
        }
     }
   } 
});*/

myApp.directive('createIncident', function() {
  return {
    restrict: 'E',
    
    templateUrl: '/myapp/html/createincident.html'
  }
});

myApp.directive('incidentWall', function() {
  return {
    restrict: 'E',
    
    templateUrl: '/myapp/html/incidentwall.html'
  }
});

myApp.directive('item', function() {
  return {
    restrict: 'A',
    link: function(scope,element,attrs){
      scope.getContentUrl = function() {
                return './html/' + attrs.item + '.html';
           }
    },
    template: '<div ng-include="getContentUrl()"></div>'
  }
});

myApp.directive('schrollBottom', function () {
  return {
    scope: {
      schrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('schrollBottom', function (newValue) {
        if (newValue)
        {
          $(element).scrollTop($(element)[0].scrollHeight);
        }
      });
    }
  }
})

myApp.directive('profile', function() {
  return {
    restrict: 'E',
    templateUrl: '/myapp/html/profile.html'
  }
});

myApp.directive('message', function() {
  return {
    restrict: 'E',
    templateUrl: '/myapp/html/msg.html'
  }
});

myApp.directive('profileSm', function() {
  return {
    restrict: 'E',
    templateUrl: '/myapp/html/profileSm.html'
  }
});

myApp.directive('formtype', function() {
  return {
    restrict: 'A',
    link: function(scope,element,attrs){
      scope.getformtUrl = function() {
                return './html/'+attrs.formtype + '.html';
           }
    },
    template: '<div ng-include="getformtUrl()"></div>'
  }
});

myApp.directive('nksOnlyNumber', function () {
    return {
        restrict: 'EA',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                var spiltArray = String(newValue).split("");

                if(attrs.allowNegative == "false") {
                    if(spiltArray[0] == '-') {
                        newValue = newValue.replace("-", "");
                        ngModel.$setViewValue(newValue);
                        ngModel.$render();
                    }
                }

                if(attrs.allowDecimal == "false") {
                    newValue = parseInt(newValue);
                    ngModel.$setViewValue(newValue);
                    ngModel.$render();
                }

                if(attrs.allowDecimal != "false") {
                    if(attrs.decimalUpto) {
                        var n = String(newValue).split(".");
                        if(n[1]) {
                            var n2 = n[1].slice(0, attrs.decimalUpto);
                            newValue = [n[0], n2].join(".");
                            ngModel.$setViewValue(newValue);
                            ngModel.$render();
                        }
                    }
                }


                if (spiltArray.length === 0) return;
                if (spiltArray.length === 1 && (spiltArray[0] == '-' || spiltArray[0] === '.' )) return;
                if (spiltArray.length === 2 && newValue === '-.') return;

                /*Check it is number or not.*/
                if (isNaN(newValue)) {
                    ngModel.$setViewValue(oldValue);
                    ngModel.$render();
                }
            });
        }
    };
});

myApp.factory('socket', function ($rootScope) {
  var socket = io.connect("http://localhost:2000");
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});