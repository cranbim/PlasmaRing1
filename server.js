var express = require('express');

var app=express();

var server=app.listen(4000);

var sessions=[];
var nextID=10000;

app.use(express.static('public'));

console.log("My socket server is running");
console.log("Listening on port:4000");

var socket = require('socket.io');

var io=socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket){
  var session=new Session(socket);
  sessions.push(session);
  console.log("New connection, session:"+session.id+" socket:"+socket.id);
  console.log("Num sessions:"+sessions.length);
  socket.on('mouse', mouseMsg);
  socket.on('disconnect', clientDisconnect);

  function mouseMsg(data){
			console.log(data +' from '+socket.id);
			socket.broadcast.emit('mouse', data);
  }

  function clientDisconnect(){
		var i=sessions.forEach(function(sesh,index){
			if(sesh.id==session.id) return index;
		});
		sessions.splice(i,1);
		console.log("Removed disconnected session: "+session.id+" socket:"+session.socket.id);
		console.log("Num sessions:"+sessions.length);
	}
}



function Session(socket){ //class to hold session info
	this.socket=socket;
	this.id=nextID++; //increment the ID number
}