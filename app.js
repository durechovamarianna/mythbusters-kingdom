// Tabs
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

function openTab(id){
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
  pages.forEach(p => p.classList.toggle("active", p.id === id));
  history.replaceState({}, "", "#" + id);
}

tabs.forEach(btn => btn.addEventListener("click", () => openTab(btn.dataset.tab)));
openTab(location.hash?.replace("#","") || "home");

// 1) Drak add/remove + limit
let dragons = 0;
const MAX = 5;
const arena = document.querySelector('[data-testid="dragon-arena"]');
const countEl = document.querySelector('[data-testid="dragon-count"]');
const addBtn = document.querySelector('[data-testid="add-dragon"]');
const remBtn = document.querySelector('[data-testid="remove-dragon"]');
const resetBtn = document.querySelector('[data-testid="reset-dragon"]');
const banner = document.querySelector('[data-testid="dragon-banner"]');

function renderDragons(){
  countEl.textContent = String(dragons);
  arena.innerHTML = "";
  for(let i=0;i<dragons;i++){
    const d = document.createElement("div");
    d.className = "dragon";
    d.textContent = "🐉";
    d.setAttribute("data-testid", "dragon");
    arena.appendChild(d);
  }
  const limitReached = dragons >= MAX;
  addBtn.disabled = limitReached;
  banner.hidden = !limitReached;
}

addBtn.addEventListener("click", () => { if(dragons < MAX) dragons++; renderDragons(); });
remBtn.addEventListener("click", () => { if(dragons > 0) dragons--; renderDragons(); });
resetBtn.addEventListener("click", () => { dragons = 0; renderDragons(); });
renderDragons();

// 2) Kalkulačka kúziel
const form = document.querySelector('[data-testid="spell-form"]');
const result = document.querySelector('[data-testid="spell-result"]');
const error = document.querySelector('[data-testid="spell-error"]');

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const mana = Number(document.querySelector('[data-testid="mana"]').value);
  const level = Number(document.querySelector('[data-testid="level"]').value);
  const type = document.querySelector('[data-testid="spell-type"]').value;

  const ok = Number.isFinite(mana) && Number.isFinite(level) && type && mana >= 0 && mana <= 999 && level >= 1 && level <= 10;
  if(!ok){
    result.hidden = true;
    error.hidden = false;
    return;
  }

  error.hidden = true;
  const base = mana * level;
  const mult = type === "attack" ? 1.4 : type === "defense" ? 0.9 : 1.1;
  const score = Math.round(base * mult);
  result.textContent = `Výsledok: ${score} (type=${type})`;
  result.hidden = false;
});

// 3) Knižnica + modal
const spells = [
  { name:"Smiechus Maximus", type:"funny", desc:"Vyvolá nekontrolovateľný smiech v celej miestnosti."},
  { name:"Banana Slip", type:"funny", desc:"Zhmotní banánovú šupku presne pod nohou boss-a."},
  { name:"Aqua Splash", type:"attack", desc:"Striekne vodu tam, kde to najmenej čakáš."},
  { name:"Shieldy McShield", type:"defense", desc:"Zdvihne obranný štít proti flakiness."},
];

const cardsWrap = document.querySelector('[data-testid="spell-cards"]');
const searchEl = document.querySelector('[data-testid="search"]');
const filterEl = document.querySelector('[data-testid="filter"]');
const noRes = document.querySelector('[data-testid="no-results"]');
const modal = document.querySelector('[data-testid="modal"]');
const modalTitle = document.querySelector('[data-testid="modal-title"]');
const modalDesc = document.querySelector('[data-testid="modal-desc"]');
const modalClose = document.querySelector('[data-testid="modal-close"]');

function renderLibrary(){
  const q = (searchEl.value || "").toLowerCase().trim();
  const f = filterEl.value;
  const list = spells.filter(s => (f === "all" || s.type === f) && s.name.toLowerCase().includes(q));

  cardsWrap.innerHTML = "";
  list.forEach(s => {
    const c = document.createElement("div");
    c.className = "card";
    c.setAttribute("data-testid","spell-card");
    c.innerHTML = `<b>${s.name}</b><small>${s.type}</small>`;
    c.addEventListener("click", () => {
      modalTitle.textContent = s.name;
      modalDesc.textContent = s.desc;
      modal.hidden = false;
    });
    cardsWrap.appendChild(c);
  });

  noRes.hidden = list.length !== 0;
}

searchEl.addEventListener("input", renderLibrary);
filterEl.addEventListener("change", renderLibrary);
modalClose.addEventListener("click", () => modal.hidden = true);
modal.addEventListener("click", (e) => { if(e.target === modal) modal.hidden = true; });
renderLibrary();

// 4) Wizard
const step1 = document.querySelector('[data-testid="step-1"]');
const step2 = document.querySelector('[data-testid="step-2"]');
const step3 = document.querySelector('[data-testid="step-3"]');
const summary = document.querySelector('[data-testid="summary"]');
const done = document.querySelector('[data-testid="cast-done"]');
const resetWizard = document.querySelector('[data-testid="wizard-reset"]');

let hero = null;
let gag = null;

function resetW(){
  hero = null; gag = null;
  step1.hidden = false; step2.hidden = true; step3.hidden = true;
  done.hidden = true;
  summary.textContent = "";
}

document.querySelector('[data-testid="pick-hero"]').addEventListener("click", (e)=>{
  hero = e.target.dataset.value;
  step1.hidden = true; step2.hidden = false;
});
document.querySelector('[data-testid="pick-hero2"]').addEventListener("click", (e)=>{
  hero = e.target.dataset.value;
  step1.hidden = true; step2.hidden = false;
});
document.querySelector('[data-testid="pick-gag"]').addEventListener("click", (e)=>{
  gag = e.target.dataset.value;
  step2.hidden = true; step3.hidden = false;
  summary.textContent = `Postava: ${hero} | Gag: ${gag}`;
});
document.querySelector('[data-testid="pick-gag2"]').addEventListener("click", (e)=>{
  gag = e.target.dataset.value;
  step2.hidden = true; step3.hidden = false;
  summary.textContent = `Postava: ${hero} | Gag: ${gag}`;
});
document.querySelector('[data-testid="confirm"]').addEventListener("click", ()=>{
  done.hidden = false;
});
resetWizard.addEventListener("click", resetW);
resetW();

// 5) Wait
const summon = document.querySelector('[data-testid="summon"]');
const loader = document.querySelector('[data-testid="loader"]');
const unicorn = document.querySelector('[data-testid="unicorn"]');
const waitErr = document.querySelector('[data-testid="wait-error"]');
const failMode = document.querySelector('[data-testid="fail-mode"]');

summon.addEventListener("click", async () => {
  loader.hidden = false;
  unicorn.hidden = true;
  waitErr.hidden = true;

  await new Promise(r => setTimeout(r, 2000)); // 2s delay

  loader.hidden = true;
  if(failMode.checked){
    waitErr.hidden = false;
  } else {
    unicorn.hidden = false;
  }
});

// 6) Table
const rows = [
  { id:"MYTH-001", myth:"Vždy to pôjde aj bez testov", sev: 5, status:"Busted" },
  { id:"MYTH-002", myth:"Automatizácia nahradí testera", sev: 4, status:"Busted" },
  { id:"MYTH-003", myth:"Flaky test je iba zlá karma", sev: 3, status:"Investigate" },
  { id:"MYTH-004", myth:"Bugy sa boja productionu", sev: 5, status:"Busted" },
];
const tbody = document.querySelector('[data-testid="myth-tbody"]');
const mythFilter = document.querySelector('[data-testid="myth-filter"]');
const sortBtn = document.querySelector('[data-testid="sort-severity"]');
let sortDesc = true;

function renderTable(){
  const q = (mythFilter.value||"").toLowerCase().trim();
  let list = rows.filter(r => r.myth.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));

  list = list.slice().sort((a,b)=> sortDesc ? b.sev-a.sev : a.sev-b.sev);

  tbody.innerHTML = "";
  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-row-id", r.id);
    tr.innerHTML = `<td>${r.id}</td><td>${r.myth}</td><td>${r.sev}</td><td>${r.status}</td>`;
    tbody.appendChild(tr);
  });
}

mythFilter.addEventListener("input", renderTable);
sortBtn.addEventListener("click", ()=>{ sortDesc = !sortDesc; renderTable(); });
renderTable();
