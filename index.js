var express = require('express');
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
var path = require("path");
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'password',
    database : 'estate'
});
connection.connect(function(err){
    if(err){
        console.log(err);
    }else{
        console.log("Connected");
    }
});
var app = express();

app.use(session({
    secret: 'This is a black bear',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
            res.sendFile(path.join(__dirname + '/Login.html'));
});

app.post('/auth', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM logintable WHERE UserID = ? AND Password = ?', [username, password], function(error, results, fields) {
            if(error){
                console.log(error);
            }
            console.log(results);
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                if(results[0].UserType == "Admin"){
                    response.redirect('/adminHomePage');
                }
                else{
                    response.redirect('/agentHomepage');
                }
            } else {
                response.send('Incorrect UserId and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter UserId and Password!');
        response.end();
    }
});

app.get('/agentHomepage',function (req,res) {
    if(request.session.loggedin){
        res.render('agentHomepage');
    }
    else {
        res.send('Please Login to see this page');
    }
})

app.get('/agentHomepage/AddProperty',function (req,res) {
    if(request.session.loggedin){
        response.render('AddProperty');
    }
    else {
        res.send('Please Login to view this page');
    }
})

app.post('agentHomepage/AddProperty/Add',function (req,res) {
    var newProperty = "insert into Property(Propertyid,ptype,price,description,isOccupied,bhk" +
        ",forSale,street,locality,city,state,pincode,OwnerId,AgentId,Area,entry) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,)";
    var propertyvalue = [req.body.Propertyid,req.body.type,req.body.price,req.body.description,'FALSE',req.body.BHK,req.body.forSale,req.body.street,req.body.locality,req.body.city,req.body.state,req.body.pincode,req.body.AgentId,req.body.OwnerId,req.body.area,req.body.date];
    
})

var server = app.listen(3000, function () {
    console.log('Server is running..');
});
