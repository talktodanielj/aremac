
var connect = require("connect");

var app = connect()
	    .use(connect.logger('dev'))
	    .use(connect.static(__dirname ));

var port = 8090;
var testMode = false;

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
    }
  });
}

console.log("Starting Peolple Counting Application application server on port " + port);
app.listen(port);