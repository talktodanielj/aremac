var net = require('net');
var conn = net.createConnection('echo_socket');
conn.on('connect', function() {
    console.log('connected to unix socket server');
    conn.write("Hello World\r\n");
});

conn.on('data', function(data){
	console.log('Data: ' + data);
});

conn.on('close', function() {
	console.log('Connection closed');
});
