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

    // ✅ Make nav link active based on current file (tests expect /is-active/)
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    document.querySelectorAll("a[data-testid^='nav-'], .mbk-navcards a").forEach((a) => {
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

    // Inputs (all by data-testid)
    const fullName = qs("input-fullname");
    const company = qs("input-company");
    const age = qs("input-age");
    const food = qs("input-food");
    const kingdom = qs("select-kingdom");
    const zip = qs("input-zip");
    const zipCity = qs("zip-city");
    const email = qs("input-email");
    const phone = qs("input-phone");

    const btnSave = qs("btn-save");
    const btnReset = qs("btn-reset");
    const errorBox = qs("form-error");
    const savedList = qs("saved-list");

    const errFullName = qs("err-fullname");
    const errCompany = qs("err-company");
    const errAge = qs("err-age");
    const errFood = qs("err-food");
    const errKingdom = qs("err-kingdom");
    const errZip = qs("err-zip");
    const errEmail = qs("err-email");
    const errPhone = qs("err-phone");

    const dndSource = qs("dnd-source");
    const dndTarget = qs("dnd-target");
    const dndCount = qs("dnd-count");
    const dndList = qs("dnd-list");

    // Required basics
    if (!btnSave || !btnReset || !savedList || !errorBox) return;

    // Ensure buttons are buttons
    btnSave.setAttribute("type", "button");
    btnReset.setAttribute("type", "button");

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

    // ---------- global error box ----------
    function showError(msg) {
      errorBox.style.display = "block";
      errorBox.textContent = msg || "";
    }
    function clearError() {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }

    // ---------- field errors ----------
    function showFieldError(inputEl, errEl, msg) {
      if (inputEl) inputEl.classList.add("is-invalid");
      if (errEl) {
        errEl.textContent = msg || "";
        errEl.classList.add("show"); // CSS handles visibility
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

    // ---------- ZIP ----------
    function sanitizeZip(value) {
      return (value || "").replace(/\D/g, "").slice(0, 5);
    }

    function updateZipCity() {
      if (!zip || !zipCity) return;
      const z = sanitizeZip(zip.value);
      zip.value = z;
      const city = zipMap[z];
      zipCity.textContent = city ? `Mesto: ${city}` : "Mesto: —";
    }

    zip?.addEventListener("input", () => {
      updateZipCity();
      // live clear if fixed
      if (/^\d{5}$/.test(zip.value) && zipMap[zip.value]) {
        clearFieldError(zip, errZip);
      }
    });

    // ---------- DnD (multi-select + multi-drop) ----------
    const cauldron = new Set();

    function refreshDnDCount() {
      if (!dndCount) return;
      dndCount.textContent = `${cauldron.size} prísad v kotlíku`;
    }

    function renderCauldron() {
      if (!dndList) return;
      dndList.innerHTML = "";
      Array.from(cauldron).forEach((key) => {
        const pill = document.createElement("div");
        pill.className = "cauldron-pill";
        pill.setAttribute("data-testid", "cauldron-pill");
        pill.setAttribute("data-item", key);

        const label = document.createElement("span");
        label.textContent = ING_LABEL[key] || key;

        const x = document.createElement("button");
        x.type = "button";
        x.className = "pill-x";
        x.textContent = "×";
        x.setAttribute("aria-label", "Odstrániť"); // tests use this

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

    // click = multi-select
    dndSource?.addEventListener("click", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const itemEl = el.closest(".dnd-item");
      if (!itemEl) return;
      itemEl.classList.toggle("is-selected");
    });

    // dragstart: include all selected (or just dragged)
    dndSource?.addEventListener("dragstart", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;

      const dragged = el.closest(".dnd-item");
      if (!dragged) return;

      const selected = Array.from(dndSource.querySelectorAll(".dnd-item.is-selected"));
      const list = selected.length ? selected : [dragged];

      const keys = list.map((n) => n.getAttribute("data-item")).filter(Boolean);

      // ✅ IMPORTANT for Playwright dragTo: also put JSON array into text/plain
      const payload = JSON.stringify(keys);

      e.dataTransfer?.setData("application/json", payload);
      e.dataTransfer?.setData("text/plain", payload);
    });

    dndTarget?.addEventListener("dragover", (e) => e.preventDefault());

    dndTarget?.addEventListener("drop", (e) => {
      e.preventDefault();

      let keys = [];
      const json = e.dataTransfer?.getData("application/json");
      const plain = e.dataTransfer?.getData("text/plain");
      const raw = json || plain || "";

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) keys = parsed;
          else if (typeof parsed === "string") keys = [parsed];
        } catch {
          keys = [raw];
        }
      }

      keys.forEach((k) => cauldron.add(k));

      // clear selection highlight after drop
      dndSource?.querySelectorAll(".dnd-item.is-selected").forEach((n) => n.classList.remove("is-selected"));

      refreshDnDCount();
      renderCauldron();
    });

    // ---------- Validation ----------
    const namePattern = /^[A-Za-zÀ-ž\s'-]+$/;
    const foodPattern = /^[A-Za-zÀ-ž\s'-]+$/;
    const phonePattern = /^\+\d{8,15}$/;
    const zipPattern = /^\d{5}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function getValues() {
      const z = sanitizeZip(zip?.value || "");
      return {
        fullName: (fullName?.value || "").trim(),
        company: (company?.value || "").trim(),
        age: (age?.value || "").trim(),
        food: (food?.value || "").trim(),
        kingdom: kingdom?.value || "",
        zip: z,
        city: zipMap[z] || "",
        email: (email?.value || "").trim(),
        phone: (phone?.value || "").replace(/\s+/g, "").trim(),
        ingredients: Array.from(cauldron),
      };
    }

    function validateAndMark(v) {
      clearAllFieldErrors();
      clearError();

      let ok = true;

      // fullName
      if (!v.fullName) {
        showFieldError(fullName, errFullName, "Meno hrdinu je povinné.");
        ok = false;
      } else if (!namePattern.test(v.fullName)) {
        showFieldError(fullName, errFullName, "Meno obsahuje nepovolené znaky.");
        ok = false;
      }

      // age
      if (!v.age) {
        showFieldError(age, errAge, "Vek je povinný.");
        ok = false;
      } else {
        const ageNum = Number(v.age);
        if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
          showFieldError(age, errAge, "Vek musí byť číslo 1–120.");
          ok = false;
        }
      }

      // food
      if (!v.food) {
        showFieldError(food, errFood, "Obľúbené jedlo je povinné.");
        ok = false;
      } else if (!foodPattern.test(v.food)) {
        showFieldError(food, errFood, "Jedlo môže obsahovať len písmená (bez čísiel).");
        ok = false;
      }

      // kingdom
      if (!v.kingdom) {
        showFieldError(kingdom, errKingdom, "Kráľovstvo je povinné.");
        ok = false;
      }

      // zip + city
      if (!zipPattern.test(v.zip)) {
        showFieldError(zip, errZip, "PSČ musí mať presne 5 číslic.");
        ok = false;
      } else if (!v.city) {
        showFieldError(zip, errZip, "Neznáme PSČ – doplň mapu (napr. 02354 → Turzovka).");
        ok = false;
      }

      // email
      if (!v.email) {
        showFieldError(email, errEmail, "E-mail je povinný.");
        ok = false;
      } else if (!emailPattern.test(v.email) || (email && typeof email.checkValidity === "function" && !email.checkValidity())) {
        showFieldError(email, errEmail, "E-mail nemá správny formát (napr. hero@kingdom.sk).");
        ok = false;
      }

      // phone
      if (!v.phone) {
        showFieldError(phone, errPhone, "Telefón je povinný.");
        ok = false;
      } else if (!phonePattern.test(v.phone)) {
        showFieldError(phone, errPhone, "Telefón musí byť +<kód><číslo> (8–15 číslic).");
        ok = false;
      }

      if (!ok) showError("Formulár nie je možné uložiť – oprav zvýraznené polia.");
      return ok;
    }

    // live clear on typing (optional but nice; doesn't break tests)
    [
      [fullName, errFullName],
      [company, errCompany],
      [age, errAge],
      [food, errFood],
      [kingdom, errKingdom],
      [zip, errZip],
      [email, errEmail],
      [phone, errPhone],
    ].forEach(([el, errEl]) => {
      if (!el) return;
      el.addEventListener("input", () => clearFieldError(el, errEl));
      el.addEventListener("change", () => clearFieldError(el, errEl));
    });

    // ---------- Saved cards ----------
    function renderSavedItem(v) {
      const wrapper = document.createElement("div");
      wrapper.className = "saved-item";
      wrapper.setAttribute("data-testid", "saved-item");

      const head = document.createElement("div");
      head.className = "saved-head";

      const title = document.createElement("strong");
      title.textContent = v.fullName;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn-delete";
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
      if (fullName) fullName.value = "";
      if (company) company.value = "";
      if (age) age.value = "";
      if (food) food.value = "";
      if (kingdom) kingdom.value = "";
      if (zip) zip.value = "";
      if (email) email.value = "";
      if (phone) phone.value = "";

      cauldron.clear();
      refreshDnDCount();
      renderCauldron();

      updateZipCity();
      clearAllFieldErrors();
      clearError();

      dndSource?.querySelectorAll(".dnd-item.is-selected").forEach((n) => n.classList.remove("is-selected"));
    }

    btnSave.addEventListener("click", (e) => {
      e.preventDefault?.();

      const v = getValues();
      const ok = validateAndMark(v);
      if (!ok) return;

      savedList.prepend(renderSavedItem(v));
      // ❗️NE-RESETUJEME po uložení (test Age boundaries predpokladá, že polia ostanú vyplnené)
    });

    btnReset.addEventListener("click", (e) => {
      e.preventDefault?.();
      resetForm();
    });

    // init
    updateZipCity();
    refreshDnDCount();
    renderCauldron();
  })();
});
