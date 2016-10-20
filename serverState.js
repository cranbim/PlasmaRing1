/*-------------------------------------------
New implemntation of objects to manage state
---------------------------------------------*/

//Truly global variables
var nextAttachRequest=0;

//vars that would be part of the ring
	var requesters=new RequestList(ring.name, ring.id);
	var grants=new GrantList(ring.name, ring.id);
	var offers=new OffersList(ring.name, ring.id);

//this run function will be a method on the ring
function run(){
	//processRequests();
	requesters.run();
	//processGrants();
	//grants.run();
	//processOffers();
	offers.run();
	//processAttachers();
	attachers.run();
	//processDetachers();
}



//Object class for requesters
function RequestList(ringName,ringID){
	var requests=[];
	var expired=[];

	this.requestExists=function(requestingID){
		return requests.find(function(r){
			return r.id===requestingID && r.active;
		});
	};

	this.checkForExpired=function(){
		requests=requests.filter(function(r){
			if(r.isExpired()){
				expired.push(r);
				return false;
			}
			return true;
		});
	};

	this.cleanupExpired=function(){};

	this.attachRequest=function(requestingID){
		if(!this.requestExists(requestingID)){
			console.log("RING"+ringID+" "+ringName+" Attachment requested, "+requestingID);
			var ar=new AttachRequest(requestingID);
			requests.push(ar);
		}
	};

	this.assignOffer=function(offerid){
		var assigned=null;
		for(var i=0; i<requests.length; i++){
			var r=requests[i];
			//find the first active requester
			if(r.active){
				r.offer=offerid;
				r.active=false;
				assigned=r.id;
				break;
			}
		}
		return assigned;
	};

	this.buildMeta=function(){
		var reqs=[];
		if(requests){
			requests.forEach(function(r,i){
				reqs[i]={
					id: r.id,
					device: r.devid
				};
			});
		}
		return reqs;
	};

	this.run=function(){
		var expired=[];
		//remove expired requests
		this.checkForExpired();
		//Process expired requests?
		this.cleanupExpired();
	};

	this.getRequests=function(){
		return requests;
	};
}


//Ojject class for granst to attach
function GrantsList(){
	var grants=[];
	var expired=[];

	this.grantExists=function(){
		//needs to be implemented
		return null;
	};

	this.get=function(){
		return grants;
	};

	this.checkForExpired=function(){
		grants=grants.filter(function(g){
			if(g.isExpired()){
				expired.push(g);
				return false;
			}
			return true;
		});
	};

	this.cleanupExpired=function(){};


	this.newGrant=function(){};

	this.buildMeta=function(){
		var grantMeta=[];
		if(grants){
			grants.forEach(function(g,i){
				grantMeta[i]={
					device: g.devid
				};
			});
		}
		return grantMeta;
	};

}


//Object class for attach offers
function OffersList(){
	var offers=[];
	var expired=[];

	this.offerExists=function(p,n){
		return offers.find(function(o){
			return o.prevID===p && o.nextID===n && o.active;
		});
	};

	this.checkForExpired=function(){
		offers=offers.filter(function(o){
			if(o.isExpired()){
				expired.push(o);
				return false;
			}
			return true;
		});
	};

	this.cleanupExpired=function(){};

	this.linkRequester=function(o,r){
		//find o
		//and assign r to it
	};

	this.newOffer=function(p,n){
		var o=new AttachOffer(p,n);
		attachOffers.push(o);
		return o.id;
	};

	this.buildMeta=function(){
		var offerMeta=[];
		if(offers){
			offers.forEach(function(o,i){
				offerMeta[i]={
					id: o.id,
					prev: o.prevID,
					next: o.nextID
				};
			});
		}
		return offerMeta;
	}

	this.run=function(){
		var expired=[];
		//remove expired requests
		offers=offers.filter(function(o){
			if(o.isExpired()){
				console.log("RING"+ringID+" "+ringName+"offer"+o.id+" has expired");
				// o.active=false;
				expired.push(o);
			}
			return o.active;
		});
		//do something with expired offers?

		//process offers to send out?
		//process offers acceptd or rejected
		//withdraw unused offers
	};
}


//Object for individual request

function AttachRequest(devid){
	var ttl=10000;
	this.id=nextAttachRequest++;
	this.devid=devid;
	this.active=true;
	this.requestBroadcastSent=false;
	this.requestingDev=devid;
	this.timeRequested=Date.now();
	this.expires=this.timeRequested+ttl;
	this.offer=null;
	this.isExpired=function(){
		this.active=!Date.now()>this.expires;
		return !this.active;
	};
}

//Object for individual Grant

function AttachGrant(devid){
	var ttl=5000;
	this.device=devid;
	this.active=true;
	this.timeGranted=Date.now();
	this.expires=this.timeGranted+ttl;

	this.isExpired=function(){
		this.active=!Date.now()>this.expires;
		return !this.active;
	};
}

//Object for individual Attach offer

function AttachOffer(prev, next){
	var ttl=5000;
	this.id=nextAttachOffer++;
	this.active=true;
	this.prevID=prev;
	this.nextID=next;
	this.timeGranted=Date.now();
	this.expires=this.timeGranted+ttl;
	this.offerSent=false;

	this.isExpired=function(){
		this.active=!Date.now()>this.expires;
		return !this.active;
	};
}

