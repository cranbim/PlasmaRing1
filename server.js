var express = require('express');

var app=express();

var server=app.listen(4000);

var sessions=[];
var nextID=10000;
var heartbeat=1000;

var ring=new Ring();

app.use(express.static('public'));

console.log("My socket server is running");
console.log("Listening on port:4000");

var socket = require('socket.io');

var io=socket(server);

io.sockets.on('connection', newConnection);

var h=setInterval(beat,1000);

function newConnection(socket){
  var session=new Session(socket);
  sessions.push(session);
  console.log("New connection, session:"+session.id+" socket:"+socket.id);
  console.log("Num sessions:"+sessions.length);
  //socket.on('mouse', mouseMsg);
  socket.on('disconnect', clientDisconnect);
  socket.on('join',joiner);
  socket.on('blob',blobMsg);
  
  function blobMsg(data){
			//console.log(data.x +' from '+socket.id);
			socket.broadcast.emit('blob', data);
  }

  function joiner(data){
		var se=ring.join(data.x);
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

function beat(){
	heartbeat++;
	console.log("heartbeat "+heartbeat);
	if(sessions.length>0) io.sockets.emit('heartbeat',{beat:heartbeat});
}

function Session(socket){ //class to hold session info
	this.socket=socket;
	this.id=nextID++; //increment the ID number
}


function Ring(){
	this.ringID=0;
	this.size=0;

	this.join=function(x){
		var s=this.size;
		this.size+=x;
		return {start: s,
						end:this.size};
	}
}