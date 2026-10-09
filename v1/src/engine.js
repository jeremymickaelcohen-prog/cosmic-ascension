// Nouveau moteur indépendant du prototype, vérifiable sans navigateur.
// @ts-check
export const Game = (function makeGame(){
  "use strict";
  const MATERIALS={energy:"Énergie",wood:"Bois",stone:"Pierre",science:"Science",copper:"Cuivre",tin:"Étain",bronze:"Bronze",iron:"Fer",coal:"Charbon",steel:"Acier",circuits:"Circuits",uranium:"Uranium",titanium:"Titane",fusion:"Plasma de fusion",regolith:"Régolithe",stellar:"Matière stellaire",antimatter:"Antimatière",exotic:"Matière exotique"};
  const AGE_ROWS=[
    ["Pierre","wood","Ramasseurs",null],["Cuivre","copper","Mine de cuivre",null],["Bronze","bronze","Fonderie de bronze",{copper:.2,tin:.2}],
    ["Fer","iron","Mine de fer",null],["Mécanique","coal","Charbonnage",null],["Industriel","steel","Haut-fourneau",{iron:.2,coal:.2}],
    ["Électrique","circuits","Atelier électrique",{copper:.2,iron:.2}],["Atomique","uranium","Mine d'uranium",null],
    ["Numérique","circuits","Fabrique de microprocesseurs",{copper:.12,iron:.12}],["Spatial","titanium","Mine de titane",null],
    ["Planétaire","fusion","Confinement de fusion",{uranium:.15,titanium:.15}],["Interplanétaire","regolith","Extracteur lunaire",null],
    ["Stellaire","stellar","Usine photosphérique",{regolith:.12,titanium:.12}],["Interstellaire","antimatter","Synthétiseur d'antimatière",{stellar:.12,fusion:.12}],
    ["Galactique","exotic","Forge exotique",{stellar:.1,antimatter:.1}]
  ];
  const AGES=AGE_ROWS.map((r,i)=>({index:i,name:r[0],resource:r[1],factory:r[2],inputs:r[3]}));
  const RESOURCE_IDS=Object.keys(MATERIALS);
  const BUILDINGS=[];
  function add(id,age,name,resource,rate,price,inputs=null){
    BUILDINGS.push({id,age,name,resource,rate,price,inputs,growth:1.18});
  }
  const ENERGIES=["Feu de camp","Fours au cuivre","Foyers de bronze","Forge au fer","Moulin hydraulique","Turbine à vapeur","Centrale électrique","Réacteur nucléaire","Réseau de puissance IA","Capteurs orbitaux","Réacteur de fusion","Centrale lunaire","Essaim de Dyson","Collecteur stellaire","Réseau galactique"];
  for(const a of AGES){
    const i=a.index,price=Math.ceil(16*Math.pow(4.1,i));
    add("power-"+i,i,ENERGIES[i],"energy",.8*Math.pow(3.9,i),price);
    if(!i){
      add("wood-0",0,"Camp de bûcherons","wood",.65,22);
      add("stone-0",0,"Carrière primitive","stone",.5,29);
    }else add("matter-"+i,i,a.factory,a.resource,.48*Math.pow(2.5,i),price*1.3,a.inputs);
    if(i===2)add("tin-2",2,"Mine d'étain","tin",6,price);
    add("lab-"+i,i,["Feu et observation","Scribes du cuivre","Savoirs métallurgiques","Académie des forges","Atelier des ingénieurs","Institut industriel","Laboratoire électrique","Institut atomique","Laboratoire informatique","Observatoire orbital","Institut planétaire","Station lunaire","Cerveau de Matrioshka","Centre stellaire","Intelligence galactique"][i],"science",.5*Math.pow(4.4,i),price*2.4);
  }
  const BUILDING_MAP=Object.fromEntries(BUILDINGS.map(b=>[b.id,b]));
  const BRANCHES=["energy","industry","science","click","cost"];
  const BRANCH_LABELS={energy:"Énergie",industry:"Industrie",science:"Sciences",click:"Récolte",cost:"Ingénierie"};
  const TECHS=AGES.flatMap(a=>BRANCHES.map((branch,n)=>({id:`${branch}-${a.index}`,age:a.index,branch,name:`${BRANCH_LABELS[branch]} : ${a.name}`,cost:Math.ceil(9*Math.pow(4.9,a.index)*(n+1)),description:branch==="cost"?"Coût des infrastructures −5 %":branch==="click"?"Récolte manuelle +50 %":`Rendement ${BRANCH_LABELS[branch].toLowerCase()} +25 %`})));
  const TECH_MAP=Object.fromEntries(TECHS.map(t=>[t.id,t]));
  const safe=n=>Number.isFinite(n)&&n>=0&&n<=1e290;
  const clone=s=>({...s,resources:{...s.resources},buildings:{...s.buildings},researched:[...s.researched],upgrades:{...s.upgrades}});
  const blank=()=>Object.fromEntries(RESOURCE_IDS.map(k=>[k,0]));
  function newGame(){return {version:1,age:0,resources:blank(),buildings:{},researched:[],runEnergy:0,totalEnergy:0,ascensions:0,knowledge:0,upgrades:{energy:0,science:0,click:0,cost:0},systems:0,won:false,dev:false,devSpeed:1,lastSeen:Date.now()};}
  function validate(s){
    return !!s&&s.version===1&&Number.isInteger(s.age)&&s.age>=0&&s.age<15&&
      RESOURCE_IDS.every(k=>safe(s.resources?.[k]))&&
      Object.entries(s.buildings||{}).every(([id,n])=>!!BUILDING_MAP[id]&&BUILDING_MAP[id].age<=s.age&&Number.isInteger(n)&&n>=0&&n<=1000000)&&
      Array.isArray(s.researched)&&s.researched.every(id=>!!TECH_MAP[id]&&TECH_MAP[id].age<=s.age)&&
      ["energy","science","click","cost"].every(k=>Number.isInteger(s.upgrades?.[k])&&s.upgrades[k]>=0&&s.upgrades[k]<=30)&&
      ["runEnergy","totalEnergy","knowledge","lastSeen"].every(k=>safe(s[k]))&&
      Number.isInteger(s.systems)&&s.systems>=0&&s.systems<=10000&&Number.isInteger(s.ascensions)&&s.ascensions>=0&&
      typeof s.won==="boolean"&&typeof s.dev==="boolean"&&[1,10,100,1000].includes(s.devSpeed);
  }
  function bonus(s,kind){
    const count=s.researched.reduce((x,id)=>x+(TECH_MAP[id].branch===kind?1:0),0);
    const t=kind==="click"?1.5:kind==="cost"?.95:1.25;
    const u=kind==="click"?1.12:kind==="cost"?.98:1.08;
    return Math.pow(t,count)*Math.pow(u,s.upgrades[kind]||0);
  }
  function harvest(s,id){
    if(!["energy","wood","stone"].includes(id)||s.won)return s;
    const n=clone(s),amount=Math.max(1,Math.floor(Math.pow(1.32,n.age)*bonus(n,"click")));
    n.resources[id]+=amount;
    if(id==="energy"){n.runEnergy+=amount;n.totalEnergy+=amount;}
    return n;
  }
  function price(s,b,owned){
    const discount=Math.max(.35,bonus(s,"cost"));
    const cost=Math.ceil(b.price*Math.pow(b.growth,owned)*discount);
    return {energy:cost,wood:b.age?Math.ceil(cost*.06):0,stone:b.age?Math.ceil(cost*.04):0};
  }
  function affordable(s,price){return Object.entries(price).every(([k,v])=>s.resources[k]+1e-7>=v);}
  function buy(s,id,quantity=1){
    const b=BUILDING_MAP[id];if(!b||b.age>s.age||s.won)return {state:s,count:0};
    const n=clone(s),limit=quantity==="max"?10000:Math.min(10000,Math.max(0,Math.floor(quantity)));
    let count=0;
    for(;count<limit;count++){
      const owned=n.buildings[id]||0;if(owned>=1e6)break;
      const p=price(n,b,owned);if(!affordable(n,p))break;
      for(const [k,v] of Object.entries(p))n.resources[k]=Math.max(0,n.resources[k]-v);
      n.buildings[id]=owned+1;
    }
    return {state:count?n:s,count};
  }
  function research(s,id){
    const t=TECH_MAP[id];if(!t||t.age>s.age||s.researched.includes(id)||s.won||s.resources.science<t.cost)return s;
    const n=clone(s);n.resources.science-=t.cost;n.researched.push(id);return n;
  }
  function produce(s,seconds){
    const active=BUILDINGS.filter(b=>b.age<=s.age&&(s.buildings[b.id]||0)>0);
    const ordered=[...active.filter(b=>!b.inputs&&b.resource==="energy"),...active.filter(b=>!b.inputs&&b.resource!=="energy"),...active.filter(b=>!!b.inputs)];
    const speed=s.dev?s.devSpeed:1;
    for(const b of ordered){
      const kind=b.resource==="energy"?"energy":b.resource==="science"?"science":"industry";
      let qty=(s.buildings[b.id]||0)*b.rate*Math.pow(1.5,s.age-b.age)*bonus(s,kind)*seconds*speed;
      if(b.inputs){
        for(const [k,v] of Object.entries(b.inputs))qty=Math.min(qty,s.resources[k]/v);
        for(const [k,v] of Object.entries(b.inputs))s.resources[k]=Math.max(0,s.resources[k]-qty*v);
      }
      s.resources[b.resource]=Math.min(1e290,s.resources[b.resource]+qty);
      if(b.resource==="energy"){s.runEnergy=Math.min(1e290,s.runEnergy+qty);s.totalEnergy=Math.min(1e290,s.totalEnergy+qty);}
    }
    if(s.age>=9&&s.systems){
      const q=s.systems*Math.pow(5,s.age-9)*9*seconds*speed;
      s.resources.energy+=q;s.runEnergy+=q;s.totalEnergy+=q;
    }
  }
  function simulate(state,seconds,offline=false){
    const duration=Math.min(offline?28800:3600,Math.max(0,Number(seconds)||0));
    if(!duration||state.won)return state;
    const s=clone(state),step=offline?2:.25;
    for(let t=0;t<duration;t+=step)produce(s,Math.min(step,duration-t));
    return s;
  }
  function rates(s){const x=clone(s);produce(x,1);return Object.fromEntries(RESOURCE_IDS.map(k=>[k,x.resources[k]-s.resources[k]]));}
  function power(s){
    return BUILDINGS.filter(b=>b.resource==="energy"&&b.age<=s.age).reduce((q,b)=>q+(s.buildings[b.id]||0)*b.rate*Math.pow(1.5,s.age-b.age)*bonus(s,"energy"),s.age>=9?s.systems*Math.pow(5,s.age-9)*9:0);
  }
  function kardashev(s){return Math.max(0,(1.35*s.age+.2*s.systems+Math.log10(Math.max(1,power(s))))/10);}
  function requirements(s){
    const material=AGES[s.age].resource;
    const list=[
      {name:"Énergie cumulée",value:s.runEnergy,target:Math.ceil(200*Math.pow(4.6,s.age))},
      {name:"Bois",value:s.resources.wood,target:Math.ceil(38*Math.pow(1.55,s.age))},
      {name:"Pierre",value:s.resources.stone,target:Math.ceil(28*Math.pow(1.52,s.age))},
      ...(s.age?[{name:MATERIALS[material],value:s.resources[material],target:Math.ceil(16*Math.pow(2.08,s.age))}]:[]),
      {name:"Technologies",value:s.researched.filter(id=>TECH_MAP[id].age===s.age).length,target:2},
      {name:"Bâtiments",value:Object.values(s.buildings).reduce((a,b)=>a+b,0),target:3},
      ...(s.age===14?[{name:"Systèmes",value:s.systems,target:20},{name:"Indice Kardachev",value:kardashev(s),target:3}]:[])
    ];
    return {list,ready:list.every(r=>r.value+1e-8>=r.target)};
  }
  function ascend(s){
    if(s.won||!requirements(s).ready)return s;
    if(s.age===14){const n=clone(s);n.won=true;return n;}
    const n=newGame();n.age=s.age+1;n.totalEnergy=s.totalEnergy;n.ascensions=s.ascensions+1;n.knowledge=s.knowledge+Math.max(1,Math.ceil((s.age+1)/2));n.upgrades={...s.upgrades};n.dev=s.dev;n.devSpeed=s.devSpeed;return n;
  }
  function upgradeCost(s,id){return Math.ceil((id==="cost"?3:1)*Math.pow(1.8,s.upgrades[id]||0));}
  function upgrade(s,id){
    if(!Object.hasOwn(s.upgrades,id)||s.upgrades[id]>=30||s.knowledge<upgradeCost(s,id))return s;
    const n=clone(s);n.knowledge-=upgradeCost(n,id);n.upgrades[id]++;return n;
  }
  function colonyCost(s){return {energy:Math.ceil(8000*Math.pow(2.5,s.age-9)*Math.pow(1.5,s.systems)),[AGES[s.age].resource]:Math.ceil(8*Math.pow(1.2,s.systems))};}
  function colonize(s){
    if(s.age<9||s.won||s.systems>=10000)return s;
    const cost=colonyCost(s);if(!affordable(s,cost))return s;
    const n=clone(s);for(const [id,v] of Object.entries(cost))n.resources[id]-=v;n.systems++;return n;
  }
  function grant(s,id,qty){
    if(!s.dev||!RESOURCE_IDS.includes(id)||!safe(qty))return s;
    const n=clone(s);n.resources[id]=Math.min(1e290,n.resources[id]+qty);
    if(id==="energy"){n.runEnergy+=qty;n.totalEnergy+=qty;}return n;
  }
  function jump(s,age){
    if(!s.dev||!Number.isInteger(age)||age<0||age>14)return s;
    const n=clone(s);n.age=age;n.won=false;
    n.researched=n.researched.filter(id=>TECH_MAP[id].age<=age);
    n.buildings=Object.fromEntries(Object.entries(n.buildings).filter(([id])=>BUILDING_MAP[id].age<=age));
    return n;
  }
  function complete(s){
    if(!s.dev)return s;
    const n=clone(s),age=AGES[n.age];
    n.runEnergy=Math.max(n.runEnergy,Math.ceil(200*Math.pow(4.6,n.age)));
    n.resources.energy=Math.max(n.resources.energy,n.runEnergy);
    n.resources.wood=Math.max(n.resources.wood,Math.ceil(38*Math.pow(1.55,n.age)));
    n.resources.stone=Math.max(n.resources.stone,Math.ceil(28*Math.pow(1.52,n.age)));
    if(n.age)n.resources[age.resource]=Math.max(n.resources[age.resource],Math.ceil(16*Math.pow(2.08,n.age)));
    for(const t of TECHS.filter(t=>t.age===n.age).slice(0,2))if(!n.researched.includes(t.id))n.researched.push(t.id);
    n.buildings["power-0"]=Math.max(3,n.buildings["power-0"]||0);
    if(n.age===14){n.systems=40;n.buildings["power-14"]=1000;}
    return n;
  }
  return {MATERIALS,RESOURCE_IDS,AGES,BUILDINGS,TECHS,BRANCH_LABELS,newGame,validate,clone,bonus,harvest,price,buy,research,simulate,rates,power,kardashev,requirements,ascend,upgradeCost,upgrade,colonyCost,colonize,grant,jump,complete};
})();
