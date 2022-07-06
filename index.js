require('dotenv').config();
const bodyParser = require("body-parser");
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const urlParser = require("url");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const mySecret = process.env['MONGO_URI']
// const { Schema } = mongoose;

// Basic Configuration
const port = process.env.PORT || 8080;
mongoose.connect(mySecret, function (error) {
  console.log("connected");
});
console.log(mongoose.connection.readyState)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = new mongoose.Schema({
  original_url: "String",
  short_url : "Number"
});
const Urls = mongoose.model("Urls", urlSchema)

// Your first API endpoint
app.post("/api/shorturl", function(req,res){
  let originalUrl = req.body.url;

  dns.lookup(urlParser.parse(originalUrl).hostname, function(error, address){
    if (error) res.json({ error: "dns lookup error"});
    if (!address) res.json({ error: "invalid url" });

    Urls.findOne({original_url: originalUrl}, function(error,address){
      if (error) console.log("Findone error");
      if (!address) {
        Urls.estimatedDocumentCount(function(error, count){
          if (error) console.log("Count error");
          let newUrl = new Urls({original_url: originalUrl, short_url: count + 1});
          newUrl.save(function(error,saved){
            if (error) console.log("save error");
              res.json({original_url: saved.original_url, short_url: saved.short_url})
            })
          })
      } else {
          res.json({original_url: address.original_url, short_url: address.short_url})
          } 
        })
      })
    })


app.get("/api/shorturl/:id", function(req,res){
  const shortUrl = req.params.id;

  Urls.findOne({short_url: shortUrl}, function(error, address){
    if (error) console.log("shortUrl error");
    if (!address) console.log("No address found");
    res.redirect(address.original_url);
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});