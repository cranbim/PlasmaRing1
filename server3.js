var express = require('express');
var ringMod= require('./ring.js');

//var newRing=new testRing.Ring();

var app=express();

var server=app.listen(4000);

var nextID=10000;
var nextRingID=0;
var nextAttachRequest=0;
var nextAttachOffer=0;
var heartbeat=1000;
var consoleSession;

var unattached=new ringMod.Ring("LOBBY"); //ring to monitor unattached devices
var ring=new ringMod.Ring("RING_01"); //ring to monitor attached devices
ring.setUnattached(unattached);
var sessions=[];

app.use(express.static('public'));

console.log("The Plasma Ring Server is running");
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
  socket.on('attach',attacher);
  socket.on('permit',permitReceived);
  socket.on('offerAccepted',offerAccepted);
  socket.on('console',setConsole);

  function offerAccepted(data){
		ring.offerAccepted(data);
  }
  
  function blobMsg(data){
			//console.log(data.x +' from '+socket.id);
			socket.broadcast.emit('blob', data);
  }

  function attacher(data){
		ring.attachRequested(data);
  }

  function permitReceived(data){
		ring.permitReceived(data);
  }

  function joiner(data){
		var newUnAttached=new ringMod.DeviceShadow(session);
		unattached.joinNewDevShadow(newUnAttached);
	}

	function unjoiner(data){
		unattached.unjoinRing(data.id);
		//remove device shadow?????
	}

	function setConsole(data){
		consoleSession=findSession(data.consoleid);
		console.log("Console identified as: "+consoleSession.id);
	}

  function clientDisconnect(){
	//need to handle the effect of disconnect on lobby and rings
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
//	unattached.run();
	ring.run();
	sendConsoleData();
}

function sendConsoleData(){
	if(consoleSession){
		console.log("Send console data");
		consoleSession.socket.emit('consoleData',{
			lobby: buildJSONRing(unattached),
			ring: buildJSONRing(ring),
			ringMeta: ring.buildJSONRingMeta()
		});
	} else {
		console.log("Can't send console data, no console connected");
	}
}

function findSession(devid){
	return sessions.find(function(session){
		return session.id===devid;
	});
}


function buildJSONRing(thisRing){
	var ringData={};
	var devices=[];
	if(thisRing){
		thisRing.deviceShadows.forEach(function(ud,i){
			devices[i]={
				position: i,
				connection: ud.session.id,
				socket: ud.session.socket.id
			};
		});
		ringData.name=thisRing.name;
		ringData.size=devices.length;
		ringData.data=devices;
	}
	return ringData;
}

//Object to store the session Id and socket
function Session(socket){ //class to hold session info
	this.socket=socket;
	this.id=nextID++; //increment the ID number
	socket.emit('id',{id:this.id});
}
