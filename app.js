//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://user-admin:redspoon@cluster0-shard-00-00.oe427.mongodb.net:27017,cluster0-shard-00-01.oe427.mongodb.net:27017,cluster0-shard-00-02.oe427.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-ciepih-shard-0&authSource=admin&retryWrites=true&w=majority", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret":{$ne: null}}, function(err, founduser){
  if(err){
    console.log(err);
  }else{
    res.render("secrets",{userSecrets: founduser});
  }
});
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req,res){
  const submittedsecret = req.body.secret;

  User.findById(req.user.id, function(err, founduser){

    if(err){
      console.log(err);
    }else{
      if(founduser){
        founduser.secret = submittedsecret;
        founduser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});





let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
