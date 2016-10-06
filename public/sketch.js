var socket;
var id;
var posX=0;
var count=0;
var connectionStatus=0; //0=connected, 1=unattached, 2=attached
var button, attachButton, statusMessage;

function setup() {
  createCanvas(400,400);
  button = select('#join');
  attachButton = select('#attach');
  attachButton.hide();
  statusMessage = select('#status');
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
}

function attachedToRing(data){
  console.log("Successfully attached to ring: "+data.ring);
}

function setID(data){
  id=data.id;
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