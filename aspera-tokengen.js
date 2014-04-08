//------------------------------------------------------------------------
//
// Author : Giannis Kosmas <kosmasgiannis@gmail.com>
// Date   : 2014-03-31
//
//------------------------------------------------------------------------

var https = require('https');
var http = require('http');
var util = require('util');
var express = require('express');
var pluribus = require('pluribus');
var path = require('path');
var nconf = require('nconf');
var exec = require('child_process').exec;
var fs = require("fs");
var logger = require('./lib/logging').logger;

nconf.env()
     .argv()
     .file({ file: path.join(__dirname, 'config.json') });
var env = process.env;
var maxWorkers = require('os').cpus().length;
var numWorkers = nconf.get('workers') || maxWorkers;
if (numWorkers > maxWorkers) {
  numWorkers = maxWorkers;
}

if (numWorkers <= 0) {
  numWorkers = maxWorkers + numWorkers;
  if (numWorkers <= 0) {
    numWorkers = 1;
  }
}

pluribus.execute("aspera-tokengen", {"numWorkers" : numWorkers, "master" : master, "worker": main});

function master(workers) {
}

function main() {

var protocol = "http";
var cmd = nconf.get('astokengen');
var sslServerKey = nconf.get('ssl:key') || '';
var sslServerCert = nconf.get('ssl:cert') || '';
var sslCertificateAuthority = nconf.get('ssl:ca') || '';
var sslOptions = false;
var sslKey = '';
var sslCert = '';
var sslCa = '';

if (sslServerKey !== '') {
  if (isReadableSync(sslServerKey)) {
    sslKey = fs.readFileSync(sslServerKey);
  } else {
    logger.log("Error reading certificate.");
  }
}
if (sslServerCert !== '') {
  if (isReadableSync(sslServerCert)) {
    sslCert = fs.readFileSync(sslServerCert);
  } else {
    logger.log("Error reading certificate.");
  }
}
if (sslCertificateAuthority !== '') {
  if (isReadableSync(sslCertificateAuthority)) {
    sslCa = fs.readFileSync(sslCertificateAuthority);
  } else {
    logger.log("Error reading certificate.");
  }
}
if ((sslKey !== '') && (sslCert !== '')) {
  sslOptions = {};
  sslOptions['key'] = sslKey;
  sslOptions['cert'] = sslCert;
  if (sslCa !== '') {
    sslOptions['ca'] = sslCa;
  }
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

var app = express();
if (sslOptions !== false) {
  https.createServer(sslOptions, app).listen(nconf.get('port'));
  protocol = "https";
} else {
  http.createServer(app).listen(nconf.get('port'));
}
logger.log("Listening on port "+nconf.get('port'));

// create an error with .status. we can then use the property in our
// custom error handler (Connect respects this prop as well)

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

app.use(allowCrossDomain);
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser()); 
// is equivalent to:
//app.use(express.json());
//app.use(express.urlencoded());
////app.use(express.multipart());

app.use(express.methodOverride());
app.use(express.responseTime());
app.use(express.compress());

// if we wanted to supply more than JSON, we could use something similar
// to the content-negotiation example.

// position our routes above the error handling middleware,
// and below our API middleware, since we want the API validation
// to take place BEFORE our routes
app.use(app.router);

// middleware with an arity of 4 are considered error handling middleware. When you next(err)
// it will be passed through the defined middleware in order, but ONLY those with an arity of 4,
// ignoring regular middleware.
app.use(function(err, req, res, next){
  // whatever you want here, feel free to populate
  // properties on `err` to treat it differently in here.
  res.type('application/json');
  res.send(err.status || 500, { error: err.message });
});

// our custom JSON 404 middleware. Since it's placed last, it will be the last middleware called,
// if all others invoke next() and do not respond.
app.use(function(req, res){
  res.type('application/json');
  res.send(404, { error: "Unhandled condition" });
});

app.all('/sign', function (req, res) {
  var user = req.param('username');
  var mypath= req.param('path');
  var direction = req.param('direction');
  res.type('application/json');
  var result = {};
  switch (direction) {
    case "upload" : direction = "send"; break;
    case "download" : direction = "recv"; break;
    default : result.error = "Wrong parameter value"; res.jsonp(result); break;
  }
  var cmdWithParams = cmd+' --mode='+direction;
  cmdWithParams = cmdWithParams+' --user='+user;
  if (direction === 'send') {
    cmdWithParams = cmdWithParams+' --dest="'+mypath+'"';
  } else {
    cmdWithParams = cmdWithParams+' --path="'+mypath+'"';
  }
  var child = exec(cmdWithParams, function (error, stdout, stderr) {
        if (error) {
          result.error = stderr;
          logger.log('Execute stderr: ' + stderr);
        } else {
          var out=stdout.replace(/\n/g,'');
          logger.log('Execute stdout: ' + out);
          result.token = out;
        }
        res.jsonp(result);
      });
});

} //main routine


function isReadableSync(filename) {
  if (fs.existsSync(filename)) {
    try {
      var fd = fs.openSync(filename, "r");
      fs.closeSync(fd);
      return true;
    } catch(e) {
      return false;
    }
  }
  return false;
}
