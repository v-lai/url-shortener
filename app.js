var express = require("express");
var app = express();
var mongoose = require("mongoose");

// ES6 promise library, as mongoose's is deprecated
mongoose.Promise = global.Promise;

// mongoose connect
// mongoose.connect("mongodb://localhost/url_shortener");
mongoose.connect(process.env.DATABASEURL || "mongodb://localhost/url_shortener");

// schema shown here for single file (may refactor later)
var urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

// compiling schema into a model
var Url = mongoose.model("Url", urlSchema);

// short URL prefix
// const SHORT_URL_PREFIX = "localhost:3000/";
const SHORT_URL_PREFIX = "https://intense-woodland-54597.herokuapp.com/";

// ROOT ROUTE - INDEX
app.get("/", function(req, res){
  res.send("URL shortener microservice. \nType /new/yourURL starting with http:// or https:// and receive a shortened URL in a JSON response.");
});

// SHOW ROUTES - long URLs
const HTTP = "http://";
const HTTPS = "https://";

app.get("/new/" + HTTP + ":longUrl", function(req, res){
  getUrl(req, res);
});

app.get("/new/" + HTTPS + ":longUrl", function(req, res){
  getUrl(req, res);
});

app.get("/new/" + HTTP + ":longUrl/*", function(req, res){
  getUrl(req, res);
});

app.get("/new/" + HTTPS + ":longUrl/*", function(req, res){
  getUrl(req, res);
});

// SHOW ROUTE - reroutes shortened URL to long URL
app.get("/:shortUrls", function(req, res){
  var shortUrls = req.params.shortUrls;
  Url.find({ short_url: SHORT_URL_PREFIX + shortUrls }, function(err, foundUrl){
    if (err) throw err;
    else {
      if (foundUrl[0] === undefined){
        res.send("Shortened URL page not found.");
      } else {
        res.redirect(foundUrl[0].original_url);
      }
    }
  });
});

app.get("*", function(req, res){
  res.send("Page not found.");
});

function setUrl(req, res, longUrl){
  // store in DB and display
  var shortUrlNum = isShortEndNumUsed();
  var newUrl = { original_url: longUrl, short_url: SHORT_URL_PREFIX + shortUrlNum };
  Url.create(newUrl, function(err, newCreatedUrl){
    if (err) throw err;
    else {
      if (newCreatedUrl === undefined){
        res.send("Page not found.");
      } else {
        res.send(JSON.stringify( newUrl , null, '\t'));
      }
    }
  });

}

function getUrl(req, res){
  // find in DB and display
  var longUrl = req.originalUrl.split("/new/")[1];
  Url.findOne({ original_url: longUrl }, function(err, foundGetUrl){
    if (err) throw err;
    else {
      // console.log(foundGetUrl);
      if ((/\w\.\w/).test(longUrl)){ // url minimum has a site.domain format
        if (foundGetUrl !== null){
          res.send(JSON.stringify({ original_url: longUrl, short_url: foundGetUrl.short_url }, null, '\t'));
        } else {
          setUrl(req, res, longUrl);
        }
      } else { // display nulls and do not store
        res.send(JSON.stringify({ original_url: null, short_url: null }, null, '\t'));
      }
    }
  });
}

function isShortEndNumUsed(){
  // shortUrl = window.crypto.getRandomValues(new Uint16Array(1)).join(''); // crypto doesn't work here; using standard Math.random()
  var shortUrl = Math.floor(Math.random() * (10000 - 1000)) + 1000; // 4-digit number
  Url.find({ short_url: SHORT_URL_PREFIX + shortUrl }, function(err, foundUrl){
    if (err) throw err;
    else {
      isShortEndNumUsed();
    }
  });
  return shortUrl;
}

app.listen(process.env.PORT || 3000, process.env.IP, function(){
  console.log("server is running");
});
