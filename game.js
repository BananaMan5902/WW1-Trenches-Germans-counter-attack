const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let kills = 0;
let playerUnits = [];
let enemyUnits = [];
let bullets = [];

let selecting = false;
let selectStart = null;
let selectedUnits = [];

/* ---------- MAP + TRENCHES ---------- */

const trenches = [
  {x:200, y:150, w:800, h:50, side:"enemy"},
  {x:200, y:650, w:800, h:50, side:"player"}
];

function drawGround() {
  ctx.fillStyle = "#4a463f";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Mud texture
  for(let i=0;i<3000;i++){
    ctx.fillStyle = "rgba(60,55,48," + Math.random()*0.2 + ")";
    ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2,2);
  }
}

function drawTrenches() {
  trenches.forEach(t=>{
    // dirt
    ctx.fillStyle = "#5a3e2b";
    ctx.fillRect(t.x,t.y,t.w,t.h);

    // sandbags top edge
    for(let i=0;i<t.w;i+=20){
      ctx.fillStyle = "#9c8b6b";
      ctx.fillRect(t.x+i, t.y-10, 15, 10);
    }
  });
}

/* ---------- UNITS ---------- */

function createUnit(x,y,side){
  return {
    x,y,
    side,
    hp:100,
    reload:0,
    target:null
  }
}

// Spawn initial
for(let i=0;i<8;i++){
  playerUnits.push(createUnit(300+i*30,700,"player"));
  enemyUnits.push(createUnit(300+i*30,175,"enemy"));
}

/* ---------- DRAW UNITS ---------- */

function drawUnit(u){
  ctx.save();
  ctx.translate(u.x,u.y);

  // body
  ctx.fillStyle = u.side==="player" ? "#556b2f" : "#6b2f2f";
  ctx.beginPath();
  ctx.arc(0,0,6,0,Math.PI*2);
  ctx.fill();

  // helmet
  ctx.fillStyle = "#222";
  ctx.fillRect(-6,-6,12,4);

  ctx.restore();
}

function drawUnits(){
  playerUnits.forEach(drawUnit);
  enemyUnits.forEach(drawUnit);
}

/* ---------- SHOOTING ---------- */

function shoot(attacker, target){
  bullets.push({
    x: attacker.x,
    y: attacker.y,
    tx: target.x,
    ty: target.y,
    side: attacker.side
  });
}

function updateBullets(){
  bullets.forEach(b=>{
    let dx = b.tx - b.x;
    let dy = b.ty - b.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if(dist>2){
      b.x += dx/dist*6;
      b.y += dy/dist*6;
    }
  });

  bullets.forEach((b,i)=>{
    let enemies = b.side==="player" ? enemyUnits : playerUnits;
    enemies.forEach((u,ui)=>{
      if(Math.hypot(u.x-b.x,u.y-b.y)<6){
        let inTrench = trenches.some(t=> 
          u.x>t.x && u.x<t.x+t.w &&
          u.y>t.y && u.y<t.y+t.h
        );

        let damage = inTrench ? 10 : 20; // 50% cover
        u.hp -= damage;

        if(u.hp<=0){
          enemies.splice(ui,1);
          if(b.side==="player") kills++;
        }

        bullets.splice(i,1);
      }
    });
  });
}

function drawBullets(){
  ctx.fillStyle="black";
  bullets.forEach(b=>{
    ctx.fillRect(b.x,b.y,2,2);
  });
}

/* ---------- AI ---------- */

function updateAI(){
  enemyUnits.forEach(e=>{
    let nearest = playerUnits[0];
    let minDist = 9999;
    playerUnits.forEach(p=>{
      let d = Math.hypot(p.x-e.x,p.y-e.y);
      if(d<minDist){ minDist=d; nearest=p; }
    });

    if(minDist<250 && e.reload<=0){
      shoot(e,nearest);
      e.reload=60;
    }

    if(e.reload>0) e.reload--;
  });
}

/* ---------- PLAYER ---------- */

canvas.addEventListener("mousedown", e=>{
  selecting=true;
  selectStart={x:e.offsetX,y:e.offsetY};
});

canvas.addEventListener("mouseup", e=>{
  if(selecting){
    selectedUnits = playerUnits.filter(u=>{
      return u.x>Math.min(selectStart.x,e.offsetX) &&
             u.x<Math.max(selectStart.x,e.offsetX) &&
             u.y>Math.min(selectStart.y,e.offsetY) &&
             u.y<Math.max(selectStart.y,e.offsetY);
    });
  }
  selecting=false;
});

canvas.addEventListener("click", e=>{
  selectedUnits.forEach(u=>{
    u.target={x:e.offsetX,y:e.offsetY};
  });
});

function updatePlayer(){
  playerUnits.forEach(u=>{
    if(u.target){
      let dx=u.target.x-u.x;
      let dy=u.target.y-u.y;
      let dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>2){
        u.x+=dx/dist*1.2; // slower realistic speed
        u.y+=dy/dist*1.2;
      }
    }

    // auto shoot
    let nearest = enemyUnits[0];
    let minDist = 9999;
    enemyUnits.forEach(e=>{
      let d=Math.hypot(e.x-u.x,e.y-u.y);
      if(d<minDist){ minDist=d; nearest=e;}
    });

    if(minDist<250 && u.reload<=0){
      shoot(u,nearest);
      u.reload=60;
    }
    if(u.reload>0) u.reload--;
  });
}

/* ---------- GAME LOOP ---------- */

function loop(){
  drawGround();
  drawTrenches();
  updatePlayer();
  updateAI();
  updateBullets();
  drawUnits();
  drawBullets();

  document.getElementById("kills").innerText=kills;

  requestAnimationFrame(loop);
}

loop();
