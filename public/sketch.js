var socket;

function setup() {
  createCanvas(400,400);
  socket=io.connect('http://localhost:4000');
  socket.on('mouse', incomingMouse);
}

function draw() {
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

function incomingMouse(data){
	//console.log("incoming "+data);
	noStroke();
  fill(100,80,150);
  ellipse(data.x, data.y,50,50);
}