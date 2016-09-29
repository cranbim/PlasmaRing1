var socket;
var posX=0;
var count=0;

function setup() {
  createCanvas(400,400);
  socket=io.connect('http://localhost:4000');
  socket.on('connect', function(){
    console.log("Connected ("+socket.id+")");
  });
  socket.on('disconnect', function(){
    console.log("Disconnected from server ("+socket.id+")");
  });
  socket.on('blob', incomingBlob);
  socket.on('heartbeat',beat);
}

function draw() {
  background(255,50);
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

function mouseDragged(){
  console.log(mouseX+" "+mouseY);
  var data={
	x: mouseX,
	y: mouseY
  };

  socket.emit('mouse', data);

  noStroke();
  fill(0,80,150);
  ellipse(mouseX, mouseY,50,50);
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