var socket;
var id;
var posX=0;
var count=0;
var connectionStatus=0; //0=connected, 1=unattached, 2=attached
var button, attachButton, detachButton, permitButton, statusMessage, position, idnum;
var metaDiv;
var geometry;
var offersDiv;
var offersList;
var offers=[];
var dataRefresh;
var clicks=[];
var myWidth=400;
var devHeight=200;
var myStartX=null;
var myEndX=null;
var myBlobs=new MyBlobs();
var statusBar;
var hideMeta=false;

var noisePerWorldPixel=0.005;
var noiseSegsX=20;
var noiseField;
var attached=false;
var currentBeat; //heartbeat received from server




function setup() {
  createCanvas(400,200);
  statusBar=new StatusBar();
  metaDiv=select('#meta');
  button = select('#join');
  attachButton = select('#attach');
  attachButton.hide();
  detachButton = select('#detach');
  detachButton.hide();
  permitButton = select('#permit');
  permitButton.hide();
  statusMessage = select('#status');
  geometry = select('#geometry');
  position = select('#position');
  offersDiv = select('#attach_offers');
  offersDiv.html('My Offers');
  idnum = select('#idnum');
  socket=io.connect('http://192.168.0.5:4000');
  socket.on('connect', connected);
  socket.on('id',setID);
  socket.on('disconnect', function(){
    console.log("Disconnected from server ("+socket.id+")");
    button.html("Nothing");
  });
  noiseField=new NoiseField();
  //noiseField.setField(myWidth, myStartX, noiseSegsX, noisePerWorldPixel);

  dataRefresh=setInterval(dataRefreshPoll, 1000);
}

function draw() {
  background(80);
  if(attached){
    noiseField.show();
    noiseField.update();
  }
  runClicks();
  myBlobs.run();
  statusBar.show();
  statusBar.run();
  if(frameCount%30===0){ //assume slower framerate
    //console.log("send echo beat: "+currentBeat);
    socket.emit('echo',{device: id, beat: currentBeat});
  }
}


function mouseClicked(){
  if(mouseX>=0 &&
    mouseX<=width &&
    mouseY>=0 &&
    mouseY<=height){
      newClick(mouseX+myStartX, mouseY);
  }
}

function notouchStarted(){
  if(mouseX>=0 &&
    mouseX<=width &&
    mouseY>=0 &&
    mouseY<=height){
      newClick(mouseX+myStartX, mouseY);
  }
}

function keyPressed(){
  if(key=='h' || key=='H'){
    hideMeta=!hideMeta;
  }
  if(hideMeta) metaDiv.hide();
  else metaDiv.show();
}


function dataRefreshPoll(){
  offers.forEach(function(o){
    console.log("Offer "+o.id+" expires in "+floor((o.expires-Date.now())/1000));
  });
  //remove expired offer
  checkOffers();
  renderOffers();
  // myBlobs.run();
}

function connected(){
  console.log("Connected ("+socket.id+")");
  statusMessage.html("Connected");
  // geometry.html("Width ${myWidth} startX:${myStartX} endX:${myEndX}");
  geometry.html("Width "+myWidth+" startX:"+myStartX+" endX:"+myEndX);
  button.mouseClicked(joinMe);
  attachButton.mouseClicked(attachMe);
//  socket.on('blob', incomingBlob);
  socket.on('heartbeat',beat);
  socket.on('rfpermit',requestForPermit);
  socket.on('attached',attachedToRing);
  socket.on('offer',processOffer);
  socket.on('ringpos',updateRingPos);
  socket.on('startX', setStartX);
  socket.on('blobData',handleBlobData);
  socket.on('notifyAttached',notifyAttached);
  socket.on('notifyDetached',notifyDetached);
}

function notifyAttached(){
  statusBar.trigger('attached',5);
}

function handleBlobData(data){
  console.log("Incoming blob data "+data.blobs.length);
  // if(data.blobs.length>0) console.log(data.blobs[0].id+" "+data.blobs[0].x);
  processBlobData(data.blobs);
}

function processBlobData(blobs){
  blobs.forEach(function(blob){
    //check if blob is in our patch
    if(blob.x>=myStartX && blob.x<myEndX){
      //check if we know about this blob
      if(!myBlobs.exists(blob)){
        //if not create it
        myBlobs.addBlob(blob);
        console.log("Blob entered my patch "+blob.id+" x:"+blob.x+" S:"+myStartX+" E:"+myEndX);
      }
      //if we do then just run it
    }
  });
}

function setStartX(data){
  console.log("new StartX Pre: "+myStartX+" "+myEndX);
  if(data.sx!==null){
    myStartX=data.sx;
    myEndX=myStartX+myWidth;
  } else {
    myStartX=null;
    myEndX=null;
  }
  geometry.html("Width "+myWidth+" startX:"+myStartX+" endX:"+myEndX);
  console.log("new StartX post: "+myStartX+" "+myEndX);
  noiseField.calcOffset(myStartX);
}

function updateRingPos(data){
  position.html(data.pos);
}

function processOffer(data){
  var offerTemp={
    id: data.id,
    prev: data.prev,
    next: data.next,
    expires: data.expires
    //button: acceptOfferButton
  };
  offers.push(offerTemp);
  //should really clean up and recreate this each time
  console.log("Offer "+data.id+" received, between: "+data.prev+","+data.next);
  // if(!offersList){
  //   console.log("create offers list");
  //   offersList=createElement('ul');
  //   offersList.parent(offersDiv);
  // }
  // var offerString="Offer to attach between "+data.prev+" and "+data.next+" expires in:"+(data.expires-Date.now());
  // var li=createElement('li');
  // li.parent(offersList);
  // var el=createP(offerString);
  // var acceptOfferButton=createButton("accept offer");
  // li.child(el);
  // li.child(acceptOfferButton);
  // acceptOfferButton.mouseClicked(handleAcceptOffer);
  // acceptOfferButton.attribute("data-offer",data.id);
  statusBar.trigger("offer");
}

function checkOffers(){
  for(var i=offers.length-1; i>=0; i--){
    if((offers[i].expires-Date.now())<10){
      offers.splice(i,1);
    }
  }
}

function renderOffers(){
  if(!offersList){
    console.log("create offers list");
    offersList=createElement('ul');
    offersList.parent(offersDiv);
  }
  var oListTemp=selectAll('li',offersList);
  oListTemp.forEach(function(li){
    li.remove();
  });
  offers.forEach(function (offer){
    var offerString="Offer to attach between "+offer.prev+" and "+offer.next+" expires in:"+(offer.expires-Date.now());
    var li=createElement('li');
    li.parent(offersList);
    var el=createP(offerString);
    var acceptOfferButton=createButton("accept offer");
    li.child(el);
    li.child(acceptOfferButton);
    acceptOfferButton.mouseClicked(handleAcceptOffer);
    acceptOfferButton.attribute("data-offer",offer.id);
  });

}


function handleAcceptOffer(){
  console.log("Accept Offer");
  // console.log("Accect button text: ");
  // console.log("b:"+this.html());
  // console.log("b id:"+this.attribute("data-offer"));
  // console.log(offers.length);
  // console.log(offers);
  var offer;
  var buttonOfferID=parseInt(this.attribute("data-offer"));
  //find offer assocaited with the clicked button
  offers.forEach(function(o){
    //console.log("o:"+o.button.html());
    //console.log("o id:"+this.attribute("data-offer"));
    if(o.id===buttonOfferID) {
      // console.log("it's a match "+o.id+" "+buttonOfferID);
      offer=o;
      // console.log(offer);
    } else {
      // console.log("not a match "+o.id+" "+buttonOfferID);
    }
  });
  //process clicked offer
  console.log("Offer accepted "+offer.id);
  this.html("Accepted");
  socket.emit("offerAccepted",{offer:offer.id, device:id});
  statusBar.trigger("accept");
}

function attachedToRing(data){
  console.log("Successfully attached to ring: "+data.ring);
  statusMessage.html('Attached to Ring '+data.ring);
  // attachButton.html('detach');
  detachButton.show();
  attachButton.hide();
  permitButton.show();
  detachButton.mouseClicked(detachFromRing);
  permitButton.mouseClicked(permitAttacher);
  statusBar.trigger("attach");
  attached=true;
  noiseField.setField(myWidth, myStartX, noiseSegsX, noisePerWorldPixel);
  attachedFrame=frameCount;
}

function detachFromRing(){
  console.log("Requested detach");
  socket.emit('detach',{id:id});
  processDetach();
}

function notifyDetached(){
  processDetach();
}

function processDetach(){
  statusBar.trigger("detach");
  statusMessage.html('Joined, but detached');
  // attachButton.html('detach');
  detachButton.hide();
  permitButton.hide();
  attachButton.show();
  geometry.html("Width "+myWidth);
  attached=false;
  console.log("Been detached");
}

function permitAttacher(){
  console.log("Permit Attacher");
  socket.emit('permit',{id:id});
  statusBar.trigger("grant");
}

function setID(data){
  id=data.id;
  idnum.html(id);
  console.log("My ID="+id);
}

function requestForPermit(){
  console.log("received request for attach permit from ring");
  statusBar.trigger("permit");
}

function joinMe(){
  if(connectionStatus===0){
    button.html('un-Join');
    connectionStatus=1;
    statusMessage.html('Joined');
    socket.emit('join',{id: id, width:myWidth});
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
  statusBar.trigger("request");
}

// function incomingBlob(data){
// 	//console.log("incoming "+data);
// 	noFill();
//   stroke(100,80,60);
//   ellipse(data.x, height/4,10,10);
// }

function beat(data){
  console.log(data.beat);
  currentBeat=data.beat;
  //send back echo of the hearbeat to show I'm still listening
  //socket.emit('echo',{device: id, beat: data.beat});
  // syncTime=Date.now();
  // noiseField.syncOffset();
}

function runClicks(){
  for(var i=clicks.length-1; i>=0; i--){
    clicks[i].show();
    if(!clicks[i].update()) clicks.splice(i,1);
  }
}

function newClick(x,y){
  var c=new Click(x,y);
  clicks.push(c);
  statusBar.trigger("blob");
  socket.emit("newBlob",{device:id, x:x, y:y});
}

function Click(x,y){
  var r=5;
  var rInc=1;
  var alpha=255;
  var ttl=600;

  this.show=function(){
    push();
    translate(x,y);
    stroke(200,20,20, alpha);
    strokeWeight(5);
    noFill();
    ellipse(0,0,r*2,r*2);
    strokeWeight(2);
    ellipse(0,0,r,r);
    pop();
  };

  this.update=function(){
    r+=rInc;
    ttl--;
    alpha=map(ttl,100,0,255,20);
    return ttl>0;
  };
}

function MyBlobs(){
  blobs=[];

  this.addBlob=function(data){
    var b=new Blob(data);
    blobs.push(b);
  };

  this.exists=function(data){
    return blobs.find(function(blob){
      return data.id===blob.id;
    });
  };

  this.run=function(){
    for(var i=blobs.length-1; i>=0; i--){
      blobs[i].show();
      if(!blobs[i].update()){
        blobs.splice(i,1);
      }
    }
  };

  function Blob(data){
    this.id=data.id;
    this.ttl=data.ttl;
    this.x=data.x;
    this.y=data.y;
    this.pos=createVector(this.x,this.y);
    this.vel=createVector(1,0);
    this.prevailing=createVector(1,0);


    this.show=function(){
      push();
      translate(this.x-myStartX, this.y);
      stroke(255,0,150);
      if(this.ttl>100){
        fill(0,255,150);
      } else {
        fill(255,0,0);
      }
      ellipse(0,0,30,30);
      pop();
    };

    this.update=function(){
      this.pos=createVector(this.x,this.y);
      var acc=p5.Vector.fromAngle(random(-PI, PI));
      this.vel.add(acc);
      this.vel.add(this.prevailing);
      this.vel.limit(4);
      this.pos.add(this.vel);
      this.x=this.pos.x;
      this.y=this.pos.y;
      this.x+=1;
      this.ttl--;
      if(this.x>=myEndX || this.x<myStartX){
        console.log("blob "+this.id+" just exited");
        socket.emit('blobUpdate',{id:this.id, x:this.x, y:this.y, ttl:this.ttl});
      }
      if(this.y<0) this.y=height;
      if(this.y>height) this.y=0;
      if(this.ttl%30<1) socket.emit('blobUpdate',{id:this.id, x:this.x, y:this.y, ttl:this.ttl});
      return this.x>=myStartX && this.x<myEndX && this.ttl>0;
    };
  }
}

function StatusBar(){
  this.flashes=0;
  this.x=0;
  this.y=0;
  this.w=width;
  this.h=height;
  this.thick=50;
  this.thickStep=this.thick/5;
  var ttlMax=60;
  this.ttl=0;
  var r=20;
  var g=225;
  var b=100;
  var alpha=255;
  var statusColors={
    request: {r: 20, g:80, b:255 },
    permit: {r: 255, g:20, b:150 },
    grant: {r: 125, g:20, b:255 },
    offer: {r: 255, g:130, b:0 },
    accept: {r: 255, g:230, b:0 },
    accepted: {r: 0, g:255, b:50 },
    attach: {r: 0, g:180, b:0 },
    detach: {r: 255, g:0, b:0 },
    attached: {r: 0, g:180, b:0 },
    blob: {r: 200, g:80, b:20 },
    none: {r: 0, g:0, b:0 }
  };

  this.run=function(){
    if(this.ttl>0){
      this.ttl--;
    } else {
      if(this.flashes>0){
        this.flashes--;
        this.ttl=ttlMax;
      }
    }
  };

  this.trigger=function(trigKey, count){
    this.flashes=count||0;
    this.ttl=ttlMax;
    if(!statusColors[trigKey]){
      trigKey="none";
    }
    r=statusColors[trigKey].r;
    g=statusColors[trigKey].g;
    b=statusColors[trigKey].b;
  };

  this.show=function(){
    if(this.ttl>0){
      for(var i=0; i<5; i++){
        alpha=map(this.ttl,ttlMax,0,(5-i)*50,50);
        noFill();
        stroke(r,g,b,alpha);
        strokeWeight(this.thickStep);
        rect(this.x+this.thickStep*(i+0.5),this.y+this.thickStep*(i+0.5),this.w-this.thickStep*(i+0.5)*2, this.h-this.thickStep*(i+0.5)*2);
        strokeWeight(1);
      }
    }
  };
}

// noisePerWorldPixel=0.0005;
// var noiseSegsX=20;

function NoiseField(){
  var step,w,h;
  var noiseOffX=0;
  var noiseOffY=0;
  var field=[];
  var shiftXinc=0.01;
  var shiftYinc=0.001;
  var shiftX=0;
  var shiftY=0;
  var noiseSyncFrame=frameCount;

  this.setField=function(devWidth, startX, noiseSegsX, noisePerWorldPixel){
    step=floor(devWidth/noiseSegsX);
    w=noiseSegsX;
    h=floor(devHeight/step);
    noiseOffX=startX*noisePerWorldPixel;
    noiseSeed(10);
    generate();
    console.log("field offset" +noiseOffX);
  };

  this.update=function(){
    //shiftX+=shiftXinc;
    //shiftY+=shiftYinc;
    shiftX=(frameCount-noiseSyncFrame)*shiftXinc;
    generate();
  };

  function generate(){
    for(var y=0; y<h; y++){
      var noiseRow=[];
      for(var x=0; x<w; x++){
        noiseRow[x]=noise(shiftX+noiseOffX+x*step*noisePerWorldPixel,shiftY+noiseOffY+y*step*noisePerWorldPixel);
      }
      field[y]=noiseRow;
    }
  }

  this.syncOffset=function(){
    shiftX=0;
    shiftY=0;
  };

  this.calcOffset=function(startX){
    noiseSyncFrame=frameCount;
    noiseOffX=startX*noisePerWorldPixel;
  };

  this.show=function(){
    for(var y=0; y<field.length; y++){
      for(var x=0; x<field[y].length; x++){
        fill(map(field[y][x],0,1,0,255),150);
        noStroke();
        rect(x*step, y*step,step,step);
      }
    }
  };
}