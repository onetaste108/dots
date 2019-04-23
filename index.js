var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');

var key = fs.readFileSync('sert/private.key');
var cert = fs.readFileSync('sert/certificate.crt');
var ca = fs.readFileSync('sert/ca_bundle.crt');
var options = {
	key: key,
	cert: cert,
	ca: ca
	};

var https = require('https');

app.use(function(req,res,next) {
    if (req.secure) {
        next();
    } else {
        console.log("Redirecting...");
        res.redirect('https://'+req.headers.host + req.url);
    }
});
app.use(express.static(__dirname));

https.createServer(options, app).listen(443);
http.createServer(app).listen(80);
