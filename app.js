// =========================
// MythBusters Kingdom - app.js
// =========================

// ===== Helpers =====
function qs(testId){
  return document.querySelector(`[data-testid="${testId}"]`);
}

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("mbk-theme", theme);
}

function safeToast(title, msg, kind){
  // bezpečná verzia - nikdy nespadne
  if (typeof showToast === "function") showToast(title, msg, kind);
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
  window.__toastTimer = setTimeout(()=> {
    toast.hidden = true;
  }, 3000);
}

// ===== Theme + nav active =====
(function initThemeAndNav(){
  // Theme
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

  // Active highlighting
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  // a) starý dizajn (.nav a)
  document.querySelectorAll(".nav a").forEach(a=>{
    const href = (a.getAttribute("href") || "").toLowerCase();
    if(href === file) a.classList.add("active");
  });

  // b) nový dizajn (nav kartičky .navcard)
  document.querySelectorAll(".mbk-navcards a").forEach(a=>{
    const href = (a.getAttribute("href") || "").toLowerCase();
    a.classList.remove("is-active");
    if(href === file) a.classList.add("is-active");
  });
})();

// ===== Toast close =====
(function initToastClose(){
  const close = qs("toast-close");
  const toast = qs("toast");
  if(!close || !toast) return;
  close.addEventListener("click", ()=> toast.hidden = true);
})();

// ===== 1) Dragon (0–77, random position + random size, click highlight) =====
(function initDragon(){
  const arena = qs("dragon-arena");
  const countEl = qs("dragon-count");
  const addBtn = qs("add-dragon");
  const remBtn = qs("remove-dragon");
  const resetBtn = qs("reset-dragon");
  const banner = qs("dragon-banner");

  if(!arena || !countEl || !addBtn || !remBtn || !resetBtn) return;

  const MAX = 77;
  let stack = [];

  // SK: Stabilné, deterministické ID pre testy (1,2,3...)
  // EN: Stable, deterministic ID for tests (1,2,3...)
  let nextDragonId = 1;

  function updateUI(){
    countEl.textContent = String(stack.length);

    const limitReached = stack.length >= MAX;
    addBtn.disabled = limitReached;
    remBtn.disabled = stack.length === 0;
    resetBtn.disabled = stack.length === 0;

    if(banner) banner.hidden = !limitReached;
  }

  function randPos(){
    const rect = arena.getBoundingClientRect();
    const pad = 35;
    const w = Math.max(1, rect.width - pad * 2);
    const h = Math.max(1, rect.height - pad * 2);
    return { x: pad + Math.random() * w, y: pad + Math.random() * h };
  }

  function deselectAll(){
    stack.forEach(el => el.classList.remove("is-selected"));
  }

  addBtn.addEventListener("click", ()=> {
    if(stack.length >= MAX) return;

    const d = document.createElement("div");
    d.className = "dragon";

    // SK: Playwright selektor pre všetkých drakov
    // EN: Playwright selector for all dragons
    d.setAttribute("data-testid", "dragon");

    // SK: Stabilné ID pre regresné testy (LIFO)
    // EN: Stable ID for regression tests (LIFO)
    d.setAttribute("data-dragon-id", String(nextDragonId++));

    // pozícia
    const {x, y} = randPos();
    d.style.left = x + "px";
    d.style.top = y + "px";

    // náhodná veľkosť (0.75x – 1.45x)
    const scale = 0.75 + Math.random() * 0.70;
    d.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)})`;

    const inner = document.createElement("span");
    inner.textContent = "🐉";
    inner.setAttribute("aria-hidden", "true");
    d.appendChild(inner);

    // klik = highlight (a odhighlight ostatných)
    d.addEventListener("click", ()=> {
      deselectAll();
      d.classList.add("is-selected");
      showToast("Vybraný drak", `Aktuálny počet: ${stack.length}`, "ok");
    });

    // po pridaní automaticky vyber posledného
    deselectAll();
    d.classList.add("is-selected");

    arena.appendChild(d);
    stack.push(d);

    updateUI();
    showToast("Drak pridaný", `Počet drakov: ${stack.length}`, "ok");
  });

  remBtn.addEventListener("click", ()=> {
    if(stack.length === 0) return;

    const last = stack.pop();
    if(last) last.remove();

    // po odstránení zvýrazni nový posledný (ak existuje)
    deselectAll();
    const newLast = stack[stack.length - 1];
    if(newLast) newLast.classList.add("is-selected");

    updateUI();
    showToast("Drak odstránený", `Počet drakov: ${stack.length}`, "warn");
  });

  resetBtn.addEventListener("click", ()=> {
    stack.forEach(el => el.remove());
    stack = [];

    // SK: po resete začneme ID znova od 1 (deterministické)
    // EN: after reset, restart IDs from 1 (deterministic)
    nextDragonId = 1;

    updateUI();
    showToast("Reset", "Všetci draci zmizli.", "ok");
  });

  updateUI();
})();


// ===== 2) Spells (rich rules: ok/warn/error) =====
(function initSpells(){
  const form = qs("spell-form");
  const okBanner = qs("spell-result");
  const warnBanner = qs("spell-warn");
  const errBanner = qs("spell-error");

  const manaEl = qs("mana");
  const levelEl = qs("level");
  const levelVal = qs("level-value");
  const typeEl = qs("spell-type");

  const critEl = qs("crit");
  const incEl = qs("incantation");
  const resetBtn = qs("spells-reset");

  const powerScore = qs("power-score");
  const riskLevel = qs("risk-level");
  const verdict = qs("verdict");
  const details = qs("result-details");

  if(!form || !okBanner || !warnBanner || !errBanner ||
     !manaEl || !levelEl || !typeEl ||
     !powerScore || !riskLevel || !verdict || !details) return;

  function hideAll(){
    okBanner.hidden = true;
    warnBanner.hidden = true;
    errBanner.hidden = true;
  }

  function getIngredient(){
    const checked = document.querySelector('input[name="ing"]:checked');
    return checked ? checked.value : "";
  }

  function ingredientMod(ing){
    // { powerDelta, riskDelta }
    if(ing === "banana") return { p: 120, r: 1 };
    if(ing === "unicorn") return { p: 260, r: 2 };
    if(ing === "bugfix") return { p: -50, r: -2 };
    return { p: 0, r: 0 };
  }

  function typeMult(type){
    if(type === "funny") return { mult: 1.10, risk: 0 };
    if(type === "attack") return { mult: 1.35, risk: 2 };
    if(type === "defense") return { mult: 0.90, risk: -1 };
    if(type === "chaos") return { mult: 1.60, risk: 4 };
    return { mult: 1.0, risk: 0 };
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  // live label for slider
  levelEl.addEventListener("input", ()=>{
    if(levelVal) levelVal.textContent = String(levelEl.value);
  });

  if(resetBtn){
    resetBtn.addEventListener("click", ()=>{
      form.reset();
      if(levelVal) levelVal.textContent = String(levelEl.value || 3);
      hideAll();
      powerScore.textContent = "—";
      riskLevel.textContent = "—";
      verdict.textContent = "—";
      details.textContent = "Vyplň formulár a stlač Vypočítať.";
      showToast("Reset", "Formulár bol resetnutý.", "ok");
    });
  }

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    hideAll();

    const mana = Number(manaEl.value);
    const level = Number(levelEl.value);
    const type = typeEl.value;
    const ing = getIngredient();
    const crit = !!(critEl && critEl.checked);
    const inc = (incEl && incEl.value ? incEl.value.trim() : "");

    // basic required validation
    const basicOk =
      Number.isFinite(mana) && mana >= 0 && mana <= 999 &&
      Number.isFinite(level) && level >= 1 && level <= 10 &&
      !!type && !!ing;

    if(!basicOk){
      errBanner.textContent = "Vyplň všetky povinné polia správne (mana/level/škola/ingrediencia).";
      errBanner.hidden = false;
      showToast("Chyba", "Neplatný formulár.", "bad");
      return;
    }

    // incantation rules
    if(inc && inc.length < 3){
      errBanner.textContent = "Inkantácia musí mať aspoň 3 znaky (alebo ju nechaj prázdnu).";
      errBanner.hidden = false;
      showToast("Chyba", "Inkantácia je príliš krátka.", "bad");
      return;
    }

    // calculate base
    const base = mana * (level * 10); // 0..9990
    const t = typeMult(type);
    const ingM = ingredientMod(ing);

    let power = Math.round(base * t.mult + ingM.p);
    if(crit) power = Math.round(power * 1.25);

    // risk score
    let risk = 3; // baseline
    risk += t.risk + ingM.risk;
    if(crit) risk += 1;
    if(type === "chaos" && crit) risk += 2;

    // overload business rule (special error)
    if(type === "chaos" && mana > 900 && level === 10 && crit){
      errBanner.textContent = "Preťaženie: Chaos + max mana + level 10 + kritický zásah → kúzlo zlyhalo (simulácia business pravidla).";
      errBanner.hidden = false;
      powerScore.textContent = String(power);
      riskLevel.textContent = "HIGH";
      verdict.textContent = "ERROR";
      details.textContent = "Kombinácia je zámerne zakázaná, aby sa dali testovať business pravidlá.";
      showToast("Overload", "Chaos kúzlo zlyhalo.", "bad");
      return;
    }

    // clamp & labels
    power = clamp(power, 0, 9999);
    risk = clamp(risk, 0, 10);

    let riskLabel = "LOW";
    if(risk >= 4) riskLabel = "MED";
    if(risk >= 7) riskLabel = "HIGH";

    let bannerText = `Výpočet OK. Power=${power}, Risk=${riskLabel}.`;
    let warned = false;

    // warning conditions
    if(type === "chaos" && risk >= 7){
      warned = true;
      bannerText = `Pozor: Chaos kúzlo je nestabilné. Power=${power}, Risk=${riskLabel}.`;
    }
    if(inc && inc.toLowerCase().includes("flaky")){
      warned = true;
      bannerText = `Warning: inkantácia obsahuje "flaky" (testerský hriech). Power=${power}, Risk=${riskLabel}.`;
    }

    // write result box
    powerScore.textContent = String(power);
    riskLevel.textContent = riskLabel;
    verdict.textContent = warned ? "WARN" : "OK";

    details.textContent =
      `Základ: mana(${mana}) × level(${level}×10) = ${base}. ` +
      `Typ: ${type} (×${t.mult}). Ingrediencia: ${ing} (${ingM.p >= 0 ? "+" : ""}${ingM.p}). ` +
      `Crit: ${crit ? "áno (+25%)" : "nie"}. ` +
      `Risk score: ${risk}/10.`;

    // banners
    if(warned){
      warnBanner.textContent = bannerText;
      warnBanner.hidden = false;
      showToast("Warning", "Kúzlo má riziko alebo zakázané slovo.", "warn");
    }else{
      okBanner.textContent = bannerText;
      okBanner.hidden = false;
      showToast("OK", "Výpočet úspešný.", "ok");
    }
  });
})();

// ===== 3) Library (Spelleology style: filter after 3 chars) =====
(function initLibrary(){
  const input = qs("search");
  const cloud = qs("spell-cloud");
  const min3 = qs("min3-hint");
  const noRes = qs("no-results");

  if(!input || !cloud || !min3 || !noRes) return;

  const spells = [
    "Smiechus Maximus 😂",
    "Žluťoučký kůň úpěl ďábelské ódy 123",
    "Čarodejnícky test: 'Nech žije CI/CD!'",
    "Aquilae-Æther 77% / Δx=3.14",
    "Dona nobis pacemrio (lat.)",
    "Lorem ipsum — dolor sit amet!",
    "EXPLODE_FLAMES_ON_TARGET()",
    "counters ‘prior incantato’",
    "🔒 opens locked objects #42",
    "reveals invisible ink ✍️",
    "murderS opponent? (nope) ⚠️",
    "makes objects hard — v2.0",
    "Smiechus Mrzutisimm 😂",
    "binds body – unforgivable ☠️",
    "echoes mostrio recentimm spells…",
    "renders immtarget Lorem ipsum",
    "universal://spell?name=QA&mode=stable",
    "regex: ^[A-ZĽŠČŤŽ]+$",
    "špeciálne znakysible: %$#@!*()[]{}",
    "Česko-Slovenský mix: Příliš žluťoučký 🧡",
    "Kúzlo: „Zamrzni, flaky test!“",
    "ΜΥΘΟΣ (Greek-ish) + čísla 007",
    "漢字 / hieroglyph vibes / ✨",
    "Testovací Lorem ipsum: Arrange–Act–Assert",
    "Slovensko-Český mix: Too big 🍻",
    "UAT approvedsible ✅ 2026-01-27",
    "panic('missing ;') — just kidding",
    "kubernetes: pod/restart/rollback",
    "Sphinx of black quartz, riojudge my vow",
    "Příšerně žluťoučký řetězec—diakritika!",
    "Náhodný reťazec: A1 b2 C3 d4",
    "E=mc^2; ∑(bugs)=∞"
  ];

  function pickSize(i){
    if(i % 7 === 0) return "l";
    if(i % 3 === 0) return "m";
    return "s";
  }

  function normalizeForSearch(str){
    return String(str).toLowerCase();
  }

  function render(list){
    cloud.innerHTML = "";
    list.forEach((txt, idx)=>{
      const el = document.createElement("span");
      el.className = "spell-str";
      el.setAttribute("data-testid", "spell-str");
      el.setAttribute("data-size", pickSize(idx));
      el.textContent = txt;
      cloud.appendChild(el);
    });
  }

  function applyFilter(){
    const qRaw = input.value || "";
    const q = qRaw.trim();

    if(q.length < 3){
      min3.hidden = false;
      noRes.hidden = true;
      render(spells);
      return;
    }

    min3.hidden = true;

    const nq = normalizeForSearch(q);
    const list = spells.filter(s => normalizeForSearch(s).includes(nq));

    noRes.hidden = list.length !== 0;
    render(list);
  }

  input.addEventListener("input", applyFilter);

  render(spells);
  applyFilter();
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

  const prog = qs("wizard-progress");
  function setProg(p){
    if(prog) prog.style.width = p + "%";
  }
  function updateProg(){
    if(!step1.hidden) { setProg(33); return; }
    if(!step2.hidden) { setProg(66); return; }
    if(!step3.hidden) { setProg(100); return; }
    setProg(33);
  }

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
    done.hidden = true;
    updateProg();
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });

  pickHero2.addEventListener("click", (e)=>{
    hero = e.target.dataset.value;
    step1.hidden = true;
    step2.hidden = false;
    done.hidden = true;
    updateProg();
    showToast("Wizard", `Vybraná postava: ${hero}`, "ok");
  });

  pickGag1.addEventListener("click", (e)=>{
    gag = e.target.dataset.value;
    goStep3();
    showToast("Wizard", `Gag: ${gag}`, "warn");
  });

  pickGag2.addEventListener("click", (e)=>{
    gag = e.target.dataset.value;
    goStep3();
    showToast("Wizard", `Gag: ${gag}`, "warn");
  });

  confirm.addEventListener("click", ()=>{
    done.hidden = false;
    updateProg();
    showToast("Obsadené!", "Kamera ide, QA tiež.", "ok");
  });

  resetBtn.addEventListener("click", ()=>{
    reset();
    showToast("Reset", "Wizard bol resetnutý.", "ok");
  });

  reset();
})();

// ===== 5) Wait =====
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

// ===== 6) Table =====
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
    list.forEach(r=>{
      const tr = document.createElement("tr");
      tr.setAttribute("data-testid", "myth-row");
      tr.setAttribute("data-row-id", r.id);

      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.myth}</td>
        <td>${r.sev}</td>
        <td>${r.status}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  mythFilter.addEventListener("input", render);
  sortBtn.addEventListener("click", ()=>{
    sortDesc = !sortDesc;
    showToast("Sort", `Poradie: ${sortDesc ? "DESC" : "ASC"}`, "ok");
    render();
  });

  render();
})();
