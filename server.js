var express = require('express');

var app=express();

var server=app.listen(4000);

app.use(express.static('public'));

console.log("My socket server is running");
console.log("Listening on port:4000");

var socket = require('socket.io');

var io=socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket){
  console.log("New connection "+socket.id);
  socket.on('mouse', mouseMsg);

  function mouseMsg(data){
  	console.log(data +' from '+socket.id);
  	socket.broadcast.emit('mouse', data);
  }
}