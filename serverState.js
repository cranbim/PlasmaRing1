module.exports={
	RequestList: RequestList,
	GrantsList: GrantsList,
	OffersList: OffersList,
	AttachRequest: AttachRequest,
	AttachGrant: AttachGrant,
	AttachOffer: AttachOffer
};

/*-------------------------------------------
New implemntation of objects to manage state
---------------------------------------------*/

//Truly global variables
var nextAttachRequest=0;
var nextAttachOffer=0;

//vars that would be part of the ring
	// var requesters=new RequestList(ring.name, ring.id);
	// var grants=new GrantList(ring.name, ring.id);
	// var offers=new OffersList(ring.name, ring.id);

//this run function will be a method on the ring
// function run(){
	// //processRequests();
	// 	requesters.run();
	// //processGrants();
	// //grants.run();
	// //processOffers();
	// 	offers.run();
	// //processAttachers();
	// 	attachers.run();
	// //processDetachers();
// }



//Object class for requesters
function RequestList(ringName,ringID){
	var requests=[];
	var expired=[];

	this.requestExists=function(requestingID){
		return requests.some(function(r){
			return r.requestingDev===requestingID && r.active;
		});
	};

	this.remove=function(devid){
		requests=requests.filter(function(r){
			return r.devid!==devid;
		});
	};

	this.getDevid=function(requestid){
		var res=requests.find(function(r){
			return r.id==requestid;
		});
		if (res) return res.devid;
		else return null;
	};

	this.checkForExpired=function(){
		// requests.forEach(function(r){
		//	if(r.isExpired()){

		// }
		// });
		// console.log("Pre Requests Still active: "+requests.length);
		requests=requests.filter(function(r){
			if(r.isExpired()){
				//expired.push(r);
				return false;
			}
			return true;
		});
		// console.log("Post Requests Still active: "+requests.length);
		// console.log("Expired requests: "+expired.length);
	};

	this.cleanupExpired=function(){};

	this.attachRequest=function(requestingID){
		if(!this.requestExists(requestingID)){
			console.log("RING "+ringID+" "+ringName+" Attachment requested, "+requestingID);
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
					device: r.devid,
					active: r.active
				};
			});
		}
		return reqs;
	};

	this.run=function(){
		//var expired=[];
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

	this.grantExists=function(devid){
		//needs to be implemented
		return grants.some(function(g){
			return g.device===devid && g.active;
		});
		//return null;
	};

	this.remove=function(devid){
		console.log("Attempt remove of grant "+devid);
		grants=grants.filter(function(g){
			console.log(g.device);
			if(g.device===devid)
				console.log("remove grant from "+g.devid);
			return g.device!==devid;
		});
	};

	this.run=function(){
		this.checkForExpired();
	};

	this.get=function(){
		return grants;
	};

	this.checkForExpired=function(){
		grants=grants.filter(function(g){
			if(g.isExpired()){
				//expired.push(g);
				return false;
			}
			return true;
		});
	};

	this.cleanupExpired=function(){};


	this.newGrant=function(devid){
		if(!this.grantExists(devid)){
			console.log("RING "+/*ringID+" "+ringName+*/" Permit granted by, "+devid);
			var ag=new AttachGrant(devid);
			grants.push(ag);
		}
	};

	this.buildMeta=function(){
		var grantMeta=[];
		if(grants){
			grants.forEach(function(g,i){
				grantMeta[i]={
					device: g.device,
					active: g.active
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
		offers.forEach(function(offer){
			if(offer.id===o){
				offer.deviceInvited=r;
			}
		});
		//and assign r to it
	};

	this.getPandN=function(offerID){
		var res;
		offers.forEach(function(o){
			console.log(o.id+" "+typeof(o.id));
			console.log(offerID+" "+typeof(offerID));
			if(o.id===offerID){
				res= {
					prev: o.prevID,
					next: o.nextID
				};
			}
		});
		console.log(res);
		return res;
	};

	this.remove=function(offerID){
		offers=offers.filter(function(o){
			if(o.id===offerID)
				console.log("remove offer "+offerID);
			return o.id!==offerID;
			// if(o.id===offerID){
			// 	//remove grants
			// 	return false;
			// }
			// return true;
		});
	};

	this.newOffer=function(p,n){
		var o=new AttachOffer(p,n);
		console.log("New attach Offer created between "+p+", "+n);
		offers.push(o);
		return o.id;
	};

	this.buildMeta=function(){
		var offerMeta=[];
		if(offers){
			offers.forEach(function(o,i){
				offerMeta[i]={
					id: o.id,
					prev: o.prevID,
					next: o.nextID,
					active: o.active
				};
			});
		}
		return offerMeta;
	};

	this.run=function(){
		//remove expired requests
		offers=offers.filter(function(o){
			if(o.isExpired()){
				console.log("RING"+/*ringID+" "+ringName+*/" offer"+o.id+" has expired");
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

	this.getExpiry=function(offerID){
		var et;
		offers.forEach(function(o){
			if(o.id===offerID){
				et=o.expires;
			}
		});
		return et;
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
		// var d=Date.now();
		// console.log(this.expires+" "+d+" "+d>this.expires);
		this.active=!(Date.now()>this.expires);
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
		this.active=!(Date.now()>this.expires);
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
	this.deviceInvited=null;
	this.offerSent=false;

	this.isExpired=function(){
		this.active=!(Date.now()>this.expires);
		return !this.active;
	};
}

