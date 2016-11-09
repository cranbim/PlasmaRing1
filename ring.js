module.exports={
	Ring: Ring,
	DeviceShadow: DeviceShadow
};

var serverState=require('./serverState.js');
//Gobal Var  - check for conflicts
var nextRingID=0;



//this run function will be a method on the ring
function run(){
	//processRequests();
		requesters.run();
	//processGrants();
	//grants.run();
	//processOffers();
		offers.run();
	//processAttachers();
		attachers.run(); // no such thing yet?
	//processDetachers();
}


function DeviceShadow(session){
	this.session=session;
	console.log("New device shadow "+this.session.id);

	this.requestForPermit=function(){
		console.log(this.session.id+" received request for attach permit. Pass to device");
		this.session.socket.emit('rfpermit',{});
	};
}



function Ring(name){
	var self=this;
	var unattached=null;
	this.ringID=nextRingID++;
	this.name=name;
	this.size=0;
	this.deviceShadows=[];
	// var requesters=[];
	// var attachGrants=[];
	// var attachOffers=[];

	var requesters=new serverState.RequestList(this.name, this.ringID);
	var grants=new serverState.GrantsList(this.name, this.ringID);
	var offers=new serverState.OffersList(this.name, this.ringID);

	this.setUnattached=function(from){
		unattached=from;
	};

	this.buildJSONRingMeta=function(){
		var metaData={};
		metaData.requesters=requesters.buildMeta();
		metaData.grants=grants.buildMeta();
		metaData.offers=offers.buildMeta();
		return metaData;
	};

	this.joinNewDevShadow=function(shadow){
		this.deviceShadows.push(shadow);
	};

	this.findShadow=function(devid){
		return findDevShadow(devid);
	};

	this.joinRing=function(devid, nextid){
		var next;
		var shadow=unattached.findShadow(devid);
		if(nextid) next=findDevRingPos(nextid);
		else next=this.deviceShadows.length-1;
		this.deviceShadows.splice(next,0,shadow);
		console.log(this.name+" "+this.ringID+" "+"new dev shadow joins ring, "+this.deviceShadows.length);
//		console.log(this.deviceShadows);
		return next; //position on inserted device
	};

	this.unjoinRing=function(id){
		var i=findDevRingPos(id);
		//this.deviceShadows[i]=null;
		this.deviceShadows.splice(i,1);
		console.log(this.name+" "+this.ringID+" "+"unJoined device shadow: "+id+" "+this.deviceShadows.length);
	};

	//this.findDevShadow=function(devid){}
	//replaced with declared function

	this.attachRequested=function(data){
		//check it's not already attached
		// console.log({shadow: findDevShadow(data.id)});
		if(typeof(findDevShadow(data.id))==="undefined"){
			requesters.attachRequest(data.id);
		}	else {
			console.log("The requesting device is already attached");
		}
		// var t=requesters.getRequests();
		// console.log(t.length+" requests");
	};

	this.permitReceived=function(data){
		//check for existing
		grants.newGrant(data.id);
		//log whether created or not
	};

	this.offerAccepted=function(data){
		//needs to be implemented
		console.log("Offer "+data.offer+" Accepted by "+data.device);
		//match offer 
		var pAndN=offers.getPandN(data.offer);
		console.log(pAndN);
		console.log(data.device, pAndN.prev, pAndN.next);
		attachToRing(data.device, pAndN.prev, pAndN.next);
		//notify
		//cleanup
			//remove grants
		grants.remove(pAndN.prev);
		grants.remove(pAndN.next);
			//remove offer
		offers.remove(data.offer);
	};

	this.run=function(){
		//console.log(this.name+" "+this.ringID+" running");
		processAttachRequests();
		processAttachGrants();
		processAttachOffers();
	};

	function processAttachRequests(){
		//console.log("checking requests");
		var newRequests=false;
		//check not expired
		requesters.run();
		var currentRequests=requesters.getRequests();
		//check all requests
		// console.log(currentRequests.length+" current requests");
		currentRequests.forEach(
			function(requester){
				//is it new?
				//console.log(requester);
				if(!requester.requestBroadcastSent){
				//if no existing attached
					if(self.deviceShadows.length===0){
						//create instant attach
						console.log("No existing devices so just join");
						attachToRing(requester.requestingDev);
						requester.requestBroadcastSent=true;
					} else if(self.deviceShadows.length===1){ //if only one attached
						//create instant join
						console.log("Only one existing devices so just join");
						attachToRing(requester.requestingDev,0);
						requester.requestBroadcastSent=true;
					} else { //the ring is not empty
						requester.requestBroadcastSent=true;
						console.log("Just another request");
						newRequests=true;
					}
				}
			}
		);
		if(newRequests){
			//send out permit requests if necessary
			self.deviceShadows.forEach(function(devShadow){
				devShadow.requestForPermit();
				//if just been sent out then don't broadcast
			});
		}
	}

	function processAttachGrants(){
		//check for existing,grants
		//grants.checkForExpired();
		grants.run();
		var currentGrants=grants.get();
		var granted=[];
		//check for adjacent grants
		currentGrants.forEach(function(grant){
			granted.push(findDevRingPos(grant.device));
		});
		console.log("Grants count: "+currentGrants.length+" "+granted.length);
		var p=granted.length-1;
		for(var i=0; i<granted.length; i++){
			var currPos=granted[i];
			var prevPos=granted[p];
			p=i;
			console.log("Check adjacency "+currPos+"-"+prevPos+"="+(currPos-prevPos)+", "+(self.deviceShadows.length-1));
			if(granted.length>1){
				if(currPos-prevPos===1||
					currPos-prevPos===-(self.deviceShadows.length-1)){ //two adjacent grants
					//check that an active offer does not exist already
					var pv=self.deviceShadows[prevPos].session.id;
					var nx=self.deviceShadows[currPos].session.id;
					//CREATE AN OFFER devid's not positions, which could change
					if(offers.offerExists(pv,nx)||offers.offerExists(nx,pv)){ //because when there are only two existing devices, the oofer is valid both ways around
						console.log("Offer "+pv+" "+nx+" exists already");
					} else {
						//create the offer
						var o=offers.newOffer(pv,nx);
						//assign to the first available requester
						var r=requesters.assignOffer(o);
						//retrieve id of requesting device
						var requestingDev=requesters.getDevid(r);
						var ds=unattached.findShadow(requestingDev);
						console.log("Offer destined for device"+ds.id);
						console.log("Issuing offer "+o+" to "+requestingDev);
						//send offer to requesting device
						ds.session.socket.emit('offer',{id: o, prev:pv, next:nx, expires:offers.getExpiry(o)});
						//??? send offer info and to offering devices.
						offers.linkRequester(o,r);
					}
				}
			}
		}
	}


	function processAttachOffers(){
		//offers.checkForExpired();
		offers.run();
		//for each
		//check if broadcast
		//assign to first requester
		//send

		//assign according to queue
		//how to track who has had an offer?
		//find next unassigned requester
		//send an offer
		//flash the client devices (TTL?)
		//and then what?
	}

	
	function findDevRingPos(devid){
		var index;
		self.deviceShadows.find(function(ds,i){
			if(ds.session.id===devid){
				index=i;
				return true;
			}
		});
		return index;
	}

	function findDevShadow(devid){
		var dev=self.deviceShadows.find(function(ds){
			return ds.session.id===devid;
		});
		// console.log(dev);
		return dev;
	}

	function attachToRing(devid, prev, next){
		console.log(self.name+" "+self.ringID+" Attaching device to ring, dev: "+devid+" twixt: "+prev+" and: "+next);
		//assign device shadow to this ring
		var pos=self.joinRing(devid,next);
		//remove from lobby
		var ds=unattached.findShadow(devid);
		unattached.unjoinRing(devid);
		//notify the device
		var s=ds.session.socket;
		//should this be done from here inside ring???
		s.emit('attached',{ring: self.ringID});
		s.emit('ringpos',{ring: self.ringID, pos:pos});
		if(next){
			ds=self.findShadow(next);
			s=ds.session.socket;
			s.emit('ringpos',{ring: self.ringID, pos:pos+1});
		}
		//remove any active attach requests for this device
		requesters.remove(devid);
	}
}






	
