// =========================
// MythBusters Kingdom - app.js
// =========================

// ===== Helpers =====
function qs(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("mbk-theme", theme);
}

function showToast(title, msg, kind = "ok") {
  const toast = qs("toast");
  if (!toast) return;

  const t = qs("toast-title");
  const m = qs("toast-msg");

  if (t || m) {
    if (t) t.textContent = title || "";
    if (m) m.textContent = msg || "";
  } else {
    const text = title && msg ? `${title}: ${msg}` : (title || msg || "");
    toast.textContent = text;
  }

  toast.setAttribute("data-kind", kind);

  if ("hidden" in toast) toast.hidden = false;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    if ("hidden" in toast) toast.hidden = true;
  }, 3000);
}

// ===== Init after DOM ready =====
document.addEventListener("DOMContentLoaded", () => {
  // ===== Theme + nav active =====
  (function initThemeAndNav() {
    const saved = localStorage.getItem("mbk-theme") || "dark";
    setTheme(saved);

    const toggle = qs("theme-toggle");
    if (toggle) {
      const setLabel = () => {
        const cur = document.documentElement.getAttribute("data-theme") || "dark";
        toggle.textContent = cur === "light" ? "🌙 Dark" : "☀️ Light";
      };
      setLabel();

      toggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        setTheme(next);
        setLabel();
        showToast("Téma zmenená", `Aktívna téma: ${next}`, "ok");
      });
    }

    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".mbk-navcards a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      a.classList.remove("is-active");
      if (href === file) a.classList.add("is-active");
    });
  })();

  // ===== Toast close (optional) =====
  (function initToastClose() {
    const close = qs("toast-close");
    const toast = qs("toast");
    if (!close || !toast) return;
    close.addEventListener("click", () => {
      toast.classList.remove("show");
      if ("hidden" in toast) toast.hidden = true;
    });
  })();

  // ===== 1) Dragon =====
  (function initDragon() {
    const arena = qs("dragon-arena");
    const countEl = qs("dragon-count");
    const addBtn = qs("add-dragon");
    const remBtn = qs("remove-dragon");
    const resetBtn = qs("reset-dragon");
    const banner = qs("dragon-banner");

    if (!arena || !countEl || !addBtn || !remBtn || !resetBtn) return;

    const MAX = 77;
    let stack = [];
    let nextDragonId = 1;

    function updateUI() {
      countEl.textContent = String(stack.length);
      const limitReached = stack.length >= MAX;

      addBtn.disabled = limitReached;
      remBtn.disabled = stack.length === 0;
      resetBtn.disabled = stack.length === 0;

      if (banner) banner.hidden = !limitReached;
    }

    function randPos() {
      const rect = arena.getBoundingClientRect();
      const pad = 35;
      const w = Math.max(1, rect.width - pad * 2);
      const h = Math.max(1, rect.height - pad * 2);
      return { x: pad + Math.random() * w, y: pad + Math.random() * h };
    }

    function deselectAll() {
      stack.forEach((el) => el.classList.remove("is-selected"));
    }

    addBtn.addEventListener("click", () => {
      if (stack.length >= MAX) return;

      const d = document.createElement("div");
      d.className = "dragon";
      d.setAttribute("data-testid", "dragon");
      d.setAttribute("data-dragon-id", String(nextDragonId));
      nextDragonId += 1;

      const { x, y } = randPos();
      d.style.left = x + "px";
      d.style.top = y + "px";

      const scale = 0.75 + Math.random() * 0.7;
      d.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)})`;

      const inner = document.createElement("span");
      inner.textContent = "🐉";
      inner.setAttribute("aria-hidden", "true");
      d.appendChild(inner);

      d.addEventListener("click", () => {
        deselectAll();
        d.classList.add("is-selected");
        showToast("Vybraný drak", `Aktuálny počet: ${stack.length}`, "ok");
      });

      deselectAll();
      d.classList.add("is-selected");

      arena.appendChild(d);
      stack.push(d);

      updateUI();
      showToast("Drak pridaný", `Počet drakov: ${stack.length}`, "ok");
    });

    remBtn.addEventListener("click", () => {
      if (stack.length === 0) return;

      const last = stack.pop();
      if (last) last.remove();

      deselectAll();
      const newLast = stack[stack.length - 1];
      if (newLast) newLast.classList.add("is-selected");

      updateUI();
      showToast("Drak odstránený", `Počet drakov: ${stack.length}`, "warn");
    });

    resetBtn.addEventListener("click", () => {
      stack.forEach((el) => el.remove());
      stack = [];
      nextDragonId = 1;

      updateUI();
      showToast("Reset", "Všetci draci zmizli.", "ok");
    });

    updateUI();
  })();

  // ===== 2) Library =====
  (function initLibrary() {
    const input = qs("search");
    const cloud = qs("spell-cloud");
    const min3 = qs("min3-hint");
    const noRes = qs("no-results");

    if (!input || !cloud || !min3 || !noRes) return;

    const spells = [
      "lumos — creates light at wand tip",
      "lumos maxima — floods the room with light",
      "lumos: quick light ✨",
      "luminary-lumos protocol v2.0 (test string)",
      "acc.io — accidental summon (acc + io)",
      "accio — summons an object",
      "accio backpack — summons a pack (longer)",
      "accio: small objects → big chaos",
      "guardia — guard the gate",
      "guardium leviosa — lifts and guards (guard)",
      "guardian shield — guard/guard/guard",
      "invisibilis — reveals invisible ink (invis)",
      "invis ink detector — find invis marks",
      "lockius — magically locks door (lock)",
      "unlockius — unlocks locked objects (lock/unlock)",
      "counterspell — stops any current spells (counter)",
      "counter prior incantato — counters ‘prior incantato’ (counter)",
      "memory erase — erases memories (memory)",
      "memory rewrite — edits memory safely (?)",
      "wand compass — makes wand act like a compass (wand)",
      "wand water jet — shoots water from wand (wand)",
      "wand: repairs things — simple fix",
      "renders target immobile. (short)",
      "renders target immobile… but with extra dots…",
      "makes objects hard — v2.0",
      "opens locked objects — lock + open",
      "opens locked objects quickly (lock + open)",
      "reveals invisible ink / invis + reveal",
      "keeps muggles away — guard + shield",
      "echoes most recent spells (memory + echo)",
      "cleans up messes — simple utility",
      "destroys ectoplasm (remains of ghosts) — very long description for wrapping",
      "binds body – unforgivable ☠️",
      "controls a person — unforgivable",
      "stops weather effect spells to stop (weird long)",
    ];

    function pickSize(i) {
      if (i % 13 === 0) return "xl";
      if (i % 7 === 0) return "l";
      if (i % 3 === 0) return "m";
      return "s";
    }

    function normalizeForSearch(str) {
      return String(str).toLowerCase();
    }

    function clearSelection() {
      cloud.querySelectorAll(".spell-str.is-selected").forEach((el) =>
        el.classList.remove("is-selected")
      );
    }

    function render(list) {
      cloud.innerHTML = "";
      list.forEach((txt, idx) => {
        const el = document.createElement("span");
        el.className = "spell-str";
        el.setAttribute("data-testid", "spell-str");
        el.setAttribute("data-size", pickSize(idx));
        el.textContent = txt;

        el.addEventListener("click", () => {
          clearSelection();
          el.classList.add("is-selected");
          showToast("Zaklínadlo vybrané", txt, "ok");
        });

        cloud.appendChild(el);
      });
    }

    function applyFilter() {
      const q = (input.value || "").trim();

      if (q.length < 3) {
        min3.hidden = false;
        noRes.hidden = true;
        render(spells);
        clearSelection();
        return;
      }

      min3.hidden = true;

      const nq = normalizeForSearch(q);
      const list = spells.filter((s) => normalizeForSearch(s).includes(nq));

      noRes.hidden = list.length !== 0;
      render(list);
      clearSelection();
    }

    input.addEventListener("input", applyFilter);

    render(spells);
    applyFilter();
  })();

  // ===== 3) Forms =====
  (function initFormsPage() {
    const root = document.querySelector('[data-testid="page-forms"]');
    if (!root) return;

    const fullName = root.querySelector('[data-testid="input-fullname"]');
    const company = root.querySelector('[data-testid="input-company"]');
    const age = root.querySelector('[data-testid="input-age"]');
    const food = root.querySelector('[data-testid="input-food"]');
    const kingdom = root.querySelector('[data-testid="select-kingdom"]');
    const zip = root.querySelector('[data-testid="input-zip"]');
    const zipCity = root.querySelector('[data-testid="zip-city"]');
    const email = root.querySelector('[data-testid="input-email"]');
    const phone = root.querySelector('[data-testid="input-phone"]');

    const errFullName = root.querySelector('[data-testid="err-fullname"]');
    const errCompany = root.querySelector('[data-testid="err-company"]');
    const errAge = root.querySelector('[data-testid="err-age"]');
    const errFood = root.querySelector('[data-testid="err-food"]');
    const errKingdom = root.querySelector('[data-testid="err-kingdom"]');
    const errZip = root.querySelector('[data-testid="err-zip"]');
    const errEmail = root.querySelector('[data-testid="err-email"]');
    const errPhone = root.querySelector('[data-testid="err-phone"]');

    const btnSave = root.querySelector('[data-testid="btn-save"]');
    const btnReset = root.querySelector('[data-testid="btn-reset"]');
    const errorBox = root.querySelector('[data-testid="form-error"]');

    const savedList = root.querySelector('[data-testid="saved-list"]');

    const dndSource = root.querySelector('[data-testid="dnd-source"]');
    const dndTarget = root.querySelector('[data-testid="dnd-target"]');
    const dndCount = root.querySelector('[data-testid="dnd-count"]');
    const dndList = root.querySelector('[data-testid="dnd-list"]');

    if (
      !fullName || !company || !age || !food || !kingdom || !zip || !zipCity || !email || !phone ||
      !btnSave || !btnReset || !errorBox || !savedList ||
      !dndSource || !dndTarget || !dndCount || !dndList
    ) return;

    const zipMap = {
      "81101": "Bratislava",
      "04001": "Košice",
      "01001": "Žilina",
      "97401": "Banská Bystrica",
      "91701": "Trnava",
      "02354": "Turzovka",
    };

    const ING_LABEL = {
      "unicorn-hair": "Vlások jednorožca",
      "dragon-scale": "Dračia šupina",
      "moon-dust": "Mesačný prach",
    };

    // ---------- helpers (errors + invalid fields) ----------
    function showError(msg) {
      errorBox.style.display = "block";
      errorBox.textContent = msg;
    }
    function clearError() {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }

    function setFieldError(inputEl, errEl, msg) {
      if (inputEl) inputEl.classList.add("is-invalid");
      if (errEl) {
        errEl.textContent = msg || "";
        errEl.classList.add("show");
      }
    }
    function clearFieldError(inputEl, errEl) {
      if (inputEl) inputEl.classList.remove("is-invalid");
      if (errEl) {
        errEl.textContent = "";
        errEl.classList.remove("show");
      }
    }
    function clearAllFieldErrors() {
      clearFieldError(fullName, errFullName);
      clearFieldError(company, errCompany);
      clearFieldError(age, errAge);
      clearFieldError(food, errFood);
      clearFieldError(kingdom, errKingdom);
      clearFieldError(zip, errZip);
      clearFieldError(email, errEmail);
      clearFieldError(phone, errPhone);
    }

    // ---------- zip ----------
    function sanitizeZip(value) {
      return (value || "").replace(/\D/g, "").slice(0, 5);
    }
    function updateZipCity() {
      const z = sanitizeZip(zip.value);
      zip.value = z;
      const city = zipMap[z];
      zipCity.textContent = city ? `Mesto: ${city}` : "Mesto: —";
    }
    zip.addEventListener("input", () => {
      updateZipCity();
      // live-clear error if fixed
      if (/^\d{5}$/.test(zip.value) && zipMap[zip.value]) {
        clearFieldError(zip, errZip);
      }
    });

    // ---------- DnD: multi-select + move ----------
    const cauldron = new Set();

    function refreshDnDCount() {
      dndCount.textContent = `${cauldron.size} prísad v kotlíku`;
    }

    function renderCauldron() {
      dndList.innerHTML = "";
      Array.from(cauldron).forEach((key) => {
        const pill = document.createElement("div");
        pill.className = "cauldron-pill";
        pill.setAttribute("data-testid", "cauldron-pill");
        pill.setAttribute("data-item", key);

        const label = document.createElement("span");
        label.textContent = ING_LABEL[key] || key;

        const x = document.createElement("button");
        x.className = "pill-x";
        x.type = "button";
        x.textContent = "×";
        x.setAttribute("aria-label", "Odstrániť");
        x.addEventListener("click", () => {
          cauldron.delete(key);
          refreshDnDCount();
          renderCauldron();
        });

        pill.appendChild(label);
        pill.appendChild(x);
        dndList.appendChild(pill);
      });
    }

    function setOver(state) {
      if (state) dndTarget.classList.add("over");
      else dndTarget.classList.remove("over");
    }

    // klik = vyber (multiselect)
    dndSource.addEventListener("click", (e) => {
      const el = e.target;
      if (!el || !(el instanceof HTMLElement)) return;
      const itemEl = el.closest(".dnd-item");
      if (!itemEl) return;
      itemEl.classList.toggle("is-selected");
    });

    // dragstart: ak je vybraté viac, prenesiem všetky vybraté; inak len tú jednu
    dndSource.addEventListener("dragstart", (e) => {
      const el = e.target;
      if (!el || !(el instanceof HTMLElement)) return;

      const dragged = el.closest(".dnd-item");
      if (!dragged) return;

      const selected = Array.from(dndSource.querySelectorAll(".dnd-item.is-selected"));
      const list = selected.length
        ? selected
        : [dragged];

      const keys = list.map((n) => n.getAttribute("data-item")).filter(Boolean);

      e.dataTransfer.setData("application/json", JSON.stringify(keys));
      e.dataTransfer.setData("text/plain", keys[0] || "");
    });

    dndTarget.addEventListener("dragover", (e) => { e.preventDefault(); setOver(true); });
    dndTarget.addEventListener("dragleave", () => setOver(false));

    dndTarget.addEventListener("drop", (e) => {
      e.preventDefault();
      setOver(false);

      let keys = [];
      const json = e.dataTransfer.getData("application/json");
      if (json) {
        try { keys = JSON.parse(json); } catch { keys = []; }
      }
      if (!keys.length) {
        const single = e.dataTransfer.getData("text/plain");
        if (single) keys = [single];
      }

      keys.forEach((k) => cauldron.add(k));

      // po drop: odznač vybraté (aby bolo jasné, že sa to prenieslo)
      dndSource.querySelectorAll(".dnd-item.is-selected").forEach((n) => n.classList.remove("is-selected"));

      refreshDnDCount();
      renderCauldron();
    });

    // ---------- validation ----------
    const namePattern = /^[A-Za-zÀ-ž\s'-]+$/;
    const foodPattern = /^[A-Za-zÀ-ž\s'-]+$/;
    const phonePattern = /^\+\d{8,15}$/;
    const zipPattern = /^\d{5}$/;

    // jednoduchý, ale praktický email regex + zároveň HTML5 checkValidity()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function getValues() {
      const z = sanitizeZip(zip.value);
      return {
        fullName: fullName.value.trim(),
        company: company.value.trim(),
        age: age.value.trim(),
        food: food.value.trim(),
        kingdom: kingdom.value,
        zip: z,
        city: zipMap[z] || "",
        email: email.value.trim(),
        phone: phone.value.trim(),
        ingredients: Array.from(cauldron),
      };
    }

    function validateAndMark(v) {
      clearAllFieldErrors();

      // fullName
      if (!v.fullName) {
        setFieldError(fullName, errFullName, "Meno hrdinu je povinné.");
        return false;
      }
      if (!namePattern.test(v.fullName)) {
        setFieldError(fullName, errFullName, "Meno obsahuje nepovolené znaky.");
        return false;
      }

      // age
      if (!v.age) {
        setFieldError(age, errAge, "Vek je povinný.");
        return false;
      }
      const ageNum = Number(v.age);
      if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
        setFieldError(age, errAge, "Vek musí byť číslo 1–120.");
        return false;
      }

      // food
      if (!v.food) {
        setFieldError(food, errFood, "Obľúbené jedlo je povinné.");
        return false;
      }
      if (!foodPattern.test(v.food)) {
        setFieldError(food, errFood, "Jedlo môže obsahovať len písmená (bez čísiel).");
        return false;
      }

      // kingdom
      if (!v.kingdom) {
        setFieldError(kingdom, errKingdom, "Kráľovstvo je povinné.");
        return false;
      }

      // zip + city
      if (!zipPattern.test(v.zip)) {
        setFieldError(zip, errZip, "PSČ musí mať presne 5 číslic.");
        return false;
      }
      if (!v.city) {
        setFieldError(zip, errZip, "Neznáme PSČ – doplň mapu (napr. 02354 → Turzovka).");
        return false;
      }

      // email (✅ oprava)
      if (!v.email) {
        setFieldError(email, errEmail, "E-mail je povinný.");
        return false;
      }
      // HTML5 check + regex
      if (!email.checkValidity() || !emailPattern.test(v.email)) {
        setFieldError(email, errEmail, "E-mail nemá správny formát (napr. hero@kingdom.sk).");
        return false;
      }

      // phone
      if (!v.phone) {
        setFieldError(phone, errPhone, "Telefón je povinný.");
        return false;
      }
      if (!phonePattern.test(v.phone)) {
        setFieldError(phone, errPhone, "Telefón musí byť +<kód><číslo> (8–15 číslic).");
        return false;
      }

      return true;
    }

    // live clear on typing for required fields (aby bolo “user-friendly”)
    [
      [fullName, errFullName],
      [age, errAge],
      [food, errFood],
      [kingdom, errKingdom],
      [email, errEmail],
      [phone, errPhone],
    ].forEach(([el, errEl]) => {
      el.addEventListener("input", () => clearFieldError(el, errEl));
      el.addEventListener("change", () => clearFieldError(el, errEl));
    });

    // ---------- save cards ----------
    function renderSavedItem(v) {
      const wrapper = document.createElement("div");
      wrapper.className = "saved-item";
      wrapper.setAttribute("data-testid", "saved-item");

      const head = document.createElement("div");
      head.className = "saved-head";

      const title = document.createElement("strong");
      title.textContent = v.fullName;

      const del = document.createElement("button");
      del.className = "btn-delete";
      del.type = "button";
      del.textContent = "Vymazať";
      del.setAttribute("data-testid", "btn-delete-card");
      del.addEventListener("click", () => wrapper.remove());

      head.appendChild(title);
      head.appendChild(del);

      const kv = document.createElement("div");
      kv.className = "kv";
      kv.innerHTML = `
        <div>Firma</div><div>${v.company || "—"}</div>
        <div>Vek</div><div>${v.age}</div>
        <div>Jedlo</div><div>${v.food}</div>
        <div>Kráľovstvo</div><div>${v.kingdom}</div>
        <div>PSČ</div><div>${v.zip} (${v.city})</div>
        <div>E-mail</div><div>${v.email}</div>
        <div>Telefón</div><div>${v.phone}</div>
        <div>Prísady</div><div>${v.ingredients.length ? v.ingredients.join(", ") : "—"}</div>
      `;

      wrapper.appendChild(head);
      wrapper.appendChild(kv);
      return wrapper;
    }

    function resetForm() {
      fullName.value = "";
      company.value = "";
      age.value = "";
      food.value = "";
      kingdom.value = "";
      zip.value = "";
      email.value = "";
      phone.value = "";

      cauldron.clear();
      refreshDnDCount();
      renderCauldron();

      updateZipCity();
      clearError();
      clearAllFieldErrors();

      // vráť aj selected state z poličky
      dndSource.querySelectorAll(".dnd-item.is-selected").forEach((n) => n.classList.remove("is-selected"));
    }

    btnReset.addEventListener("click", resetForm);

    btnSave.addEventListener("click", () => {
      clearError();
      const v = getValues();

      const ok = validateAndMark(v);
      if (!ok) {
        showError("Formulár nie je možné uložiť – oprav zvýraznené polia.");
        return;
      }

      savedList.prepend(renderSavedItem(v));
      resetForm();
    });

    // init
    updateZipCity();
    refreshDnDCount();
    renderCauldron();
  })();
});
