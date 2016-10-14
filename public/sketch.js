var socket;
var id;
var posX=0;
var count=0;
var connectionStatus=0; //0=connected, 1=unattached, 2=attached
var button, attachButton, permitButton, statusMessage, idnum;
var offersList;
var offers=[];

function setup() {
  createCanvas(400,400);
  button = select('#join');
  attachButton = select('#attach');
  attachButton.hide();
  permitButton = select('#permit');
  permitButton.hide();
  statusMessage = select('#status');
  idnum = select('#idnum');
  socket=io.connect('http://localhost:4000');
  socket.on('connect', connected);
  socket.on('id',setID);
  socket.on('disconnect', function(){
    console.log("Disconnected from server ("+socket.id+")");
    button.html("Nothing");
  });
}

function connected(){
  console.log("Connected ("+socket.id+")");
  statusMessage.html("Connected");
  button.mouseClicked(joinMe);
  attachButton.mouseClicked(attachMe);
  socket.on('blob', incomingBlob);
  socket.on('heartbeat',beat);
  socket.on('rfpermit',requestForPermit);
  socket.on('attached',attachedToRing);
  socket.on('offer',processOffer);
}

function processOffer(data){
  //should really clean up and recreate this each time
  console.log("Offer received, between: "+data.prev+","+data.next);
  if(!offersList){
    offersList=createElement('ul');
  } else {
    var offerString="Offer to attach between "+data.prev+" and "+data.next;
    var li=createElement('li');
    li.parent(offersList);
    var el=createP(offerString);
    var acceptOfferButton=createButton("accept offer");
    li.child(el);
    li.child(acceptOfferButton);
    acceptOfferButton.mouseClicked(handleAcceptOffer);
    var offerTemp={
      id: data.id,
      prev: data.prev,
      next: data.next,
      button: acceptOfferButton
    };
    offers.push(offerTemp);
  }
}

function handleAcceptOffer(){
  var offer;
  //find offer assocaited with the clicked button
  offers.forEach(function(o){
    if(o.button==this) offer=o;
  });
  //process clicked offer
  o.button.html("Accepted");
  socket.emit("offerAccepted",{offer:o.id, device:id});
}

function attachedToRing(data){
  console.log("Successfully attached to ring: "+data.ring);
  statusMessage.html('Attached to Ring');
  attachButton.html('detach');
  permitButton.show();
  permitButton.mouseClicked(permitAttacher);
}

function permitAttacher(){
  console.log("Permit Attacher");
  socket.emit('permit',{id:id});
}

function setID(data){
  id=data.id;
  idnum.html(id);
  console.log("My ID="+id);
}

function requestForPermit(){
  console.log("received request for attach permit from ring");
}

function joinMe(){
  if(connectionStatus===0){
    button.html('un-Join');
    connectionStatus=1;
    statusMessage.html('Joined');
    socket.emit('join',{});
    attachButton.show();
    console.log("request join to unattached");
  }else if(connectionStatus===1){
    button.html('Join');
    connectionStatus=0;
    statusMessage.html('Connected');
    socket.emit('unjoin',{id: id});
    console.log("request unjoin from unattached");
    attachButton.hide();
  }
}
function attachMe(){
  socket.emit('attach',{id: id});
  console.log("requested attachement to ring");
  statusMessage.html('Requested attachment to Ring');
}

function draw() {
  background(155,50);
  count++;
  posX++;
  if(count%10===0){
    socket.emit('blob',{x:posX});
  }
  if(posX>=width){
    count=0;
    posX=0;
  }
  fill(0,200,200);
  noStroke();
  ellipse(posX,height/2,10,10);
  //background(200,150,10);
}

function incomingBlob(data){
	//console.log("incoming "+data);
	noFill();
  stroke(100,80,60);
  ellipse(data.x, height/4,10,10);
}

function beat(data){
  console.log(data.beat);
}