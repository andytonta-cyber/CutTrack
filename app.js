
const KEY="cuttrack_v1";
const today=()=>new Date().toISOString().slice(0,10);
const defaultState={
  settings:{cal:2650,p:205,c:290,f:75,fi:35,water:3000},
  days:{},
  weights:[],
  presets:[
    {name:"Bol poulet BBQ",cal:650,p:55,c:72,f:15,fi:8,meal:"Déjeuner"},
    {name:"Bœuf + patate douce",cal:610,p:50,c:58,f:18,fi:9,meal:"Dîner"},
    {name:"Yogourt grec + fruits",cal:310,p:30,c:34,f:5,fi:5,meal:"Collation"},
    {name:"Shake protéiné + banane",cal:360,p:35,c:45,f:6,fi:5,meal:"Collation"}
  ]
};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||defaultState;
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function day(){if(!state.days[today()])state.days[today()]={foods:[],water:0};return state.days[today()];}
function fmt(n,d=0){return Number(n||0).toFixed(d)}
function totals(){
  return day().foods.reduce((a,x)=>({cal:a.cal+x.cal,p:a.p+x.p,c:a.c+x.c,f:a.f+x.f,fi:a.fi+x.fi}),{cal:0,p:0,c:0,f:0,fi:0})
}
const macroDefs=[["Protéines","p","g"],["Glucides","c","g"],["Gras","f","g"],["Fibres","fi","g"]];
function render(){
  const t=totals(),s=state.settings;
  document.getElementById("todayLabel").textContent=new Intl.DateTimeFormat("fr-CA",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  document.getElementById("calConsumed").textContent=Math.round(t.cal);
  document.getElementById("calTarget").textContent=s.cal;
  document.getElementById("calRemaining").textContent=Math.max(0,Math.round(s.cal-t.cal));
  const pct=Math.min(100,Math.round(t.cal/s.cal*100)||0);
  document.getElementById("calPct").textContent=pct;
  document.getElementById("calRing").style.strokeDashoffset=301.59*(1-pct/100);

  const mg=document.getElementById("macroGrid"); mg.innerHTML="";
  macroDefs.forEach(([name,k,u])=>{
    const val=t[k],goal=s[k],p=Math.min(100,val/goal*100||0);
    mg.insertAdjacentHTML("beforeend",`<div class="macro"><div class="muted">${name}</div><div class="value">${fmt(val)} / ${goal}${u}</div><div class="bar"><div style="width:${p}%"></div></div></div>`)
  });

  const groups=["Petit-déjeuner","Déjeuner","Dîner","Collation"];
  const list=document.getElementById("mealList"); list.innerHTML="";
  groups.forEach(g=>{
    const items=day().foods.filter(x=>x.meal===g);
    const c=items.reduce((a,x)=>a+x.cal,0);
    let html=`<div class="meal"><div class="meal-head"><h3>${g}</h3><strong>${Math.round(c)} kcal</strong></div><div class="meal-items">`;
    if(!items.length)html+=`<div class="muted small">Aucun aliment</div>`;
    items.forEach(x=>html+=`<div class="food-row"><div><strong>${x.name}</strong><div class="food-macros">${fmt(x.p)}P • ${fmt(x.c)}G • ${fmt(x.f)}L</div></div><div>${Math.round(x.cal)} kcal</div><button class="delete" data-id="${x.id}">×</button></div>`);
    html+="</div></div>"; list.insertAdjacentHTML("beforeend",html)
  });
  document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>{day().foods=day().foods.filter(x=>x.id!==b.dataset.id);save();render()});

  document.getElementById("waterNow").textContent=day().water;
  document.getElementById("waterGoal").textContent=s.water;
  document.getElementById("waterBar").style.width=Math.min(100,day().water/s.water*100)+"%";

  renderWeights(); renderPresets();
}
function renderPresets(){
  const g=document.getElementById("presetGrid");g.innerHTML="";
  state.presets.forEach((p,i)=>g.insertAdjacentHTML("beforeend",`<div class="preset" data-preset="${i}"><strong>${p.name}</strong><span>${p.cal} kcal • ${p.p}P • ${p.c}G • ${p.f}L</span></div>`));
  document.querySelectorAll("[data-preset]").forEach(el=>el.onclick=()=>{const p=state.presets[+el.dataset.preset];day().foods.push({...p,id:crypto.randomUUID()});save();render()})
}
function renderWeights(){
  const w=[...state.weights].sort((a,b)=>a.date.localeCompare(b.date));
  const last=w.at(-1);
  document.getElementById("lastWeight").textContent=last?last.value.toFixed(1)+" lb":"—";
  const last7=w.slice(-7); const avg=last7.length?last7.reduce((a,x)=>a+x.value,0)/last7.length:null;
  document.getElementById("avgWeight").textContent=avg?avg.toFixed(1)+" lb":"—";
  const delta=w.length>1?w.at(-1).value-w[0].value:null;
  document.getElementById("weightDelta").textContent=delta===null?"—":`${delta>0?"+":""}${delta.toFixed(1)} lb`;
  drawChart(w.slice(-30));
}
function drawChart(w){
  const c=document.getElementById("weightChart"),ctx=c.getContext("2d"),W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#13161b";ctx.fillRect(0,0,W,H);
  if(w.length<2){ctx.fillStyle="#9aa3b2";ctx.font="24px -apple-system";ctx.fillText("Entre au moins 2 poids pour voir la courbe",30,130);return}
  const vals=w.map(x=>x.value),min=Math.min(...vals)-1,max=Math.max(...vals)+1;
  ctx.strokeStyle="#ff6b35";ctx.lineWidth=5;ctx.beginPath();
  w.forEach((x,i)=>{const px=30+i*(W-60)/(w.length-1),py=H-30-(x.value-min)/(max-min)*(H-60);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});
  ctx.stroke();
}
function openModal(id){document.getElementById(id).classList.remove("hidden")}
function closeModal(id){document.getElementById(id).classList.add("hidden")}
document.getElementById("addFoodBtn").onclick=()=>openModal("foodModal");
document.getElementById("addWeightBtn").onclick=()=>{document.getElementById("weightDate").value=today();openModal("weightModal")};
document.getElementById("settingsBtn").onclick=()=>{const s=state.settings;["Cal","P","C","F","Fi","Water"].forEach(k=>document.getElementById("set"+k).value=s[k.toLowerCase()]);openModal("settingsModal")};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.getElementById("foodForm").onsubmit=e=>{e.preventDefault();day().foods.push({id:crypto.randomUUID(),meal:mealType.value,name:foodName.value,cal:+foodCal.value||0,p:+foodP.value||0,c:+foodC.value||0,f:+foodF.value||0,fi:+foodFi.value||0});save();e.target.reset();closeModal("foodModal");render()};
document.getElementById("weightForm").onsubmit=e=>{e.preventDefault();const d=weightDate.value,v=+weightValue.value;state.weights=state.weights.filter(x=>x.date!==d);state.weights.push({date:d,value:v});save();closeModal("weightModal");render()};
document.getElementById("settingsForm").onsubmit=e=>{e.preventDefault();state.settings={cal:+setCal.value,p:+setP.value,c:+setC.value,f:+setF.value,fi:+setFi.value,water:+setWater.value};save();closeModal("settingsModal");render()};
document.querySelectorAll("[data-water]").forEach(b=>b.onclick=()=>{day().water+=+b.dataset.water;save();render()});
document.getElementById("waterReset").onclick=()=>{day().water=0;save();render()};
document.getElementById("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cuttrack-data.json";a.click()};
document.getElementById("importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();render();alert("Import réussi.")}catch{alert("Fichier invalide.")}};r.readAsText(f)};
document.getElementById("resetAllBtn").onclick=()=>{if(confirm("Effacer toutes les données CutTrack ?")){localStorage.removeItem(KEY);location.reload()}};
render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
