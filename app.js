// ===== Helpers =====
function qs(testId){
  return document.querySelector(`[data-testid="${testId}"]`);
}

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("mbk-theme", theme);
}

function showToast(title, msg, kind="ok"){
  const toast = qs("toast");
  if(!toast) return;
  const t = qs("toast-title");
  const m = qs("toast-msg");
  if(t) t.textContent = title;
  if(m) m.textContent = msg;

  toast.setAttribute("data-kind", kind);
  toast.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> toast.hidden = true, 3000);
}

// ===== Theme + nav active =====
(function initThemeAndNav(){
  const saved = localStorage.getItem("mbk-theme") || "dark";
  setTheme(saved);

  const toggle = qs("theme-toggle");
  if(toggle){
    const setLabel = ()=>{
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      toggle.textContent = cur === "light" ? "🌙 Dark" : "☀️ Light";
    };
    setLabel();

    toggle.addEventListener("click", ()=>{
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
      setLabel();
      showToast("Téma zmenená", `Aktívna téma: ${next}`, "ok");
    });
  }

  const file = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === file) a.classList.add("active");
  });
})();

// ===== Toast close =====
(function initToastClose(){
  const close = qs("toast-close");
  const toast = qs("toast");
  if(!close || !toast) return;
  close.addEventListener("click", ()=> toast.hidden = true);
})();

// ===== 1) Dragon =====
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

// ===== 2) Spells =====
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

// ===== 3) Library =====
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
      (f === "all" || s.type === f) && s.name.toLowerCase().includes(q)
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

// ===== 4) Wizard (with progress) =====
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

  // Progress bar
  const prog = qs("wizard-progress");
  const setProg = (p)=>{ if(prog) prog.style.width = p + "%"; };
  const updateProg = ()=>{
    // 33% when step1 visible, 66% when step2 visible, 100% when step3 visible (or done)
    if(!step1.hidden) return setProg(33);
    if(!step2.hidden) return setProg(66);
    if(!step3.hidden) return setProg(100);
    return setProg(33);
  };

  function reset(){
    hero = null;
    gag = null;
    step1.hidden = false;
    step2.hidden = true;
    step3.hidden = true;
    done.hidden = true;
    summary.textContent = "";
    updateProg();
  }

  function goStep3(){
    step2.hidden = true;
    step3.hidden = false;
    summary.textContent = `Postava: ${hero} | Gag: ${gag}`;
    updateProg();
  }

  pickHero1.addEventListener("click", (e)=>{
    hero = e.target.dataset.value;
    step1.hidden = true;
    step2.hidden = false;
    updateProg();
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });

  pickHero2.addEventListener("click", (e)=>{
    hero = e.target.dataset.value;
    step1.hidden = true;
    step2.hidden = false;
    updateProg();
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });

  pickGag1.addEventListener("click", (e)
