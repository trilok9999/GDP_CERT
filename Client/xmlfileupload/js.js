var exeApp = angular.module('serverExe', ['xml'])
.directive('onReadFile', function ($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            element.bind('change', function(e) {
                
                var onFileReadFn = $parse(attrs.onReadFile);
                var reader = new FileReader();
                
                reader.onload = function() {
                    var fileContents = reader.result;
                    // invoke parsed function on scope
                    // special syntax for passing in data
                    // to named parameters
                    // in the parsed function
                    // we are providing a value for the property 'contents'
                    // in the scope we pass in to the function
                    scope.$apply(function() {
                        onFileReadFn(scope, {
                            'contents' : fileContents
                        });
                    });
                };
                reader.readAsText(element[0].files[0]);
            });
        }
    };
})
.controller('someCtrl', function($scope,x2js,$http){

    $scope.displayFileContents = function(contents) {
        console.log(contents);
        var jsonObj = x2js.xml_str2json( contents );
        
        console.log(JSON.stringify(jsonObj))

        jsonObj.Transaction.Booking.Affiliate._ID='54321';
        jsonObj.Transaction.Booking._CreateUserID='77771';
        jsonObj.Transaction.Booking.User._ID=jsonObj.Transaction.Booking._CreateUserID;
        var date = '11-09-2015 14:12:00';
        if(jsonObj.Transaction.Booking.Air.Flights.Flight.length===undefined || jsonObj.Transaction.Booking.Air.Flights.Flight.length<2){
            //alert('in');
            if(jsonObj.Transaction.Booking.Air.Flights.Flight.Segment.length===undefined || jsonObj.Transaction.Booking.Air.Flights.Flight.Segment.length<2){
                //alert('in');
                jsonObj.Transaction.Booking.Air.Flights.Flight.Segment._Arrive=date;
                jsonObj.Transaction.Booking.Air.Flights.Flight.Segment._Depart=date;
            } else{
                for(var i=0;i<jsonObj.Transaction.Booking.Air.Flights.Flight.Segment.length;i++){
                    jsonObj.Transaction.Booking.Air.Flights.Flight.Segment[i]._Arrive=date;
                    jsonObj.Transaction.Booking.Air.Flights.Flight.Segment[i]._Depart=date;
                }
            }
            jsonObj.Transaction.Booking.Air.Flights.Flight._Arrive=date;
            jsonObj.Transaction.Booking.Air.Flights.Flight._Depart=date;
        } else{
            for(var i=0;i<jsonObj.Transaction.Booking.Air.Flights.Flight.length;i++){
                if(jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment.length===undefined || jsonObj.Transaction.Booking.Air.Flights.Flight.Segment.length<2){
                    //alert('in');
                    jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment._Arrive=date;
                    jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment._Depart=date;
                } else{
                    for(var j=0;j<jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment.length;j++){
                        jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment[j]._Arrive=date;
                        jsonObj.Transaction.Booking.Air.Flights.Flight[i].Segment[j]._Depart=date;
                    }
                }
                jsonObj.Transaction.Booking.Air.Flights.Flight[i]._Arrive=date;
                jsonObj.Transaction.Booking.Air.Flights.Flight[i]._Depart=date;
            }
        }
        

        var monthNames = [
            "01", "02", "03",
            "04", "05", "06", "07",
            "08", "09", "10",
            "11", "12"
        ];

        var date = new Date();
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        var todayTimestamp = day+'-'+monthNames[monthIndex]+'-'+year+' '+hours+':'+minutes+':'+seconds;
        //jsonObj.Transaction.Booking.TimeStamp=todayTimestamp;
        jsonObj.Transaction.TimeStamp=todayTimestamp;
        jsonObj.Transaction.Booking.Confirmation._PNR = $scope.randomString(6,'#A');

        var newXMLContent = x2js.json2xml_str(jsonObj);

        //alert(newXMLContent);
        $scope.results = newXMLContent;

        var req = {
             method: 'POST',
             url: 'http://longstrideit.com/bts/jersey/api/postxml',
             headers: {
               'Content-Type': 'application/xml'
             },
             data: newXMLContent
         }

        /* {
            method:'POST',
            url:'http://longstrideit.com/bts/jersey/api/postxml',
            data: newXMLContent,
            headers: { "Content-Type": 'application/xml' }
        }*/
        $http(req).then(function(res){
            alert('success');
        }, function(res){
            alert('err');
        })

    };

    $scope.randomString = function(length, chars) {
        var mask = '';
        if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
        if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (chars.indexOf('#') > -1) mask += '0123456789';
        if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
        var result = '';
        for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
        return result;
    }

    $scope.query = { 
        'first' : ''
    };
    
    $scope.search = function() {
        $scope.results = "results from http get using query:" + $scope.query.first;
    };
});