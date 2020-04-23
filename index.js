var express = require('express');
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
var path = require("path");
var methodOverride = require("method-override");


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sohan022@',
    database: 'project'
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
app.use(methodOverride("_method"));
app.set("view engine","ejs");

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/Login.html'));
});

app.post('/auth', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM Login WHERE UserID = ? AND Password = ?', [username, password], function (error, results, fields) {
            if (error) {
                console.log(error);
            }
            console.log(results);
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                if (results[0].UserType == "Admin") {
                    response.redirect('/adminHomePage');
                }
                else {
                    response.redirect('/agentHomePage')
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

app.get('/adminHomePage', function (request, response) {
    if (request.session.loggedin) {
        // response.send('Welcome to admin home page, ' + request.session.username + '!');
        response.render("adminHomePage");
    } else {
        response.send('Please login to view this page!');
    }
});

app.get('/adminHomePage/register', function (request, response) {
    if (request.session.loggedin) {
        response.render("register.ejs");
    } else {
        response.send('Please login to view this page!');
    }
});

app.post('/adminHomePage/register', function (req, res) {
    connection.query('SELECT * FROM Login WHERE UserID = ?', [req.body.username], function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        else if (results.length > 0) {
            console.log("This userid exists");
            res.redirect("/adminHomePage/register");
        }
        else {
            connection.query("select max(AgentID) id from Agent", function (err, foundId, fields) {
                if (err) {
                    console.log(err);
                }

                var newLogin = "insert into Login(UserID,Password,Email,UserType) values(?,?,?,?)";
                var loginvalue = [req.body.username, req.body.password, req.body.email, 'Agent'];
                var newAgent = "insert into Agent(AgentID,UserID,FirstName,LastName,Gender,Age,City,PhnNum) values(?,?,?,?,?,?,?,?)";
                var agentvalue = [foundId[0].id + 1, req.body.username, req.body.firstname, req.body.lastname, req.body.gender, req.body.age, req.body.city, req.body.phnum];
                connection.query(newLogin, loginvalue, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                    } else {
                        connection.query(newAgent, agentvalue, function (error, results, fields) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log("1 record inserted");
                                res.redirect('/adminHomePage');
                            }
                        });
                    }
                });

            });    
            
        }
    });
    
});

app.get('/adminHomePage/agents',function(request,response){
    if(request.session.loggedin){
        connection.query("select Login.UserID id,AgentID,FirstName,LastName,Email,PhnNum,City,Gender,Age from Agent,Login where Login.UserID = Agent.UserID",function(err,results,fields){
            if(err){
                console.log(err);
            }
            else{
                response.render("agents.ejs",{agents:results});
            }
        })
        
    } else {
        response.send('Please login to view this page!');
    }
});

app.post('/adminHomePage/agents',function(request,response){
    if(request.session.loggedin){
        connection.query("select Login.UserID id,AgentID,FirstName,LastName,Email,PhnNum,City,Gender,Age from Agent,Login where Login.UserID = Agent.UserID and Login.UserID =?",[request.body.id],function(err,results,fields){
            if(err){
                console.log(err);
            }
            else{
                response.render("search.ejs",{agent:results[0],id:request.body.id});
            }
        });
        
    } else {
        response.send('Please login to view this page!');
    }
});

app.get('/adminHomePage/agents/:id/edit',function(req,res){
    if(req.session.loggedin){
        connection.query("select Login.UserID id,Password,AgentID,FirstName,LastName,Email,PhnNum,City,Gender,Age from Agent,Login where Login.UserID = Agent.UserID and Agent.UserID = ?",[req.params.id],function(err,results,fields){
            if(err){
                console.log(err);
            } else if(results.length > 0){
                res.render("edit.ejs",{agent:results[0]});
            }
        });
    }
    else{
        res.send("Please login to view this page!");
    }
    
    
});

app.put('/adminHomePage/agents/:id',function(req,res){
    var updateAgent = "update Agent set FirstName =?,LastName =?,Gender = ?,Age =?, City =?, PhnNum =? where UserID =?";
    var agentvalue = [req.body.FirstName,req.body.LastName,req.body.Gender,req.body.Age,req.body.City,req.body.PhnNum,req.params.id];
    connection.query(updateAgent,agentvalue,function(err,results,fields){
        if(err){
            console.log(err);
        }
        
        connection.query("update Login set Email =? where UserID =?",[req.body.Email,req.params.id],function(err,results,fields){
            if(err){
                console.log(err);
            } else{
                res.redirect("/adminHomePage/agents");
            }
        });
    });
});

app.delete('/adminHomePage/agents/:id',function(req,res){
    connection.query("delete from Agent where UserID = ?",[req.params.id],function(err){
        if(err){
            console.log(err);
        }
        connection.query("delete from Login where UserID = ?",[req.params.id],function(err){
            if(err){
                console.log(err);
            }
            res.redirect("/adminHomePage/agents");
        });
        
    });
});

app.get("/adminHomePage/salesReport",function(req,res){
    if(req.session.loggedin){
        var fSale = true;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID",function(err,results,fields){
            res.render("salesReport.ejs",{sales:results,fSale:fSale});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});

app.get("/adminHomePage/salesReport/sold",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'True'",function(err,results,fields){
            res.render("salesReport.ejs",{sales:results,fSale:fSale});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});

app.get("/adminHomePage/salesReport/rent",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'False'",function(err,results,fields){
            res.render("salesReport.ejs",{sales:results,fSale:fSale});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});

app.post("/adminHomePage/salesReport",function(req,res){
    if(req.session.loggedin){
        var fSale = true;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and Agent.UserID =?",[req.body.agentUserid],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.body.agentUserid});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});

app.get("/adminHomePage/salesReport/:id/sold",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'True' and Agent.UserID =?",[req.params.id],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.params.id});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});

app.get("/adminHomePage/salesReport/:id/rent",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'False' and Agent.UserID =?",[req.params.id],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.params.id});
        });
    } else{
        res.send("Please login to show to this page!");
    }
});


app.get('/agentHomePage', function (request, response) {
    if (request.session.loggedin) {
        //response.send('Welcome to adminHomePage/salesReportagent home page, ' + request.session.username + '!');
        // response.sendFile(path.join(__dirname + '/views/agentHomepage1.ejs'));
        response.render("agentHomePage1.ejs")
    } else {
        response.send('Please login to view this page!');
    }
});

app.get('/agentHomePage/Addproperty', function (request, response) {
    if (request.session.loggedin) {
        // response.sendFile(path.join(__dirname + '/AddProperty.html'));
        response.render("registerProperty.ejs")
    } else {
        response.send('Please login to view this page!');
    }
});

app.post('/agentHomePage/Addproperty/Add', function (req, res) {
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