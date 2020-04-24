var express = require('express');
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
var path = require("path");
var methodOverride = require("method-override");
var flash = require("connect-flash");

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
app.use(flash());

app.use(function(req,res,next){
    // res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.get('/', function (req, res) {
    res.render('../Login.ejs');
});

app.post('/auth', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM Login WHERE UserID = ? AND Password = ?', [username, password], function (error, results, fields) {
            if (error) {
                console.log(error);
            }
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
                request.flash("error","Incorrect UserId and/or Password!")
                response.redirect("/");
            }
            response.end();
        });
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.get('/adminHomePage', function (request, response) {
    if (request.session.loggedin) {
        // response.send('Welcome to admin home page, ' + request.session.username + '!');
        response.render("adminHomePage");
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.get('/adminHomePage/register', function (request, response) {
    if (request.session.loggedin) {
        response.render("register.ejs");
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.post('/adminHomePage/register', function (req, res) {
    connection.query('SELECT * FROM Login WHERE UserID = ?', [req.body.username], function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        else if (results.length > 0) {
            req.flash("error","This User already Exist!");
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
                                req.flash("success","Agent registered sucessfully");
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
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
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
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
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
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
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
                req.flash("success","Agent updated successfully");
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
            req.flash("success","Agent deleted successfully");
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
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get("/adminHomePage/salesReport/sold",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'True'",function(err,results,fields){
            res.render("salesReport.ejs",{sales:results,fSale:fSale});
        });
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get("/adminHomePage/salesReport/rent",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'False'",function(err,results,fields){
            res.render("salesReport.ejs",{sales:results,fSale:fSale});
        });
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.post("/adminHomePage/salesReport",function(req,res){
    if(req.session.loggedin){
        var fSale = true;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and Agent.UserID =?",[req.body.agentUserid],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.body.agentUserid});
        });
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get("/adminHomePage/salesReport/:id/sold",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'True' and Agent.UserID =?",[req.params.id],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.params.id});
        });
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get("/adminHomePage/salesReport/:id/rent",function(req,res){
    if(req.session.loggedin){
        var fSale = false;
        connection.query("select Purchase.PropID pid,Tenant.TenantID tid,ForSale,Purchase.Date pd,Tenant.FirstName tf,Tenant.LastName tl,Price,PropType,Agent.UserID aid,Agent.FirstName af,Agent.LastName al from Purchase,Tenant,Agent,Property where Purchase.TenantID = Tenant.TenantID and Property.PropID = Purchase.PropID and Agent.AgentID = Property.AgentID and ForSale = 'False' and Agent.UserID =?",[req.params.id],function(err,results,fields){
            res.render("searchSales.ejs",{sales:results,fSale:fSale,id:req.params.id});
        });
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get("/adminHomePage/propertyReport",function(req,res){
    if(req.session.loggedin){
        connection.query("select * from Property where Property.IsOccupied = 'False'",function(err,results,fields){
            if(err){
                console.log(err);
            }
            else{
                res.render("propertyReport.ejs",{properties:results});
            }
        })
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
})

app.post("/adminHomePage/propertyReport",function(req,res){
    if(req.session.loggedin){
        var minPrice = 0;
        var maxPrice = Number.MAX_SAFE_INTEGER;
        if(req.body.minPrice) minPrice = req.body.minPrice;
        if(req.body.maxPrice) maxPrice = req.body.maxPrice;
        if(req.body.city){
            connection.query("select * from Property where Property.IsOccupied = 'False' and Property.City =? and Price >=? and Price <=?",[req.body.city,req.body.minPrice,maxPrice],function(err,results,fields){
                if(err){
                    console.log(err);
                }
                else{
                    res.render("searchCity.ejs",{properties:results,city:req.body.city,minPrice:req.body.minPrice,maxPrice:req.body.maxPrice});
                }
            });
        }
        else{
            connection.query("select * from Property where Property.IsOccupied = 'False' and Price >=? and Price <=?",[req.body.minPrice,req.body.maxPrice],function(err,results,fields){
                if(err){
                    console.log(err);
                }
                else{
                    res.render("searchCity.ejs",{properties:results,city:req.body.city,minPrice:req.body.minPrice,maxPrice:req.body.maxPrice});
                }
            });
        }
        
    } else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.get('/agentHomePage', function (request, response) {
    if (request.session.loggedin) {
        //response.send('Welcome to adminHomePage/salesReportagent home page, ' + request.session.username + '!');
        // response.sendFile(path.join(__dirname + '/views/agentHomepage1.ejs'));
        response.render("agentHomePage1.ejs")
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.get('/agentHomePage/Addproperty', function (request, response) {
    if (request.session.loggedin) {
        // response.sendFile(path.join(__dirname + '/AddProperty.html'));
        response.render("registerProperty.ejs")
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.post('/agentHomePage/Addproperty/Add', function (req, res) {
    connection.query("select max(Propid) id from Property", function (err, foundId, fields) {
        if (err) {
            console.log(err);
        }
        connection.query("select agentid from Agent where userid =?",[req.session.username],function(err,foundi,fields){
            var newProperty = "insert into Property(Propid,proptype,price,description,isOccupied,BHK,forSale,street,locality,city,state,pincode,Ownerid,AgentId,Area,date,name,image) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
            var Propertyvalue = [foundId[0].id + 1, req.body.type, req.body.price, req.body.description, req.body.isOccupied, req.body.BHK, req.body.forSale, req.body.street, req.body.locality, req.body.city, req.body.state, req.body.pincode, req.body.ownerid, foundi[0].agentid, req.body.area, req.body.date,req.body.name,req.body.image];
                connection.query(newProperty, Propertyvalue, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                    } else {
                                req.flash("success","Property successfully updated");
                                res.redirect('/adminHomePage');
                    }
                });

        });
    
    });    
    
});

app.get('/agentHomePage/ModifyProperty',function(request,response){
    if(request.session.loggedin){
        connection.query("select p.Propid,p.Image,p.Name,p.proptype,p.price,p.description,p.isOccupied,p.BHK,p.forSale,p.street,p.locality,p.city,p.state,p.pincode,p.OwnerId,p.Area,p.date from Property p,Agent a where p.AgentID = a.agentId and a.Userid = ?",[request.session.username],function(err,results,fields){
            if(err){
                console.log(err);
            }
            else{
                //response.send("HELLO THERE AGENT.")
                response.render("ModifyProperty.ejs",{Properties:results});
            }
        })

    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.post('/agentHomePage/ModifyProperty',function(request,response){
    if(request.session.loggedin){
        connection.query("select p.Propid,p.proptype,p.price,p.description,p.isOccupied,p.BHK,p.forSale,p.street,p.locality,p.city,p.state,p.pincode,p.OwnerId,p.Area,p.date,p.Image,p.Name from Property p,Agent a where p.AgentID = a.agentId and a.Userid = ? and p.PropID =?",[request.session.username,request.body.Propertyid],function(err,results,fields){
            if(err){
                console.log(err);
            }
            else{
                response.render("searchProperty.ejs",{Property:results[0],Propertyid:request.body.Propertyid});
            }
        });

    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.get('/agentHomePage/ModifyProperty/:Propertyid/edit',function(req,res){
    if(req.session.loggedin){
        connection.query("select p.Propid,p.description,p.price,p.isOccupied,p.proptype,p.bhk,p.forSale,p.street,p.locality,p.city,p.state,p.pincode,p.Area from Property p where p.Propid = ?",[req.params.Propertyid],function(err,results,fields){
            if(err){
                console.log(err);
            } else if(results.length > 0){
                res.render("editProperty.ejs",{property:results[0]});
            }
        });
    }
    else{
        req.flash("error","Please Login to view this page!");
        res.redirect("/");
    }
});

app.put('/agentHomePage/ModifyProperty/:Propertyid',function(req,res){
    var updateProperty = "update Property set description =?,price =?,isOccupied = ?,proptype =?, bhk =?, forSale =? ,street =?,locality =?,city =?,state =?,pincode =?,area =? where Propid =?";
    var Propertyvalue = [req.body.Description,req.body.Price,req.body.Occupied,req.body.PropertyType,req.body.BHK,req.body.ForSale,req.body.Street,req.body.Locality,req.body.City,req.body.State,req.body.Pincode,req.body.Area,req.params.Propertyid];
    connection.query(updateProperty,Propertyvalue,function(err,results,fields){
        if(err){
            console.log(err);
        }
        req.flash("success","Property successfully updated");
        res.redirect("/agentHomePage/ModifyProperty");
    });
});

app.delete('/agentHomePage/ModifyProperty/:Propertyid',function(req,res){
    connection.query("delete from Property where PropID = ?",[req.params.Propertyid],function(err){
        if(err){
            console.log(err);
        }
        req.flash("success","Property deleted successfully");
        res.redirect("/agentHomePage/ModifyProperty");
    });
});

app.get('/agentHomePage/propertySales', function (request, response) {
    if (request.session.loggedin) {
        //response.sendFile(path.join(__dirname + '/AddProperty.html'));
        response.render("propertySales.ejs")
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.get('/agentHomePage/propertySales/soldReport', function (request, response) {
    if (request.session.loggedin) {
        //response.sendFile(path.join(__dirname + '/AddProperty.html'));
        response.render("soldReport.ejs")
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.put('/agentHomePage/propertySales/soldReport', function (req, res) {
    var newPurchase = "insert into Purchase(date,Propid) values(?,?)";
    var Purchasevalue = [req.body.soldDate, req.body.Propertyid];
    var updateProperty = "update Property set isOccupied = 'TRUE',OwnerId = ? where Propid = ?";
    var Propertyup = [req.body.OwnerId , req.body.Propertyid];
    connection.query("Select forSale,isOccupied from Property where Propid = ?",[req.body.Propertyid],function (error,results,fields) {
        if(results[0].forSale=='TRUE' && results [0].isOccupied=='FALSE'){
            connection.query(newPurchase, Purchasevalue, function (error, results, fields) {
                if (error) {
                    console.log(error);
                }
                connection.query(updateProperty, Propertyup, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                    } else {
                        req.flash("success","Owner updated successfully");
                        res.redirect('/agentHomePage');
                    }
                });
            });
        }
        else{
            console.log(error);
            res.redirect('/agentHomePage');
        }
    });
});

app.get('/agentHomePage/propertySales/rentReport', function (request, response) {
    if (request.session.loggedin) {
        //response.sendFile(path.join(__dirname + '/AddProperty.html'));
        response.render("rentReport.ejs")
    } else {
        request.flash("error","Please Login to view this page!");
        response.redirect("/");
    }
});

app.put('/agentHomePage/propertySales/rentReport', function (req, res) {
    var newRent = "insert into Purchase(date,Propid,TenantId) values(?,?,?)";
    var Rentvalue = [req.body.rentDate,req.body.Propertyid,req.body.TenantId];
    var updateTenant = "update Tenant set AgentId = (select AgentId from Agent where UserId = ?) where TenantId = ?";
    var Tenantup = [req.session.username,req.body.TenantId];
    var updateProperty = "update Property set isOccupied = 'TRUE'where Propid = ?";
    var Propertyup = [req.body.Propertyid];
    connection.query("Select forSale,isOccupied from Property,Agent where Agent.AgentId = Property.AgentId and Propid = ? and Agent.UserId =?",[req.body.Propertyid,req.session.username],function (error,results,fields) {
        if(results[0].forSale=='FALSE' && results[0].isOccupied=='FALSE') {
            connection.query(newRent, Rentvalue, function (error, results, fields) {
                if (error) {
                    console.log(error);
                }
                connection.query(updateTenant, Tenantup, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                    }
                    connection.query(updateProperty, Propertyup, function (error, results, fields) {
                        if (error) {
                            console.log(error);
                        }else {
                            req.flash("success","Tenant updated successfully");
                            res.redirect('/agentHomePage');
                        }
                    });
                });
            });
        }
        else{
            req.flash("error","You can't sell this property!");
            res.redirect('/agentHomePage');
        }
    });
});

var server = app.listen(3000, function () {
    console.log('Server is running..');
});