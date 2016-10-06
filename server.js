var express = require('express');

var app=express();

var server=app.listen(4000);

var nextID=10000;
var nextRingID=0;
var nextAttachRequest=0;
var heartbeat=1000;

var unattached=new Ring("LOBBY"); //ring to monitor unattached devices
var ring=new Ring("RING_01"); //ring to monitor attached devices
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
  socket.on('attach',attacher);
  
  function blobMsg(data){
			//console.log(data.x +' from '+socket.id);
			socket.broadcast.emit('blob', data);
  }

  function attacher(data){
  	ring.attachRequested(data);
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
	ring.run();
}




function Session(socket){ //class to hold session info
	this.socket=socket;
	this.id=nextID++; //increment the ID number
	socket.emit('id',{id:this.id});
}




function Ring(name){
	var self=this;
	this.ringID=nextRingID++;
	this.name=name;
	this.size=0;
	this.deviceShadows=[];
	var requesters=[];
	this.attachGrants=[];

	this.joinRing=function(shadow){
		this.deviceShadows.push(shadow);
		console.log(this.name+" "+this.ringID+" "+"new dev shadow joins ring, "+this.deviceShadows.length);
		console.log(this.deviceShadows);
	};
	this.unjoinRing=function(id){
		var i=this.deviceShadows.forEach(function(ds,index){
			if(ds.session.id==id) return index;
		});
		this.deviceShadows[i]=null;
		this.deviceShadows.splice(i,1);
		console.log(this.name+" "+this.ringID+" "+"unJoined device shadow: "+id+" "+this.deviceShadows.length);
	};

	this.findDevShadow=function(devid){
		return this.deviceShadows.find(function(ds){
			return ds.session.id===devid;
		});
	};
	
	this.attachRequested=function(data){
		console.log(this.name+" "+this.ringID+" "+"Attachment to ring requested, "+data.id);
		var ar=new AttachRequest(data.id);
		requesters.push(ar);
	};

	// this.attach=function(data){
	// 	var s=this.size;
	// 	this.size+=data.x;
	// 	return {start: s,
	// 					end:this.size};
	// };

	this.run=function(){
		console.log(this.name+" "+this.ringID+" running");
		processAttachRequests();

		function processAttachRequests(){
			var newRequests=false;
			//remove any expired requests
			requesters=requesters.filter(function(r){
				return !r.isExpired();
			});
			console.log(self.name+" "+self.ringID+" there are this many attach requests: "+requesters.length);
			//check if there are requestors
			requesters.forEach(
				function(requester){
					//any new requestors?
					if(!requester.requestBroadcastSent){
						if(self.deviceShadows.length===0){
							//there are no other devices, so I can just join
							attachToRing(requester.requestingDev);
						}
						requester.requestBroadcastSent=true;
						newRequests=true;
					}
				}
			);
			if(newRequests){
				console.log("new Request For Permit Broadcast");
				//send out permit requests if necessary
				self.deviceShadows.forEach(function(devShadow){
					//send out permit requests if necessary
					devShadow.requestForPermit();
					//if just been sent out then don't broadcast
				});
			} else console.log("NO Request For Permit Broadcast");
				//any permissions ready to send back?	
		}
	};

	function processAttachPermits(){
		//remove any expired grants
		this.attachGrants=this.attachGrants.filter(function(g){
			return !g.isExpired();
		});
		//check if we even need a grant
	}

	

	function attachToRing(devid){
		console.log(self.name+" "+self.ringID+" Attaching device to ring, dev: "+devid);
		//find device shadow in lobby
		var ds=unattached.findDevShadow(devid);
		//assign device shadow to this ring
		self.joinRing(ds);
		//remove from lobby
		unattached.unjoinRing(devid);
		//notify the device
		var s=ds.session.socket;
		s.emit('attached',{ring: self.ringID});
	}


	function AttachRequest(devid){
		var ttl=10000;
		this.id=nextAttachRequest++;
		this.requestBroadcastSent=false;
		this.requestingDev=devid;
		this.timeRequested=Date.now();
		this.expires=this.timeRequested+ttl;

		this.isExpired=function(){
			return Date.now()>this.expires;
		};
	}

	function AttachGranted(){
		var ttl=5000;
		this.timeGranted=Date.now();
		this.expires=this.timeGranted+ttl;

		this.isExpired=function(){
			return Date.now()>this.expires;
		};
	}
}

function DeviceShadow(session){
	this.session=session;
	console.log("New device shadow "+this.session.id);

	this.requestForPermit=function(){
		console.log(this.session.id+" received request for attach permit. Pass to device");
		this.session.socket.emit('rfpermit',{});
	};
}

