var express = require('express');
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
var path = require("path");
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'yesbroker'
});
connection.connect(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected");
    }
});
var app = express();

app.use(session({
    secret: 'This is a black bear',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/Login.html'));
});

app.post('/auth', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM logintable1 WHERE UserID = ? AND Passwrd = ?', [username, password], function (error, results, fields) {
            if (error) {
                console.log(error);
            }
            console.log(results);
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/home');
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

app.get('/home', function (request, response) {
    if (request.session.loggedin) {
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
});

var server = app.listen(3000, function () {
    console.log('Server is running..');
});