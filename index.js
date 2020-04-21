var express = require('express');
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
var path = require("path");


var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'Sohan022@',
    database : 'project'
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
        connection.query('SELECT * FROM Login WHERE UserID = ? AND Password = ?', [username, password], function(error, results, fields) {
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
                    response.redirect('/home')
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

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
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

var server = app.listen(3000, function () {
    console.log('Server is running..');
});