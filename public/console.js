var socket;
var id;
var beatnum;
var consoleid;

function setup() {
  noCanvas();
  beatnum=select("#heartbeat");
  consoleid=select("#consoleid");
  socket=io.connect('http://localhost:4000');
  socket.on('connect', connected);
  socket.on('id',setID);
  socket.on('disconnect', function(){
    console.log("Disconnected from server ("+socket.id+")");
    button.html("Nothing");
  });
}

function connected(data){
  console.log("Console connected");
  consoleid.html(id);
  socket.on('heartbeat',beat);
  socket.on('consoleData',consoleData);
}

function consoleData(data){
  console.log(data);
}

function setID(data){
  console.log(data.id);
  id=data.id;
  socket.emit('console',{consoleid:id});
  consoleid.html(id);
}

function beat(data){
  beatnum.html(data.beat);
  console.log(data.beat);
}