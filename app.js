function qs(testId){
  return document.querySelector(`[data-testid="${testId}"]`);
}

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("mbk-theme", theme);
}

(function initThemeAndNav(){
  // Theme
  const saved = localStorage.getItem("mbk-theme") || "dark";
  setTheme(saved);

  const toggle = qs("theme-toggle");
  if(toggle){
    toggle.textContent = saved === "light" ? "🌙 Dark" : "☀️ Light";
    toggle.addEventListener("click", ()=>{
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
      toggle.textContent = next === "light" ? "🌙 Dark" : "☀️ Light";
      showToast("Téma zmenená", `Aktívna téma: ${next}`, "ok");
    });
  }

  // Active nav highlighting (podľa názvu súboru)
  const file = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a=>{
    const href = a.getAttribute("href");
    if(href === file) a.classList.add("active");
  });
})();

function showToast(title, msg, kind="ok"){
  const toast = qs("toast");
  if(!toast) return;
  qs("toast-title").textContent = title;
  qs("toast-msg").textContent = msg;
  toast.setAttribute("data-kind", kind);
  toast.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> toast.hidden = true, 3000);
}

(function initToastClose(){
  const close = qs("toast-close");
  const toast = qs("toast");
  if(!close || !toast) return;
  close.addEventListener("click", ()=> toast.hidden = true);
})();

// 1) Drak add/remove + limit
(function initDragon(){
  const arena = qs("dragon-arena");
  const countEl = qs("dragon-count");
  const addBtn = qs("add-dragon");
  const remBtn = qs("remove-dragon");
  const resetBtn = qs("reset-dragon");
  const banner = qs("dragon-banner");

  if(!arena || !countEl || !addBtn || !remBtn || !resetBtn || !banner) return;

  let dragons = 0;
  const MAX = 5;

  function render(){
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

  addBtn.addEventListener("click", ()=>{
    if(dragons < MAX) dragons++;
    render();
    showToast("Drak pridaný", `Počet drakov: ${dragons}`, "ok");
  });

  remBtn.addEventListener("click", ()=>{
    if(dragons > 0) dragons--;
    render();
    showToast("Drak odpálený", `Počet drakov: ${dragons}`, "warn");
  });

  resetBtn.addEventListener("click", ()=>{
    dragons = 0;
    render();
    showToast("Reset arény", "Draci zmizli (na chvíľu).", "ok");
  });

  render();
})();

// 2) Kalkulačka kúziel
(function initSpells(){
  const form = qs("spell-form");
  const result = qs("spell-result");
  const error = qs("spell-error");
  const manaEl = qs("mana");
  const levelEl = qs("level");
  const typeEl = qs("spell-type");

  if(!form || !result || !error || !manaEl || !levelEl || !typeEl) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const mana = Number(manaEl.value);
    const level = Number(levelEl.value);
    const type = typeEl.value;

    const ok = Number.isFinite(mana) && Number.isFinite(level) && type &&
               mana >= 0 && mana <= 999 && level >= 1 && level <= 10;

    if(!ok){
      result.hidden = true;
      error.hidden = false;
      showToast("Formulár", "Vyplň všetky polia správne.", "bad");
      return;
    }

    error.hidden = true;
    const base = mana * level;
    const mult = type === "attack" ? 1.4 : type === "defense" ? 0.9 : 1.1;
    const score = Math.round(base * mult);

    result.textContent = `Výsledok: ${score} (type=${type})`;
    result.hidden = false;
    showToast("Výpočet hotový", `Skóre: ${score}`, "ok");
  });
})();

// 3) Knižnica + modal
(function initLibrary(){
  const cardsWrap = qs("spell-cards");
  const searchEl = qs("search");
  const filterEl = qs("filter");
  const noRes = qs("no-results");
  const modal = qs("modal");
  const modalTitle = qs("modal-title");
  const modalDesc = qs("modal-desc");
  const modalClose = qs("modal-close");

  if(!cardsWrap || !searchEl || !filterEl || !noRes || !modal || !modalTitle || !modalDesc || !modalClose) return;

  const spells = [
    { name:"Smiechus Maximus", type:"funny", desc:"Vyvolá nekontrolovateľný smiech v celej miestnosti."},
    { name:"Banana Slip", type:"funny", desc:"Zhmotní banánovú šupku presne pod nohou boss-a."},
    { name:"Aqua Splash", type:"attack", desc:"Striekne vodu tam, kde to najmenej čakáš."},
    { name:"Shieldy McShield", type:"defense", desc:"Zdvihne obranný štít proti flakiness."},
  ];

  function render(){
    const q = (searchEl.value || "").toLowerCase().trim();
    const f = filterEl.value;

    const list = spells.filter(s =>
      (f === "all" || s.type === f) &&
      s.name.toLowerCase().includes(q)
    );

    cardsWrap.innerHTML = "";
    list.forEach(s=>{
      const c = document.createElement("div");
      c.className = "spell-card";
      c.setAttribute("data-testid", "spell-card");
      c.innerHTML = `<b>${s.name}</b><small>${s.type}</small>`;
      c.addEventListener("click", ()=>{
        modalTitle.textContent = s.name;
        modalDesc.textContent = s.desc;
        modal.hidden = false;
        showToast("Detail kúzla", s.name, "ok");
      });
      cardsWrap.appendChild(c);
    });

    noRes.hidden = list.length !== 0;
  }

  searchEl.addEventListener("input", render);
  filterEl.addEventListener("change", render);

  modalClose.addEventListener("click", ()=> modal.hidden = true);
  modal.addEventListener("click", (e)=>{ if(e.target === modal) modal.hidden = true; });

  render();
})();

// 4) Wizard
(function initWizard(){
  const step1 = qs("step-1");
  const step2 = qs("step-2");
  const step3 = qs("step-3");
  const summary = qs("summary");
  const done = qs("cast-done");
  const resetBtn = qs("wizard-reset");

  const pickHero1 = qs("pick-hero");
  const pickHero2 = qs("pick-hero2");
  const pickGag1 = qs("pick-gag");
  const pickGag2 = qs("pick-gag2");
  const confirm = qs("confirm");

  if(!step1 || !step2 || !step3 || !summary || !done || !resetBtn ||
     !pickHero1 || !pickHero2 || !pickGag1 || !pickGag2 || !confirm) return;

  let hero = null;
  let gag = null;

  function reset(){
    hero = null; gag = null;
    step1.hidden = false;
    step2.hidden = true;
    step3.hidden = true;
    done.hidden = true;
    summary.textContent = "";
  }

  function goStep3(){
    step2.hidden = true;
    step3.hidden = false;
    summary.textContent = `Postava: ${hero} | Gag: ${gag}`;
  }

  pickHero1.addEventListener("click", (e)=>{
    hero = e.target.dataset.value;
    step1.hidden = true; step2.hidden = false;
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });
  pickHero2.addEventListener("click", (e)=>{
    hero = e.target.dataset.value;
    step1.hidden = true; step2.hidden = false;
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });

  pickGag1.addEventListener("click", (e)=>{ gag = e.target.dataset.value; goStep3(); showToast("Wizard", `Gag: ${gag}`, "warn"); });
  pickGag2.addEventListener("click", (e)=>{ gag = e.target.dataset.value; goStep3(); showToast("Wizard", `Gag: ${gag}`, "warn"); });

  confirm.addEventListener("click", ()=>{ done.hidden = false; showToast("Obsadené!", "Kamera ide, QA tiež.", "ok"); });
  resetBtn.addEventListener("click", ()=>{ reset(); showToast("Reset", "Wizard bol resetnutý.", "ok"); });

  reset();
})();

// 5) Wait
(function initWait(){
  const summon = qs("summon");
  const loader = qs("loader");
  const unicorn = qs("unicorn");
  const waitErr = qs("wait-error");
  const failMode = qs("fail-mode");
  const skeleton = qs("skeleton");

  if(!summon || !loader || !unicorn || !waitErr || !failMode) return;

  summon.addEventListener("click", async ()=>{
    loader.hidden = false;
    if(skeleton) skeleton.hidden = false;
    unicorn.hidden = true;
    waitErr.hidden = true;

    await new Promise(r => setTimeout(r, 2000));

    loader.hidden = true;
    if(skeleton) skeleton.hidden = true;

    if(failMode.checked){
      waitErr.hidden = false;
      showToast("Server", "500 – jednorožec sa zasekol 😅", "bad");
    }else{
      unicorn.hidden = false;
      showToast("Success", "Jednorožec dorazil 🦄", "ok");
    }
  });
})();

// 6) Table
(function initTable(){
  const tbody = qs("myth-tbody");
  const mythFilter = qs("myth-filter");
  const sortBtn = qs("sort-severity");

  if(!tbody || !mythFilter || !sortBtn) return;

  const rows = [
    { id:"MYTH-001", myth:"Vždy to pôjde aj bez testov", sev: 5, status:"Busted" },
    { id:"MYTH-002", myth:"Automatizácia nahradí testera", sev: 4, status:"Busted" },
    { id:"MYTH-003", myth:"Flaky test je iba zlá karma", sev: 3, status:"Investigate" },
    { id:"MYTH-004", myth:"Bugy sa boja productionu", sev: 5, status:"Busted" },
  ];

  let sortDesc = true;

  function render(){
    const q = (mythFilter.value || "").toLowerCase().trim();
    let list = rows.filter(r =>
      r.myth.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );

    list = list.slice().sort((a,b)=> sortDesc ? b.sev - a.sev : a.sev - b.sev);

    tbody.innerHTML = "";
