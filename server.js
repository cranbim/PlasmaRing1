var express = require('express');

var app=express();

var server=app.listen(4000);

var nextID=10000;
var heartbeat=1000;

var ring=new Ring(); //ring to monitor attached devices
var unattached=new Ring(); //ring to monitor unattached devices
var sessions=[];

app.use(express.static('public'));

console.log("The Plasma Ring Serevr is running");
console.log("Listening on port:4000");

var socket = require('socket.io');

var io=socket(server);

io.sockets.on('connection', newConnection);

var h=setInterval(beat,1000);//set one second heartbeat

function newConnection(socket){
  var session=new Session(socket);
  sessions.push(session);
  console.log("New connection, session:"+session.id+" socket:"+socket.id);
  console.log("Num sessions:"+sessions.length);
  //socket.on('mouse', mouseMsg);
  socket.on('disconnect', clientDisconnect);
  socket.on('join',joiner);
  socket.on('unjoin',unjoiner);
  socket.on('blob',blobMsg);
  socket.on('attach',unattached.attachRequested);
  
  function blobMsg(data){
			//console.log(data.x +' from '+socket.id);
			socket.broadcast.emit('blob', data);
  }

  function joiner(data){
		var newUnAttached=new DeviceShadow(session);
		unattached.joinRing(newUnAttached);
	}

	function unjoiner(data){
		unattached.unjoinRing(data.id);
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
	socket.emit('id',{id:this.id});
}


function Ring(){
	this.ringID=0;
	this.size=0;
	this.deviceShadows=[];
	this.requesters=[];
	this.joinRing=function(shadow){
		this.deviceShadows.push(shadow);
		console.log("new dev shadow joins ring, "+this.deviceShadows.length);
		console.log(this.deviceShadows);
	};
	this.unjoinRing=function(id){
		var i=this.deviceShadows.forEach(function(ds,index){
			if(ds.session.id==id) return index;
		});
		this.deviceShadows[i]=null;
		this.deviceShadows.splice(i,1);
		console.log("unJoined device shadow: "+id+" "+this.deviceShadows.length);
	};
	
	this.attachRequested=function(data){
		console.log("Attachment to ring requested, "+data.id);
	};

	this.attach=function(data){
		var s=this.size;
		this.size+=data.x;
		return {start: s,
						end:this.size};
	};
}

function DeviceShadow(session){
	this.session=session;
	console.log("New device shadow "+this.session.id);
}

