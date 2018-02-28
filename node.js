var lik = 0,
    dis = 0; //like and dislike are initialised to 0; 
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

        var cursor = myCollection.find({
            "name": "Library IC1"
        }); //find function is called to find the name of current location in the database
        cursor.each(function(err, doc) { //function checks the returned cursor containing the specified location from the database 
            if (err)
                throw err;
            if (doc == null)
                return;

            console.log("document find:");
            console.log(doc.likes);
            dis = doc.dislikes; //get dislikes and rewrite into the database 
            lik = doc.likes; //get the number of likes from the cursor 
            lik = lik + 1; //the number of likes is incremented
            myCollection.update({
                name: "Library IC1"
            }, {
                name: "Library IC1",
                dislikes: dis,
                likes: lik
            }, {
                w: 1
            }, function(err) { //the number of likes and dislikes are updated in the database 
                if (err)
                    throw err;
                console.log('entry updated');
                db.close(); //the database is closed 
            });
        });
    });
}

//getstats gets the likes and dislikes in the specified location from the database and returns it 
function getStats() {
    var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) {
        if (err)
            throw err;
        console.log("connected to the mongoDB !");
        myCollection = db.collection('rooms');

        var cursor = myCollection.find({
            "name": "Library IC1"
        });
        cursor.each(function(err, doc) {
            if (err)
                throw err;
            if (doc == null)
                return;
            dis = doc.dislikes;
            lik = doc.likes;
            db.close(); //closes the databse after completion 
        });
    });
}

//dislike function is called whenever a student dislikes a location 
function dislike() {
    var db = MongoClient.connect('mongodb://umm:like@ds121716.mlab.com:21716/likedislike', function(err, db) {
        if (err)
            throw err;
        console.log("connected to the mongoDB !");
        myCollection = db.collection('rooms');

        var cursor = myCollection.find({
            "name": "Library IC1"
        });
        cursor.each(function(err, doc) {
            if (err)
                throw err;
            if (doc == null)
                return;
            dis = doc.dislikes;
            lik = doc.likes;
            // console.log(doc.company.employed);
            dis = dis + 1;
            myCollection.update({
                name: "Library IC1"
            }, {
                name: "Library IC1",
                dislikes: dis,
                likes: lik
            }, {
                w: 1
            }, function(err) {
                if (err)
                    throw err;
                db.close();
            });

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
        res.send(JSONdata); //send data
        console.log("data sent");

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

    }, 2000);
});
app.listen(3000); //listen on port 3000
