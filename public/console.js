var socket;
var id;
var beatnum;
var consoleid;
var lobbyDiv;
var lobbyUL;
var ringDiv;
var ringUL=null;
var MetaDiv;
var metaULreq, metaULgrant, metaULoffer;

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
  metaDiv=select('#metadata');
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
  var md=data.ringMeta;

  if(ld.size>0){
    var devString;
    if(lobbyUL) lobbyUL.remove();
    lobbyUL=createElement('ul');
    var el=createElement('li',"something");
    el.parent(lobbyUL);
    lobbyUL.parent(lobbyDiv);
    ld.data.forEach(function(dev,i){
      devString=("00"+dev.position).slice(-3)+" "+dev.connection+" "+dev.socket;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(lobbyUL);
    }); 
  }
  if(rd.size>0){
    var devString;
    if(ringUL){ 
      console.log("remove existing UL");
      ringUL.remove();
      ringUL=null;
    }
    ringUL=createElement('ul');
    ringUL.parent(ringDiv);
    rd.data.forEach(function(dev,i){
      devString=("00"+dev.position).slice(-3)+" "+dev.connection+" "+dev.socket;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(ringUL);
    });
  }
  // console.log("Ring Meta Data: ");
   console.log(md);
  if(true){
    var devString;
    if(metaULreq) metaULreq.remove();
    metaULreq=createElement('ul');
    metaULreq.parent(metaDiv);
    var count=createP("number: "+md.requesters.length);
    count.parent(metaDiv);
    md.requesters.forEach(function(r,i){
      devString=r.id+": "+r.device;
      console.log(devString);
      var el=createElement('li',devString);
      el.parent(metaULreq);
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