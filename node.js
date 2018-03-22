 // Packest from the Estimote family (Telemetry, Connectivity, etc.) are
 // broadcast as Service Data (per "§ 1.11. The Service Data - 16 bit UUID" from
 // the BLE spec), with the Service UUID 'fe9a'.
 var ESTIMOTE_SERVICE_UUID = 'fe9a';
 var currentlocationID = "";
 // Once you obtain the "Estimote" Service Data, here's how to check if it's
 // a Telemetry packet, and if so, how to parse it.
 function parseEstimoteTelemetryPacket(data) { // data is a 0-indexed byte array/buffer

   // byte 0, lower 4 bits => frame type, for Telemetry it's always 2 (i.e., 0b0010)
   var frameType = data.readUInt8(0) & 0b00001111;
   var ESTIMOTE_FRAME_TYPE_TELEMETRY = 2;
   if (frameType != ESTIMOTE_FRAME_TYPE_TELEMETRY) { return; }

   // byte 0, upper 4 bits => Telemetry protocol version ("0", "1", "2", etc.)
   var protocolVersion = (data.readUInt8(0) & 0b11110000) >> 4;
   // this parser only understands version up to 2
   // (but at the time of this commit, there's no 3 or higher anyway :wink:)
   if (protocolVersion > 2) { return; }

   // bytes 1, 2, 3, 4, 5, 6, 7, 8 => first half of the identifier of the beacon
   var shortIdentifier = data.toString('hex', 1, 9);

   // byte 9, lower 2 bits => Telemetry subframe type
   // to fit all the telemetry data, we currently use two packets, "A" (i.e., "0")
   // and "B" (i.e., "1")
   var subFrameType = data.readUInt8(9) & 0b00000011;

   var ESTIMOTE_TELEMETRY_SUBFRAME_A = 0;
   var ESTIMOTE_TELEMETRY_SUBFRAME_B = 1;

   // ****************
   // * SUBFRAME "A" *
   // ****************
   if (subFrameType == ESTIMOTE_TELEMETRY_SUBFRAME_A) {

     
     var errors;
     if (protocolVersion == 2) {
       // in protocol version "2"
       // byte 15, bits 2 & 3
       // bit 2 => firmware error
       // bit 3 => clock error (likely, in beacons without Real-Time Clock, e.g.,
       //                      Proximity Beacons, the internal clock is out of sync)
       errors = {
         hasFirmwareError: ((data.readUInt8(15) & 0b00000100) >> 2) == 1,
         hasClockError: ((data.readUInt8(15) & 0b00001000) >> 3) == 1
       };
     } else if (protocolVersion == 1) {
       // in protocol version "1"
       // byte 16, lower 2 bits
       // bit 0 => firmware error
       // bit 1 => clock error
       errors = {
         hasFirmwareError: (data.readUInt8(16) & 0b00000001) == 1,
         hasClockError: ((data.readUInt8(16) & 0b00000010) >> 1) == 1
       };
     } else if (protocolVersion == 0) {
       // in protocol version "0", error codes are in subframe "B" instead
     }

     // ***** ATMOSPHERIC PRESSURE
   

     return {
       shortIdentifier,
       frameType: 'Estimote Telemetry', subFrameType: 'A', protocolVersion, errors
     };

   // ****************
   // * SUBFRAME "B" *
   // ****************
   } else if (subFrameType == ESTIMOTE_TELEMETRY_SUBFRAME_B) {

     
     var batteryVoltage =
        (data.readUInt8(18)               << 6) |
       ((data.readUInt8(17) & 0b11111100) >> 2);
     if (batteryVoltage == 0b11111111111111) { batteryVoltage = undefined; }

     // ***** ERROR CODES
     // byte 19, lower 2 bits
     // see subframe A documentation of the error codes
     // starting in protocol version 1, error codes were moved to subframe A,
     // thus, you will only find them in subframe B in Telemetry protocol ver 0
     var errors;
     if (protocolVersion == 0) {
       errors = {
         hasFirmwareError: (data.readUInt8(19) & 0b00000001) == 1,
         hasClockError: ((data.readUInt8(19) & 0b00000010) >> 1) == 1
       };
     }

     // ***** BATTERY LEVEL
     // byte 19 => battery level, between 0% and 100%
     // if all bits are set to 1, it means it hasn't been measured yet
     // added in protocol version 1
     var batteryLevel;
     if (protocolVersion >= 1) {
       batteryLevel = data.readUInt8(19);
       if (batteryLevel == 0b11111111) { batteryLevel = undefined; }
     }

     return {
       shortIdentifier,
       frameType: 'Estimote Telemetry', subFrameType: 'B', protocolVersion, batteryVoltage, batteryLevel, errors
     };
   }
 }

 // example how to scan & parse Estimote Telemetry packets with noble

 var noble = require('noble');//the function of noble is to discover bluetooth devices 

 noble.on('stateChange', function(state) {


   console.log('state has changed', state);
   if (state == 'poweredOn') {
     var serviceUUIDs = [ESTIMOTE_SERVICE_UUID]; // Estimote Service
     var allowDuplicates = false;
     noble.startScanning(serviceUUIDs, allowDuplicates, function(error) {//noble starts scanning for bluetooth devices 
       if (error) {
         console.log('error starting scanning', error);
       } else {
         console.log('started scanning');
       }
     });
   }


   

 });

 noble.on('discover', function(peripheral) {//on discovering device, this function is exectued
   var data = peripheral.advertisement.serviceData.find(function(el) {
   
     return el.uuid == ESTIMOTE_SERVICE_UUID;

   }).data;//noble retrieved the data contained in device 

   var telemetryPacket = parseEstimoteTelemetryPacket(data);//the data is parsed here to determine if device is a beacon 
   if (telemetryPacket) { //if it is a telemetry packet, we search the ids of the three beacons used in our projects 

 if((telemetryPacket.shortIdentifier == "b8e19131d67101ab") || (telemetryPacket.shortIdentifier == "8d24a5cdb702ff90") || (telemetryPacket.shortIdentifier == "7587d73366199923" ))
 {
   currentlocationID = telemetryPacket.shortIdentifier;//if the user is close to any one of the beacons, the location is will be updated
     console.log(telemetryPacket);
   }


 }
 });







 var lik = 0,
     dis = 0; //like and dislike are initialised to 0; 


 var currentlocationname = "";
 var cur;
 var express = require('express');
 var app = express();
 var MongoClient = require('mongodb').MongoClient; //instance of mongocliient to connect to the database
 var myCollection;  

 //like function is called whenever a student likes a location 
 function like() {
     var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) { //url to mongodatabse is passed here and function connects to the db 
         if (err)
             throw err;
         console.log("connected to the mongoDB !");
         myCollection = db.collection('rooms'); //database returns the room collection from the database 

         var query = { shortIdentifier: currentlocationID  };

         myCollection.find(query).toArray(function(err, result) {
     if (err) throw err;
     if(result != null)
     {
        ress = result[0];
       currentlocationname = ress.name;
       dis = ress.dislikes;
             lik = ress.likes;
             lik = lik + 1;
     console.log(ress.name);
       var newvalues = { $set: {likes: lik, dislikes: dis } };
   myCollection.updateOne(query, newvalues, function(err, res) {
     if (err) throw err;
     console.log("1 document updated");
     db.close();
   });
   }
   });
  

});
 }


 //getstats gets the likes and dislikes in the specified location from the database and returns it 
 function getStats() {
   var ress;
     var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) {
         if (err)
             throw err;
         console.log("connected to the mongoDB !");
         myCollection = db.collection('rooms');

         var query = { shortIdentifier: currentlocationID  };

         myCollection.find(query).toArray(function(err, result) {
     if (err) throw err;
     if(result != null)
     {
       ress = result[0];
       currentlocationname = ress.name;
       dis = ress.dislikes;

             lik = ress.likes;
     console.log(ress.name);
   }
   });

   
     });
 }

 //dislike function is called whenever a student dislikes a location 
 function dislike() {
   var ress;
     var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) {
         if (err)
             throw err;
         console.log("connected to the mongoDB !");
         myCollection = db.collection('rooms');


         var query = { shortIdentifier: currentlocationID  };

         myCollection.find(query).toArray(function(err, result) {
     if (err) throw err;
     if(result != null)
     {
        ress = result[0];
       currentlocationname = ress.name;
       dis = ress.dislikes;
             lik = ress.likes;
             // console.log(doc.company.employed);
             dis = dis + 1;
     console.log(ress.name);
       var newvalues = { $set: {likes: lik, dislikes: dis } };
   myCollection.updateOne(query, newvalues, function(err, res) {
     if (err) throw err;
     console.log("1 document updated");
     db.close();
   });
   }
   });

  

     });
 }

 //using /location route to send current location of user 
 function getLocationDetails(){

   var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) {
         if (err)
             throw err;
         console.log("connected to the mongoDB !");
         myCollection = db.collection('rooms');

  var query = { shortIdentifier: currentlocationID };//find location corresponding to beacon's uuid in database 
   myCollection.find(query).toArray(function(err, result) {
     if (err) throw err;
     if(result != null)
     {
       var ress = result[0];
       currentlocationname = ress.name;//save the name of location as current location 
     console.log(ress.name);
   }
     db.close();
     //return result;
   });    
     });

 }


 //using default route localhost:3000 to send both likes and dislikes
 app.get('/', function(req, res) {
     getStats();
     setTimeout(() => {
         var dataToSendToClient = {
             'Likes': lik,
             'Dislikes': dis
         }; //send likes and dislikes to client
         // convert data to JSON
         var JSONdata = JSON.stringify(dataToSendToClient);
         res.send(JSONdata);
        
         //res.redirect('/');
     }, 2000);
 });
 //using route localhost:3000/likes
 app.get('/likes', function(req, res) {
     like();
     setTimeout(() => {
         var dataToSendToClient = {
             'Likes': lik
         }; //send likes to client
         // convert data to JSON
         var JSONdata = JSON.stringify(dataToSendToClient);
         res.send(JSONdata);
        // res.redirect('/');
     }, 2000);
 });
 //using route localhost:3000/dislikes
 app.get('/dislikes', function(req, res) {
     dislike();
     setTimeout(() => {
         var dataToSendToClient = {
             'Dislikes': dis
         }; //send dislikes to client
         var JSONdata = JSON.stringify(dataToSendToClient);
         res.send(JSONdata);
         //res.redirect('/');

     }, 2000);
 });
 app.get('/location', function(req, res) {
     getLocationDetails();
     
     setTimeout(() => {
       //console.log(cur.shortIdentifier);
         var dataToSendToClient = {
           'Location': currentlocationname

         }; //send dislikes to client
         var JSONdata = JSON.stringify(dataToSendToClient);
         res.send(JSONdata);
         //res.redirect('/');

     }, 2000);
 });
 app.listen(3000); //listen on port 3000
