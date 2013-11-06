
var PI2 = Math.PI * 2.0;
var PIH = Math.PI * 0.5;

var INTERVAL_MS = 20;
var MESSAGE_DURATION_MS = 2000;
var PADDLE_INC = 1 / INTERVAL_MS;
var BALL_INC = 1 / INTERVAL_MS;
var FIELD_WIDTH = 640;
var FIELD_HEIGHT = 480;
var PADDLE_HEIGHT = 10;
var PADDLE_HEIGHT_H = PADDLE_HEIGHT * 0.5;
var PADDLE_WIDTH = 30;
var PADDLE_WIDTH_H = PADDLE_WIDTH * 0.5;
var UPPER_PADDLE_Y = 20;
var UPPER_PADDLE_FACE_Y = UPPER_PADDLE_Y + PADDLE_HEIGHT * 0.5;
var LOWER_PADDLE_Y = FIELD_HEIGHT - UPPER_PADDLE_Y;
var LOWER_PADDLE_FACE_Y = LOWER_PADDLE_Y - PADDLE_HEIGHT * 0.5;
var BALL_RADIUS = 6;
var BALL_RIGHT_BOUNDARY_X = FIELD_WIDTH - BALL_RADIUS;
var BALL_BOTTOM_BOUNDARY_Y = FIELD_HEIGHT - BALL_RADIUS;
var BALL_UPPER_PADDLE_FACE_Y = UPPER_PADDLE_FACE_Y + BALL_RADIUS;
var BALL_LOWER_PADDLE_FACE_Y = LOWER_PADDLE_FACE_Y - BALL_RADIUS;
var FIELD_FILL_STYLE = 'gray';
var PADDLE_STROKE_STYLE = 'black';
var PADDLE_LINE_WIDTH = 2;
var LOWER_PADDLE_FILL_STYLE = 'blue';
var UPPER_PADDLE_FILL_STYLE = 'red';
var BALL_STROKE_STYLE = 'black';
var BALL_LINE_WIDTH = 2;
var BALL_FILL_STYLE = 'yellow';
var CMD_LEFT_DOWN = 'ld';
var CMD_LEFT_UP = 'lu';
var CMD_RIGHT_DOWN = 'rd';
var CMD_RIGHT_UP = 'ru';
var BALL_COLLISION_TOP = 1;
var BALL_COLLISION_LEFT = 2;
var BALL_COLLISION_BOTTOM = 4;
var BALL_COLLISION_RIGHT = 8;
var BALL_COLLISION_UPPER_PADDLE = 16;
var BALL_COLLISION_LOWER_PADDLE = 32;

function getTimeInMs()
{
  var d = new Date();
  var x = d.getTime();
  delete d;
  return x;
}

function mkStateFunc() {
  f = {};
  f.tOffset = 0;
  f.t0 = 0;
  f.tFreeze = 0;
  f.upperPaddleX0 = FIELD_WIDTH/2;
  f.upperPaddleSpeed = 0;
  f.upperPaddleScore = 0;
  f.lowerPaddleX0 = FIELD_WIDTH/2;
  f.lowerPaddleSpeed = 0;
  f.lowerPaddleScore = 0;
  f.ballX0 = FIELD_WIDTH/2;
  f.ballY0 = FIELD_HEIGHT/2;
  f.ballA0 = Math.PI;
  f.ballSpeed = BALL_INC;
  f.tMessageIn = 0;
  f.tMessageOut = 0;
  f.message = '';
  return f;
}

function GameState(t0) {
  this.stateFunc = mkStateFunc();
  this.stateFunc.t0 = t0;
  this.upperPaddleX = this.stateFunc.upperPaddleX0;
  this.lowerPaddleX = this.stateFunc.lowerPaddleX0;
  this.ballX = this.stateFunc.ballX0;
  this.ballY = this.stateFunc.ballY0;
  this.ballCollisionState = 0; // TODO rethink ugly C style bitmaps
  this.ballNewCollisions = 0;
  this.message = '';
  this.tCalc = t0;
}

GameState.prototype.rebaseStateFunc = function(t) {
  var f = this.stateFunc;
  var tx;
  if(f.tFreeze == 0 || f.tFreeze > t) {
    tx = t;
  } else {
    tx = f.tFreeze;
  }
  var dt = tx - f.t0;
  f.upperPaddleX0 += dt * f.upperPaddleSpeed;
  f.lowerPaddleX0 += dt * f.lowerPaddleSpeed;
  f.ballX0 += Math.sin(f.ballA0) * dt * f.ballSpeed;
  f.ballY0 += Math.cos(f.ballA0) * dt * f.ballSpeed;
  f.t0 = t;
  if(f.tMessageOut < tx) {
    f.tMessageIn = 0;
    f.tMessageOut = 0;
    f.message = '';
  }
};

GameState.prototype.setBallToCenter = function() {
  this.stateFunc.ballX0 = FIELD_WIDTH/2;
  this.stateFunc.ballY0 = FIELD_HEIGHT/2;
}

function bounce(axisAngle, moveAngle) {
  return (axisAngle * 2 - moveAngle) % PI2;
}

GameState.prototype.calculateCollisions = function() {
  var currentTouches = 0;
  if(this.ballTouchesLeft()) {
    currentTouches |= BALL_COLLISION_LEFT;
  } else if(this.ballTouchesRight()) {
    currentTouches |= BALL_COLLISION_RIGHT;
  }
  
  if(this.ballTouchesTop()) {
    currentTouches |= BALL_COLLISION_TOP;
  } else if(this.ballTouchesBottom()) {
    currentTouches |= BALL_COLLISION_BOTTOM;
  } else if(this.ballTouchesUpperPaddle()) {
    currentTouches |= BALL_COLLISION_UPPER_PADDLE;
  } else if(this.ballTouchesLowerPaddle()) {
    currentTouches |= BALL_COLLISION_LOWER_PADDLE;
  }
  
  this.ballNewCollisions = currentTouches & ~ this.ballCollisionState;
  this.ballCollisionState = currentTouches;
};

GameState.prototype.calculatePositions = function(t) {
  this.tCalc = t;
  var dt = t - this.stateFunc.t0;
  if(dt < 0) { console.log('t < t0'); dt = 0; }
  this.upperPaddleX = this.stateFunc.upperPaddleX0 + dt * this.stateFunc.upperPaddleSpeed;
  this.lowerPaddleX = this.stateFunc.lowerPaddleX0 + dt * this.stateFunc.lowerPaddleSpeed;
  this.ballX = this.stateFunc.ballX0 + Math.sin(this.stateFunc.ballA0) * dt * this.stateFunc.ballSpeed;
  this.ballY = this.stateFunc.ballY0 - Math.cos(this.stateFunc.ballA0) * dt * this.stateFunc.ballSpeed;
  
  if(this.stateFunc.message != '') {
    if(this.stateFunc.tMessageIn <= t && t < this.stateFunc.tMessageOut) {
      this.message = this.stateFunc.message;
    } else {
      this.message = '';
    }
  } else {
    this.message = '';
  }
};

GameState.prototype.ballTouchesTop = function() {
  return (this.ballY <= BALL_RADIUS);
};

GameState.prototype.ballTouchesLeft = function() {
  return (this.ballX <= BALL_RADIUS);
};

GameState.prototype.ballTouchesBottom = function() {
  return (this.ballY >= BALL_BOTTOM_BOUNDARY_Y);
};

GameState.prototype.ballTouchesRight = function() {
  return (this.ballX >= BALL_RIGHT_BOUNDARY_X);
};

GameState.prototype.ballTouchesUpperPaddle = function() {
  return ((this.ballY <= BALL_UPPER_PADDLE_FACE_Y)
    // TODO dirty
    && ((this.upperPaddleX - PADDLE_WIDTH_H) <= this.ballX)
    && (this.ballX <= (this.upperPaddleX + PADDLE_WIDTH_H)))
    ;
};

GameState.prototype.ballTouchesLowerPaddle = function() {
  return ((this.ballY >= BALL_LOWER_PADDLE_FACE_Y)
    // TODO dirty
    && ((this.lowerPaddleX - PADDLE_WIDTH_H) <= this.ballX)
    && (this.ballX <= (this.lowerPaddleX + PADDLE_WIDTH_H)))
    ;
};

GameState.prototype.handleCollisions = function() {
  var newBallA0 = NaN; // will always be modified upon collision
  var doSetBallToCenter = false;
  var message = '';
  var lowerPaddleScoreInc = 0; 
  var upperPaddleScoreInc = 0;
  
  if((this.ballNewCollisions & BALL_COLLISION_TOP) != 0) {
    lowerPaddleScoreInc++;
    message = '+1 FOR LOWER PADDLE';
    newBallA0 = bounce(PIH, this.stateFunc.ballA0);
    doSetBallToCenter = true;
  } else if((this.ballNewCollisions & BALL_COLLISION_BOTTOM) != 0) {
    upperPaddleScoreInc++;
    message = '+1 FOR UPPER PADDLE';
    newBallA0 = bounce(PIH, this.stateFunc.ballA0);
    doSetBallToCenter = true;
  } else if((this.ballNewCollisions & (BALL_COLLISION_LOWER_PADDLE | BALL_COLLISION_UPPER_PADDLE)) != 0) {
    newBallA0 = bounce(PIH, this.stateFunc.ballA0);
  }
  
  if((this.ballNewCollisions & (BALL_COLLISION_LEFT | BALL_COLLISION_RIGHT)) != 0) {
    newBallA0 = bounce(PI2, this.stateFunc.ballA0);
  }
  
  if(!isNaN(newBallA0)) { // something has happened TODO this smells
    this.rebaseStateFunc(this.tCalc);
    this.stateFunc.ballA0 = newBallA0;
    if(doSetBallToCenter) {
      this.setBallToCenter();
    }
    if(message != '') {
      this.stateFunc.tMessageIn = this.tCalc;
      this.stateFunc.tMessageOut = this.tCalc + MESSAGE_DURATION_MS;
      this.stateFunc.message = message;
    }
    this.stateFunc.lowerPaddleScore += lowerPaddleScoreInc;
    this.stateFunc.upperPaddleScore += upperPaddleScoreInc;
  }
};

// TODO these functions look redundant
GameState.prototype.upperPaddleMoveLeft = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.upperPaddleSpeed = -PADDLE_INC;
};

GameState.prototype.upperPaddleMoveRight = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.upperPaddleSpeed = PADDLE_INC;
};

GameState.prototype.upperPaddleStop = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.upperPaddleSpeed = 0;
};

GameState.prototype.lowerPaddleMoveLeft = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.lowerPaddleSpeed = -PADDLE_INC;
};

GameState.prototype.lowerPaddleMoveRight = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.lowerPaddleSpeed = PADDLE_INC;
};

GameState.prototype.lowerPaddleStop = function(t) {
  this.rebaseStateFunc(t);
  this.stateFunc.lowerPaddleSpeed = 0;
};

GameState.prototype.turn = function(t) {
  this.calculatePositions(t);
  this.calculateCollisions();
  this.handleCollisions();
};

function PingPongClient(ctx) {
  this.ctx = ctx;
  this.state = null;
  this.isUpperPaddle = false; // TODO fetch from connection
  this.intervalId = null;
  var client = this;
  this.turnFunc = function() { client.turn(); };
  this.onkeydownFunc = function(e) { client.onkeydown(e); };
  this.onkeyupFunc = function(e) { client.onkeyup(e); };
}

PingPongClient.prototype.isRunning = function() {
  return this.intervalId !== null;
}

PingPongClient.prototype.start = function() {
  if(this.intervalId !== null) {
    return;
  }
  // TODO connect
  this.state = new GameState(getTimeInMs()); // TODO update state func from connection
  
  window.addEventListener('keydown',this.onkeydownFunc,false);
  window.addEventListener('keyup',this.onkeyupFunc,false);
  this.intervalId = setInterval(this.turnFunc, INTERVAL_MS);
};

PingPongClient.prototype.stop = function() {
  if(this.intervalId === null) {
    return;
  }
  
  // TODO disconnect
  
  clearInterval(this.intervalId);
  this.intervalId = null;
  delete this.state;
  
  window.removeEventListener('keydown',this.onkeydownFunc,false);
  window.removeEventListener('keyup',this.onkeyupFunc,false);
};

PingPongClient.prototype.drawBall = function() {
  this.ctx.setTransform(1,0,0,1,0,0);
  this.ctx.translate(this.state.ballX, this.state.ballY);
  this.ctx.strokeStyle = BALL_STROKE_STYLE;
  this.ctx.lineWidth = BALL_LINE_WIDTH;
  this.ctx.fillStyle = BALL_FILL_STYLE;
  this.ctx.beginPath();
  this.ctx.arc(0,0,BALL_RADIUS,0,PI2,false);
  this.ctx.fill();
  this.ctx.stroke();
  this.ctx.closePath();
};

PingPongClient.prototype.drawPaddle = function(x,y,fillStyle) {
  this.ctx.setTransform(1,0,0,1,0,0);
  this.ctx.translate(x,y);
  this.ctx.strokeStyle = PADDLE_STROKE_STYLE;
  this.ctx.lineWidth = PADDLE_LINE_WIDTH;
  this.ctx.fillStyle = fillStyle;
  this.ctx.fillRect(-PADDLE_WIDTH_H,-PADDLE_HEIGHT_H,PADDLE_WIDTH,PADDLE_HEIGHT);
  this.ctx.strokeRect(-PADDLE_WIDTH_H,-PADDLE_HEIGHT_H,PADDLE_WIDTH,PADDLE_HEIGHT);
};

PingPongClient.prototype.drawStatusBar = function() {
  this.ctx.setTransform(1,0,0,1,0,0);
  this.ctx.fillStyle = 'lightgrey';
  this.ctx.fillRect(0,480,640,20);
  this.ctx.font = '14px serif';
  this.ctx.fillStyle = 'black';
  this.ctx.fillText('Score - Lower Paddle ('+ this.state.lowerPaddleX.toString()+'): '+this.state.stateFunc.lowerPaddleScore.toString()
                    + '  Upper Paddle ('+ this.state.upperPaddleX.toString()+'): '+this.state.stateFunc.upperPaddleScore.toString()
                    + ' Ball (x:'+this.state.ballX.toPrecision(4)+', y:'+this.state.ballY.toPrecision(4)+', coll:'+this.state.ballCollisionState+', newColl:'+this.state.ballNewCollisions+')',2,495);  
};

PingPongClient.prototype.drawMessage = function() {
  if(this.state.message == '') return;
  this.ctx.setTransform(1,0,0,1,0,0);
  this.ctx.font = '48px serif';
  this.ctx.fillStyle = 'white';
  this.ctx.fillText(this.state.message,40,240);
}

PingPongClient.prototype.draw = function() {
  this.ctx.setTransform(1,0,0,1,0,0);
  this.ctx.fillStyle = FIELD_FILL_STYLE;
  this.ctx.fillRect(0,0,FIELD_WIDTH,FIELD_HEIGHT);
  this.drawMessage();
  // draw ball first, so it never overlaps the paddles
  this.drawBall();
  this.drawPaddle(this.state.upperPaddleX, UPPER_PADDLE_Y, UPPER_PADDLE_FILL_STYLE);
  this.drawPaddle(this.state.lowerPaddleX, LOWER_PADDLE_Y, LOWER_PADDLE_FILL_STYLE);
  this.drawStatusBar();
};

PingPongClient.prototype.sendCommand = function(command) {
  // TODO send command
  if(this.isUpperPaddle) {
    switch(command) {
      case CMD_LEFT_DOWN:
        this.state.upperPaddleMoveLeft();
        break;
      case CMD_RIGHT_DOWN:
        this.state.upperPaddleMoveRight();
      case CMD_LEFT_UP:
      case CMD_RIGHT_UP:
        this.state.upperPaddleStop();
        break;
    }
  } else {
    switch(command) {
      case CMD_LEFT_DOWN:
        this.state.lowerPaddleMoveLeft();
        break;
      case CMD_RIGHT_DOWN:
        this.state.lowerPaddleMoveRight();
      case CMD_LEFT_UP:
      case CMD_RIGHT_UP:
        this.state.lowerPaddleStop();
        break;
    }
  }
};

PingPongClient.prototype.onkeyup = function(e) {
  switch(e.keyCode) {
    case 37: // LEFT
      this.sendCommand(CMD_LEFT_UP);
      break;
    case 39: // RIGHT
      this.sendCommand(CMD_RIGHT_UP);
      break;
    // TODO Pause
  }
};

PingPongClient.prototype.onkeydown = function(e) {
  switch(e.keyCode) {
    case 37: // LEFT
      this.sendCommand(CMD_LEFT_DOWN);
      break;
    case 39: // RIGHT
      this.sendCommand(CMD_RIGHT_DOWN);
      break;
    // TODO Pause
  }
};

PingPongClient.prototype.turn = function() {
  var t = getTimeInMs() + this.state.stateFunc.tOffset; // TODO set offset to time difference from server
  this.state.turn(t);
  this.draw();
};
  
function clientMain() {
  var client = new PingPongClient(document.getElementById('pane').getContext('2d'));
  var btnJoin = document.getElementById('btnJoin');
  btnJoin.addEventListener('click', function(e) {
    if(client.isRunning()) {
      client.stop();
      btnJoin.innerHTML = 'Join Game';
    } else {
      client.start();
      btnJoin.innerHTML = 'Exit Game';
    }
  });
  document.getElementById('body').addEventListener('unload', function(e) {
    client.stop();
  });
}