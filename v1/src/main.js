import { Game as G } from "./engine.js";
const root=document.getElementById("app");
const dev=new URLSearchParams(location.search).has("dev");
const KEY="cosmic-ascension-renascence-v1"+(dev?"-developer":"");
const format=n=>n>=1e9?n.toExponential(2):n>=1e6?(n/1e6).toFixed(2)+" M":Math.floor(n*100)/100;
let game=G.newGame(),tab="civilization",choice="energy",bulk=1,last=performance.now();
const icons={energy:"⚡",wood:"🌲",stone:"◆",science:"◈",copper:"◉",tin:"◇",bronze:"⬡",iron:"⛏",coal:"♨",steel:"▰",circuits:"▣",uranium:"☢",titanium:"◇",fusion:"✦",regolith:"☾",stellar:"☀",antimatter:"✧",exotic:"✳"};
const nav=[["civilization","Civilisation"],["buildings","Infrastructures"],["industry","Industrie"],["research","Technologies"],["expansion","Expansion"],["ascension","Ascension"],["statistics","Statistiques"],["developer","Développeur"]];
try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);if(G.validate(s))game=s;}}catch(e){console.warn(e);}
const offline=Math.min(28800,Math.max(0,(Date.now()-game.lastSeen)/1000));
if(offline>1)game=G.simulate(game,offline,true);
function save(){try{game.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(game));}catch(e){console.warn("Sauvegarde impossible",e);}}
function rateText(id){const v=G.rates(game)[id]||0;return (v>=0?"+":"")+format(v)+"/s";}
function head(){
const visible=["energy","wood","stone","science",...G.RESOURCE_IDS.filter(k=>!["energy","wood","stone","science"].includes(k)&&(game.resources[k]>0||G.AGES[game.age].resource===k))];
return '<header class="top"><div class="brand">COSMIC ASCENSION<small>RENAISSANCE · CLEAN ROOM</small></div><div class="status">● SAUVEGARDE LOCALE</div></header><div class="resourcebar">'+visible.map(k=>'<div class="reschip"><span>'+icons[k]+' '+G.MATERIALS[k]+'</span><strong>'+format(game.resources[k])+'</strong><em>'+rateText(k)+'</em></div>').join("")+'</div>';
}
function section(title,body,desc=""){return '<section class="panel"><h2>'+title+'</h2>'+(desc?'<p class="muted">'+desc+'</p>':'')+body+'</section>';}
function building(b){
const count=game.buildings[b.id]||0,p=G.price(game,b,count);
const can=Object.entries(p).every(([k,v])=>game.resources[k]>=v);
return '<div class="item"><div class="itemheader"><span class="itemname">'+icons[b.resource]+' '+b.name+'</span><span class="itemcount">×'+count+'</span></div><p class="muted">+'+format(b.rate*Math.pow(1.5,game.age-b.age))+' '+G.MATERIALS[b.resource]+'/s</p>'+(b.inputs?'<p class="hint">Entrées : '+Object.entries(b.inputs).map(([k,v])=>format(v)+' '+G.MATERIALS[k]).join(", ")+'</p>':'')+'<p class="hint">Prix : '+Object.entries(p).filter(([,v])=>v>0).map(([k,v])=>format(v)+' '+G.MATERIALS[k]).join(" · ")+'</p><button class="action" data-buy="'+b.id+'" '+(can?"":"disabled")+'>Construire '+(bulk==="max"?"MAX":"×"+bulk)+'</button></div>';
}
function civil(){
const a=G.AGES[game.age],r=G.requirements(game);
return '<div class="panel hero"><div class="planet"></div><div><div class="eyebrow">CIVILISATION '+(game.age+1)+' / 15</div><h1>Âge '+a.name+'</h1><p class="muted">De l’âge de pierre à une civilisation de type III sur l’échelle de Kardachev.</p><span class="badge">Kardachev : '+G.kardashev(game).toFixed(2)+'</span></div></div>'+
section("Récolte","<div class='choice'>"+["energy","wood","stone"].map(k=>'<button data-choice="'+k+'" class="'+(choice===k?"active":"")+'">'+icons[k]+' '+G.MATERIALS[k]+'</button>').join("")+'</div><div class="clickzone"><button class="bigbutton" data-harvest="'+choice+'">Récolter '+G.MATERIALS[choice]+'</button><div id="floatLayer"></div></div><p class="hint">Énergie cumulée : '+format(game.runEnergy)+'</p>',"Clique pour obtenir tes premières ressources, puis construis des bâtiments.")+
section("Premières installations",'<div class="cards">'+G.BUILDINGS.filter(b=>b.age===game.age).slice(0,4).map(building).join("")+'</div>')+
section("Progression",'<div class="line"><span>'+r.list.filter(x=>x.value>=x.target).length+' / '+r.list.length+' conditions remplies</span><button class="secondary" data-nav="ascension">Voir les objectifs</button></div>');
}
function constructions(industry){
const bs=G.BUILDINGS.filter(b=>b.age<=game.age&&(!industry||(b.inputs||!["energy","science","wood","stone"].includes(b.resource))));
return section(industry?"Industrie":"Infrastructures",'<div class="choice">'+[1,10,100,"max"].map(n=>'<button data-bulk="'+n+'" class="'+(bulk===n?"active":"")+'">'+(n==="max"?"MAX":"×"+n)+'</button>').join("")+'</div><div class="cards">'+bs.map(building).join("")+'</div>',"Les chaînes transforment leurs intrants disponibles sans créer de stocks négatifs.");
}
function research(){
return section("Arbre des technologies",Object.keys(G.BRANCH_LABELS).map(branch=>'<h3>'+G.BRANCH_LABELS[branch]+'</h3><div class="techgrid">'+G.TECHS.filter(t=>t.branch===branch&&t.age<=game.age).map(t=>{const owned=game.researched.includes(t.id);return '<div class="item techitem '+(owned?"bought":"")+'"><strong>'+t.name+'</strong><p class="muted">'+t.description+'</p><p class="hint">Coût : '+format(t.cost)+' science</p><button class="action" data-research="'+t.id+'" '+(owned||game.resources.science<t.cost?"disabled":"")+'>'+(owned?"Acquise":"Rechercher")+'</button></div>';}).join("")+'</div>').join(""),"75 technologies avec cinq spécialisations et leurs bonus.");
}
function expansion(){
if(game.age<9)return section("Expansion spatiale",'<div class="notice">Déverrouillage à partir de l’âge spatial.</div>');
const cost=G.colonyCost(game);
return section("Expansion spatiale",'<div class="statbox"><div class="stat">Systèmes intégrés<strong>'+game.systems+'</strong></div><div class="stat">Indice Kardachev<strong>'+G.kardashev(game).toFixed(3)+'</strong></div></div><h3>Coloniser</h3><p>'+Object.entries(cost).map(([k,v])=>format(v)+' '+G.MATERIALS[k]).join(" · ")+'</p><button class="action" data-colony '+(Object.entries(cost).every(([k,v])=>game.resources[k]>=v)?"":"disabled")+'>Fonder une colonie</button>');
}
function ascension(){
const r=G.requirements(game);
if(game.won)return section("Victoire",'<div class="wincard"><strong>✦</strong><h1>Civilisation galactique de type III</h1><p>Vous avez atteint votre objectif final.</p></div>');
return section("Ascension",'<div class="requirements">'+r.list.map(q=>'<div class="requirement"><div class="line"><span>'+q.name+'</span><strong class="'+(q.value>=q.target?"positive":"")+'">'+format(q.value)+' / '+format(q.target)+'</strong></div><div class="meter"><b style="width:'+Math.min(100,100*q.value/q.target)+'%"></b></div></div>').join("")+'</div><div class="buttonline"><button class="action" data-ascend '+(r.ready?"":"disabled")+'>'+(game.age===14?"Atteindre le type III":"Passer à l’âge "+G.AGES[game.age+1].name)+'</button></div><hr class="divider"><h3>Héritage : '+game.knowledge+' connaissances</h3><div class="cards">'+Object.entries(game.upgrades).map(([k,v])=>'<div class="item"><strong>'+({energy:"Héritage énergétique",science:"Savoir scientifique",click:"Mémoire des gestes",cost:"Ingénierie héritée"}[k])+'</strong><p>Niveau '+v+'</p><button class="secondary" data-upgrade="'+k+'" '+(game.knowledge<G.upgradeCost(game,k)?"disabled":"")+'>Améliorer ('+G.upgradeCost(game,k)+')</button></div>').join("")+'</div>',"Stocks, bâtiments, recherches et colonies remis à zéro ; héritage conservé.");
}
function stats(){
return section("Statistiques",'<div class="statbox">'+[["Âge",G.AGES[game.age].name],["Ascensions",game.ascensions],["Énergie historique",format(game.totalEnergy)],["Technologies",game.researched.length],["Systèmes",game.systems],["Kardachev",G.kardashev(game).toFixed(3)]].map(([k,v])=>'<div class="stat">'+k+'<strong>'+v+'</strong></div>').join("")+'</div><hr class="divider"><button class="secondary" data-export>Exporter la sauvegarde</button> <button class="secondary" data-import>Importer une sauvegarde</button><input hidden type="file" id="fileSave" accept=".json">');
}
function developer(){
return section("Console développeur",'<div class="notice">Sauvegarde de développement indépendante de la partie normale.</div><div class="devforms"><button class="action" data-devtoggle>'+(game.dev?"Désactiver":"Activer")+' le mode</button><button class="secondary" data-complete>Compléter les objectifs</button></div><h3>Ressources</h3><div class="devforms"><select id="grantId">'+G.RESOURCE_IDS.map(k=>'<option value="'+k+'">'+G.MATERIALS[k]+'</option>').join("")+'</select><input type="number" min="0" value="100000" id="grantQty"><button class="action" data-grant>Ajouter</button></div><h3>Âges et vitesse</h3><div class="devforms"><select id="ageChoice">'+G.AGES.map(a=>'<option value="'+a.index+'" '+(game.age===a.index?"selected":"")+'>Âge '+a.name+'</option>').join("")+'</select><button class="secondary" data-jump>Aller à cet âge</button><select id="devSpeed">'+[1,10,100,1000].map(n=>'<option value="'+n+'" '+(game.devSpeed===n?"selected":"")+'>×'+n+'</option>').join("")+'</select></div>',"Accès uniquement avec ?dev=1 dans l’URL.");
}
function draw(){
document.body.dataset.age=game.age;
root.innerHTML=head()+'<div class="appbody"><nav class="sidebar">'+nav.filter(([id])=>id!=="developer"||dev).map(([id,label])=>'<button data-nav="'+id+'" class="navbtn '+(tab===id?"active":"")+'">'+label+'</button>').join("")+'</nav><main class="content">'+({civilization:civil,buildings:()=>constructions(false),industry:()=>constructions(true),research,expansion,ascension,statistics:stats,developer})[tab]()+'</main></div><footer class="footer">Cosmic Ascension v1 · moteur original indépendant</footer>';
root.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{tab=b.dataset.nav;draw();});
root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{choice=b.dataset.choice;draw();});
root.querySelectorAll("[data-harvest]").forEach(b=>b.onclick=()=>{const old=game.resources[choice];game=G.harvest(game,choice);const n=document.createElement("div");n.className="floater";n.textContent="+"+format(game.resources[choice]-old);document.getElementById("floatLayer")?.append(n);setTimeout(()=>n.remove(),800);root.querySelector(".resourcebar").innerHTML=head().match(/<div class="resourcebar">([\s\S]*?)<\/div><\/div>/)?.[1]||root.querySelector(".resourcebar").innerHTML;});
root.querySelectorAll("[data-bulk]").forEach(b=>b.onclick=()=>{bulk=b.dataset.bulk==="max"?"max":Number(b.dataset.bulk);draw();});
root.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{game=G.buy(game,b.dataset.buy,bulk).state;save();draw();});
root.querySelectorAll("[data-research]").forEach(b=>b.onclick=()=>{game=G.research(game,b.dataset.research);save();draw();});
root.querySelectorAll("[data-upgrade]").forEach(b=>b.onclick=()=>{game=G.upgrade(game,b.dataset.upgrade);save();draw();});
root.querySelectorAll("[data-ascend]").forEach(b=>b.onclick=()=>{if(confirm("Cette ascension supprime les ressources, bâtiments, technologies et colonies temporaires. Continuer ?")){game=G.ascend(game);save();draw();}});
root.querySelectorAll("[data-colony]").forEach(b=>b.onclick=()=>{game=G.colonize(game);save();draw();});
root.querySelectorAll("[data-devtoggle]").forEach(b=>b.onclick=()=>{game={...game,dev:!game.dev};save();draw();});
root.querySelectorAll("[data-complete]").forEach(b=>b.onclick=()=>{game=G.complete(game);save();draw();});
root.querySelectorAll("[data-grant]").forEach(b=>b.onclick=()=>{game=G.grant(game,document.getElementById("grantId").value,Number(document.getElementById("grantQty").value));save();draw();});
root.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{game=G.jump(game,Number(document.getElementById("ageChoice").value));save();draw();});
if(document.getElementById("devSpeed"))document.getElementById("devSpeed").onchange=e=>{if(game.dev){game={...game,devSpeed:Number(e.target.value)};save();draw();}};
root.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>{const blob=new Blob([JSON.stringify(game,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="cosmic-ascension-save.json";a.click();URL.revokeObjectURL(url);});
root.querySelectorAll("[data-import]").forEach(b=>b.onclick=()=>document.getElementById("fileSave").click());
const file=document.getElementById("fileSave");if(file)file.onchange=async e=>{try{const next=JSON.parse(await e.target.files[0].text());if(!G.validate(next))throw Error("Invalide");if(confirm("Remplacer la partie actuelle ?")){game=next;save();draw();}}catch(e){alert("Sauvegarde invalide");}};
}
draw();setInterval(()=>{if(!document.hidden){game=G.simulate(game,1);if(tab!=="research"&&tab!=="buildings"&&tab!=="industry")draw();else{const node=root.querySelector(".resourcebar");if(node){const doc=new DOMParser().parseFromString(head(),"text/html");node.replaceWith(doc.querySelector(".resourcebar"));}}}},1000);
setInterval(save,15000);window.addEventListener("pagehide",save);
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();else{game=G.simulate(game,Math.min(28800,Math.max(0,(Date.now()-game.lastSeen)/1000)),true);draw();}});
