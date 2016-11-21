var socket;
var id;
var beatnum;
var consoleid;
var lobbyDiv;
var lobbyUL;
var ringDiv;
var ringUL=null;
var MetaDiv;
var metaULreq, metaULgrant, metaULoffer, metaBlobs;

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
  console.log(data);
  var ld=data.lobby;
  var rd=data.ring;
  var md=data.ringMeta;
  var bd=data.blobMeta;

  //var lobbyList=selectAll('li',lobbyUL);
  //lobbyList.forEach(function(){});

  if(true){
    var devString;
    if(!lobbyUL) {
      lobbyUL=createElement('ul');
      var el=createElement('li',"something");
      el.parent(lobbyUL);
      lobbyUL.parent(lobbyDiv);
    }
    var lobbyList=selectAll('li',lobbyUL);
    lobbyList.forEach(function(li){
      li.remove();
    });
    ld.data.forEach(function(dev,i){
      devString=("00"+dev.position).slice(-3)+" "+dev.connection+" "+dev.socket;
      var el=createElement('li',devString);
      el.parent(lobbyUL);
    });
  }
  if(true){
    var devString;
    if(!ringUL){ 
      ringUL=createElement('ul');
      var el=createElement('li',"something");
      el.parent(ringUL);
      ringUL.parent(ringDiv);
    }
    var ringList=selectAll('li',ringUL);
    ringList.forEach(function(li){
      li.remove();
    });
    rd.data.forEach(function(dev,i){
      devString=("00"+dev.position).slice(-2)+" "+dev.connection+" "+dev.socket;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(ringUL);
    });
  }
  // console.log("Ring Meta Data: ");
   //console.log(md);
  if(true){
    var devString;
    if(!metaULreq){
      metaULreq=createElement('ul');
      metaULreq.parent(metaDiv);ß
    }
    var count=select('p',metaULreq);
    if(!count) {
      count=createP("");
      count.parent(metaULreq);
    } 
    count.html("Attach Requests #: "+md.requesters.length);
    var metaReqList=selectAll('li',metaULreq);
    metaReqList.forEach(function(li){
      li.remove();
    });
    md.requesters.forEach(function(r,i){
      devString=r.id+": "+r.device+" , "+r.active;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(metaULreq);
    });

    if(!metaULgrant){
      metaULgrant=createElement('ul');
      metaULgrant.parent(metaDiv);
    }
    var count=select('p',metaULgrant);
    if(!count) {
      count=createP("");
      count.parent(metaULgrant);
    } 
    count.html("Attach Grants #: "+md.grants.length);
    var metaGrantList=selectAll('li',metaULgrant);
    metaGrantList.forEach(function(li){
      li.remove();
    });
    md.grants.forEach(function(g,i){
      devString=i+": "+g.device+" , "+g.active;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(metaULgrant);
    });
    if(!metaULoffer){
      metaULoffer=createElement('ul');
      metaULoffer.parent(metaDiv);
    }
    count=select('p',metaULoffer);
    if(!count) {
      count=createP("");
      count.parent(metaULoffer);
    }
    count.html("Attach Offers #: "+md.offers.length);
    var metaOfferList=selectAll('li',metaULoffer);
    metaOfferList.forEach(function(li){
      li.remove();
    });
    md.offers.forEach(function(o,i){
      devString=o.id+", prev:"+o.prev+", next:"+o.next+", active:"+o.active;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(metaULoffer);
    });

    if(!metaBlobs){
      metaBlobs=createElement('ul');
      metaBlobs.parent(metaDiv);
    }
    count=select('p',metaBlobs);
    if(!count) {
      count=createP("");
      count.parent(metaBlobs);
    }
    count.html("Active Blobs #: "+bd.length);
    var blobList=selectAll('li',metaBlobs);
    blobList.forEach(function(li){
      li.remove();
    });
    bd.forEach(function(b,i){
      devString=b.id+", x:"+floor(b.x)+", y"+floor(b.y)+", ttl:"+b.ttl;
      //console.log(devString);
      var el=createElement('li',devString);
      el.parent(metaBlobs);
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