 

var restify = require('restify');
var fs = require('fs');

var port = 8091;
var testing = false;

// Print process.argv
if(process.argv.length > 0){
  console.log("\tCommand line arguments"); 

  process.argv.forEach(function (val, index, array) {
    //console.log(index + ': ' + val);
    switch(index){
      case 0:
      case 1:
        break;
      case 2:
        port = val;
        console.log("\tPort number set to:" + port);
        break;
      case 3:
        testing = (val === 'true');
        if(testing){
          console.log("\tTest mode activated");
        }
        break;
    }
  });
}

// Server
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
server.get("/", restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));


/*
getBackground
setCrossoverBoundary

*/


// Basic api test methods
function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get("/canvas", function(req, res, next) {
		fs.readFile('./above-museum4.jpg', function(err, file) {
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
    var filename = './crossover.json';
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

  var outputFilename = './crossover.json';

  fs.writeFile(outputFilename, JSON.stringify(crossoverData, null, 4), function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("crossover line JSON saved to " + outputFilename);
      }
  });

  res.send('OK');
  next();
});



server.get("/getRectangle", function (req, res, next) {
  
  try {
    var filename = './rectangle.json';
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

  var outputFilename = './rectangle.json';

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



// Start the server
server.listen(port, function () {
  console.log('%s listening at %s', server.name, server.url);
});

