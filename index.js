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
app.set("view engine","ejs");

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
                    response.redirect('/agentHomepage')
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

app.get('/adminHomePage', function(request, response) {
    if (request.session.loggedin) {
        // response.send('Welcome to admin home page, ' + request.session.username + '!');
        response.render("adminHomePage");
    } else {
        response.send('Please login to view this page!');
    }
});

app.get('/adminHomePage/register',function(request,response){
    if(request.session.loggedin){
        response.render("register.ejs");
    } else {
        response.send('Please login to view this page!');
    }
});

app.post('/adminHomePage/register',function(req,res){
    connection.query('SELECT * FROM Login WHERE UserID = ?', [req.body.username], function(error, results, fields){
        if(error){
            console.log(error);
        }
        else if(results.length > 0){
            console.log("This userid exists");
            res.redirect("/adminHomePage/register");
        }
        else{
            connection.query("select max(AgentID) id from Agent",function(err,foundId,fields){
                if(err){
                    console.log(err);
                }

                var newLogin = "insert into Login(UserID,Password,Email,UserType) values(?,?,?,?)";
                var loginvalue = [req.body.username, req.body.password, req.body.email,'Agent'];
                var newAgent = "insert into Agent(AgentID,UserID,FirstName,LastName,Gender,Age,City,PhnNum) values(?,?,?,?,?,?,?,?)";
                var agentvalue = [foundId[0].id+1,req.body.username,req.body.firstname,req.body.lastname,req.body.gender,req.body.age,req.body.city,req.body.phnum];
                connection.query(newLogin,loginvalue, function(error, results, fields) {
                    if(error){
                        console.log(error);
                    } else{
                        connection.query(newAgent,agentvalue, function(error, results, fields) {
                            if(error){
                                console.log(error);
                            } else{
                                console.log("1 record inserted");
                                res.redirect('/adminHomePage');
                            }
                        });
                    }
                });

            });


        }
    });

})

app.get('/agentHomepage', function(request, response) {
    if (request.session.loggedin) {
        //response.send('Welcome to agent home page, ' + request.session.username + '!');
        response.sendFile(path.join(__dirname + '/agentHomepage.html'));
    } else {
        response.send('Please login to view this page!');
    }
});

app.get('/agentHomePage/Addproperty',function(request,response){
    if(request.session.loggedin){
        response.sendFile(path.join(__dirname + '/AddProperty.html'));
    } else {
        response.send('Please login to view this page!');
    }
});

app.post('/agentHomePage/Addproperty/Add',function (req,res) {
    var newProperty = "insert into Property(Propertyid,ptype,price,description,isOccupied,BHK,forSale,street,locality,city,state,pincode,Ownerid,AgentId,Area,entry) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var Propertyvalue = [req.body.Propertyid, req.body.type, req.body.price, req.body.description, req.body.isOccupied, req.body.BHK, req.body.forSale, req.body.street, req.body.locality, req.body.city, req.body.state, req.body.pincode, req.body.ownerid, req.body.agentid, req.body.area, req.body.date];
    connection.query(newProperty, Propertyvalue, function (error, results, fields) {
        if (error) {
            console.log(error);
        } else {
            console.log("1 record inserted");
            res.redirect('/agentHomePage');
        }
    });
});



    var server = app.listen(3000, function () {
    console.log('Server is running..');
});