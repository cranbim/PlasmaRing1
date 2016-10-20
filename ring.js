//Gobal Var  - check for conflicts
var nextRingID=0;

function Ring(name){
	var self=this;
	this.ringID=nextRingID++;
	this.name=name;
	this.size=0;
	this.deviceShadows=[];
	// var requesters=[];
	// var attachGrants=[];
	// var attachOffers=[];

	var requesters=new RequestList(this.name, this.ringID);
	var grants=new GrantList(this.name, this.ringID);
	var offers=new OffersList(this.name, this.ringID);

	this.buildJSONRingMeta=function(){
		var metaData={};
		metaData.requesters=requesters.buildMeta();
		metaData.grants=grants.buildMeta();
		metaData.offers=offers.buildMeta();
		return metaData;
	};


	this.joinRing=function(devid, nextid){
		var shadow=findDevShadow(devid);
		if(nextid) var next=findDevRingPos(nextid);
		else var next=this.deviceShadows.length-1;
		this.deviceShadows.splice(next,0,shadow);
		console.log(this.name+" "+this.ringID+" "+"new dev shadow joins ring, "+this.deviceShadows.length);
//		console.log(this.deviceShadows);
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
		requests.attachRequests(data.id);
	}

	this.permitReceived=function(data){
		//check for existing
		grants.newGrant(data.id);
		//log whether created or not
	}

	this.offerAccepted=function(data){
		//needs to be implemented
		console.log("Offer "+data.offer+" Accepted by "+data.device);
		//match offer 
		//join
		//notify and tody up
	}

	this.run=function(){
		//console.log(this.name+" "+this.ringID+" running");
		processAttachRequests();
		processAttachGrants();
		processAttachOffers();
	};

	function processAttachRequests(){
		var newRequests=false;
		//check not expired
		requests.run();
		var currrentRequests=requesters.get();
		//check all requests
		currrentRequests.forEach(
			function(requester){
				//is it new?
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
		grants.checkForExpired();
		var currentGrants=grants.get();
		var granted=[];
		//check for adjacent grants
		currentGrants.forEach(function(grant){
			granted.push(findDevRingPos(grant.device));
		});
		var p=granted.length-1;
		for(var i=0; i<granted.length; i++){
			var currPos=granted[i];
			var prevPos=granted[p];
			p=i;
			console.log("Check adjacency "+currPos+"-"+prevPos+"="+currPos-prevPos+", "+self.deviceShadows.length-1);
			if(currPos-prevPos===1||
				currPos-prevPos===-(self.deviceShadows.length-1)){ //two adjacent grants
				//check that an active offer does not exist already
				var pv=self.deviceShadows[prevPos].session.id;
				var nx=self.deviceShadows[currPos].session.id;
				//CREATE AN OFFER devid's not positions, which could change
				if(offers.offerExists(pv,nx)){
					console.log("Offer "+pv+" "+nx+" exists already");
				} else {
					var o=offers.newOffer(pv,nx);
					//send offer to requester and to offering devices.
					//send offer notice to prev, next and assigned requester
					var r=requesters.assignOffer(o);
					//deactivate requester
					offers.linkRequester(o,r);
				}
			}
		}
	}


	function processAttachOffers(){
		offers.checkForExpired();
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
		self.joinRing(devid,next);
		//remove from lobby
		unattached.unjoinRing(devid);
		//notify the device
		var ds=self.findDevShadow(devid);
		var s=ds.session.socket;
		//should this be done from here inside ring???
		s.emit('attached',{ring: self.ringID});
	}
}






	
