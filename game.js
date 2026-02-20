const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let kills = 0;
let soldiers = [];
let enemySoldiers = [];

// Selection
let selecting = false;
let selectStart = null;
let selectedUnits = [];

// Trench setup
const trenches = [
  {x:150, y:100, w:700, h:40, side:'player'},
  {x:150, y:250, w:700, h:40, side:'player'},
  {x:150, y:400, w:700, h:40, side:'player'},
  {x:150, y:550, w:700, h:40, side:'player'},
  {x:150, y:50, w:700, h:40, side:'enemy'},
  {x:150, y:200, w:700, h:40, side:'enemy'},
  {x:150, y:350, w:700, h:40, side:'enemy'},
  {x:150, y:500, w:700, h:40, side:'enemy'},
];

// Free soldiers every 30s
setInterval(()=>{
  for(let i=0;i<10;i++){
    soldiers.push({x:160, y:110 + i*3, type:'soldier', side:'player', hp:100, reload:0, target:null});
  }
},30000);

// Drawing
function drawGrass(){
  ctx.fillStyle = '#4c8c2b';
  ctx.fillRect(0,0,width,height);
  for(let i=0;i<500;i++){
    ctx.strokeStyle = 'rgba(34,139,34,'+Math.random()*0.5+')';
    ctx.beginPath();
    let x = Math.random()*width;
    let y = Math.random()*height;
    ctx.moveTo(x,y);
    ctx.lineTo(x,y+2 + Math.random()*3);
    ctx.stroke();
  }
}

function drawTrenches(){
  trenches.forEach(trench=>{
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(trench.x, trench.y, trench.w, trench.h);
    ctx.strokeStyle = '#654321';
    ctx.strokeRect(trench.x, trench.y, trench.w, trench.h);
  });
}

function drawSoldiers(){
  soldiers.forEach(s=>{
    ctx.fillStyle = selectedUnits.includes(s)?'cyan':'blue';
    if(s.type=='assault') ctx.fillStyle='lightblue';
    ctx.beginPath();
    ctx.arc(s.x,s.y,6,0,Math.PI*2);
    ctx.fill();
  });
  enemySoldiers.forEach(s=>{
    ctx.fillStyle = s.type=='assault'?'orange':'red';
    ctx.beginPath();
    ctx.arc(s.x,s.y,6,0,Math.PI*2);
    ctx.fill();
  });
}

// Mouse selection & movement
canvas.addEventListener('mousedown', e=>{
  selecting = true;
  selectStart = {x:e.offsetX, y:e.offsetY};
});
canvas.addEventListener('mousemove', e=>{
  if(selecting){
    render();
    ctx.strokeStyle='yellow';
    ctx.strokeRect(selectStart.x, selectStart.y, e.offsetX - selectStart.x, e.offsetY - selectStart.y);
  }
});
canvas.addEventListener('mouseup', e=>{
  if(selecting){
    selecting = false;
    selectedUnits = soldiers.filter(s=>{
      return s.x>=Math.min(selectStart.x,e.offsetX) &&
             s.x<=Math.max(selectStart.x,e.offsetX) &&
             s.y>=Math.min(selectStart.y,e.offsetY) &&
             s.y<=Math.max(selectStart.y,e.offsetY);
    });
  } else if(selectedUnits.length>0){
    selectedUnits.forEach(s=>{
      s.target = {x:e.offsetX, y:e.offsetY};
    });
  }
});

// Soldier movement
function updateSoldiers(){
  soldiers.forEach(s=>{
    if(s.target){
      let dx = s.target.x - s.x;
      let dy = s.target.y - s.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist>1){ s.x += dx/dist * 1.5; s.y += dy/dist * 1.5; } else s.target=null;
    }
  });
  // Enemy AI: defend nearest trench
  enemySoldiers.forEach(s=>{
    if(!s.target){
      let myTrenches = trenches.filter(t=>t.side=='enemy');
      let trench = myTrenches[Math.floor(Math.random()*myTrenches.length)];
      s.target = {x:trench.x+trench.w/2, y:trench.y+trench.h/2};
    } else {
      let dx = s.target.x - s.x;
      let dy = s.target.y - s.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist>1){ s.x += dx/dist * 1.2; s.y += dy/dist * 1.2; } else s.target=null;
    }
  });
}

// Game loop
function render(){
  drawGrass();
  drawTrenches();
  drawSoldiers();
  document.getElementById('kills').innerText = kills;
  updateSoldiers();
  requestAnimationFrame(render);
}
render();

// Buy functions
function buySoldier(){ soldiers.push({x:160, y:110, type:'soldier', side:'player', hp:100, reload:0, target:null}); }
function buyAssault(){ if(kills>=2){ kills-=2; soldiers.push({x:160,y:120,type:'assault',side:'player',hp:100,reload:0,target:null}); } }
function buyCommander(){ soldiers.push({x:160,y:140,type:'commander',side:'player',hp:100,reload:0,target:null}); }
function buyFlamethrower(){ if(kills>=5){ kills-=5; soldiers.push({x:160,y:160,type:'flamethrower',side:'player',hp:100,reload:0,target:null}); } }
function buyMachineGun(){ if(kills>=10){ kills-=10; soldiers.push({x:160,y:180,type:'machine',side:'player',hp:100,reload:0,target:null}); } }
function buyTank(){ if(kills>=60){ kills-=60; soldiers.push({x:160,y:200,type:'tank',side:'player',hp:300,reload:0,target:null}); } }
function buyArtillery(){ if(kills>=0){ soldiers.push({x:160,y:220,type:'artillery',side:'player',hp:150,reload:60,target:null}); } }

// Spawn enemy soldiers randomly every 10s
setInterval(()=>{
  for(let i=0;i<5;i++){
    enemySoldiers.push({x:800, y:60+i*30, type:'soldier', side:'enemy', hp:100, reload:0, target:null});
  }
},10000);
