
var connect = require("connect");
var restify = require('restify');
var fs = require('fs');
var http = require('http');

var PORT = 80;

// Print process.argv
if(process.argv.length > 0){
  //console.log("\tCommand line arguments"); 

  process.argv.forEach(function (val, index, array) {
    //console.log(index + ': ' + val);
    switch(index){
      case 0:
      case 1:
        break;
      case 2:
        PORT = val;
        break;
    }
  });
}

// API Rest Server
var server = restify.createServer({
  name: 'people-counter-camera-api',
  version: '1.0.0',
  accept: ['application/json', 'text/html', 'image/png', 'image/jpg']
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS({origins: ['*']}));
server.use(restify.fullResponse());

// Static content
/*server.get("/", restify.serveStatic({
  'directory': '.',
  'default': 'index.html'
}));*/

// Basic api test methods
function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get("/canvas", function(req, res, next) {
    fs.readFile('./api/above-museum4.jpg', function(err, file) {
    if (err) {
      res.send(500);
      return next();
    }
 
    res.writeHead(200, {'Content-Type': 'image/jpg; charset=utf-8'});
    res.write(file);
    res.end();
    return next();
  });
});

server.get("/getCrossover", function (req, res, next) {
  
  try {
    var filename = './api/crossover.json';
    var data = fs.readFileSync(filename, "utf8")
    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(data);
  }
  catch (e) {
    console.log(e);
    res.send(404); // file not found
  }
  return next();
});

server.post('/updateCrossover', function (req, res, next) {
  
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "X-Requested-With");

  console.log("updateCrossover: left->" + req.params.left_point + " center->" + req.params.center_point + " right->" + req.params.right_point);

  var crossoverData = {
    left: req.params.left_point,
    center: req.params.center_point,
    right: req.params.right_point
  }

  var outputFilename = './api/crossover.json';

  fs.writeFile(outputFilename, JSON.stringify(crossoverData, null, 4), function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("crossover line JSON saved to " + outputFilename);
      }
  });

  //res.header('Content-Type', 'text/html; charset=utf-8');
  res.send('OK');
  next();
});

server.get("/getRectangle", function (req, res, next) {
  
  try {
    var filename = './api/rectangle.json';
    var data = fs.readFileSync(filename, "utf8")
    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(data);
  }
  catch (e) {
    console.log(e);
    res.send(404); // file not found
  }
  return next();
});

server.post('/updateRectangle', function (req, res, next) {
  
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "X-Requested-With");

  console.log("updateRectangle: top->" + req.params.top + " left->" + req.params.left + " angle->" + req.params.angle + " scale->" + req.params.scale);

  var rectangleData = {
    top: req.params.top,
    left: req.params.left,
    angle: req.params.angle,
    scale: req.params.scale
  }

  var outputFilename = './api/rectangle.json';

  fs.writeFile(outputFilename, JSON.stringify(rectangleData, null, 4), function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("rectangle JSON saved to " + outputFilename);
      }
  });

  res.send('OK');
  next();
});


// Websocket server to stream camera feed
var STREAM_SECRET = "secret",
  WEBSOCKET_PORT = 8091,
  STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var width = 320,
  height = 240;

// Websocket Server
var socketServer = new (require('ws').Server)({port: WEBSOCKET_PORT});
socketServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, {binary:true});

  console.log( 'New WebSocket Connection ('+socketServer.clients.length+' total)' );
  
  socket.on('close', function(code, message){
    console.log( 'Disconnected WebSocket ('+socketServer.clients.length+' total)' );
  });
});

socketServer.broadcast = function(data, opts) {
  for( var i in this.clients ) {
    if (this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      console.log( 'Error: Client ('+i+') not connected.' );
    }
  }
};

// HTTP Server to accept incomming MPEG Stream
var streamServerCallback  = function(request, response) {
  console.log("Stream url:" + request.url);
  var params = request.url.substr(1).split('/');
  width = (params[1] || 320)|0;
  height = (params[2] || 240)|0;

  if( params[0] == STREAM_SECRET ) {
    console.log(
      'Stream Connected: ' + request.socket.remoteAddress + 
      ':' + request.socket.remotePort + ' size: ' + width + 'x' + height
    );
    request.on('data', function(data){
      socketServer.broadcast(data, {binary:true});
    });
  }
  else {
    console.log(
      'Failed Stream Connection: '+ request.socket.remoteAddress + 
      request.socket.remotePort + ' - wrong secret.'
    );
    response.end();
  }
};

console.log('Listening for MPEG Stream on http://127.0.0.1:' +PORT+ '/stream/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

// Server for html via the Connect library
var app = connect()
	    .use(connect.logger('dev'))
	    .use(connect.static(__dirname ))
       // And some magic to chain Restify and Connect together
      .use("/api", function (req, res) {
        server.server.emit('request', req, res);
      })
      .use("/socket", function (req, res) {
        socketServer.server.emit('request', req, res);
      })
      .use("/stream", streamServerCallback);


console.log("Starting Peolple Counting server on port " + PORT);
app.listen(PORT);
