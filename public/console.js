var socket;
var id;
var beatnum;
var consoleid;
var lobbyDiv;
var lobbyUL;
var ringDiv;
var ringUL;

function setup() {
  noCanvas();
  beatnum=select("#heartbeat");
  consoleid=select("#consoleid");
  socket=io.connect('http://localhost:4000');
  socket.on('connect', connected);
  socket.on('id',setID);
  socket.on('disconnect', function(){
    console.log("Disconnected from server ("+socket.id+")");
  });
  lobbyDiv=select('#lobbydevs');
  ringDiv=select('#ringdevs');
}

function connected(data){
  console.log("Console connected");
  consoleid.html(id);
  socket.on('heartbeat',beat);
  socket.on('consoleData',consoleData);
}

function consoleData(data){
  //console.log(data);
  var ld=data.lobby;
  var rd=data.ring;

  if(ld.size>0){
    var devString;
    if(lobbyUL) lobbyUL.remove();
    lobbyUL=createElement('ul');
    lobbyUL.parent(lobbyDiv);
    ld.data.forEach(function(dev,i){
      devString=("00"+i).slice(-3)+" "+dev.connection+" "+dev.socket;
      console.log(devString);
      var el=createElement('li',devString);
      el.parent(lobbyUL);
    }); 
  }
  if(rd.size>0){
    var devString;
    if(ringUL) ringUL.remove();
    ringUL=createElement('ul');
    ringUL.parent(ringDiv);
    rd.data.forEach(function(dev,i){
      devString=("00"+i).slice(-3)+" "+dev.connection+" "+dev.socket;
      console.log(devString);
      var el=createElement('li',devString);
      el.parent(ringUL);
    });
    
  }

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