// =========================
// MythBusters Kingdom - app.js
// KEEP ONLY:
// - index.html
// - dragon.html
// - library.html
// - story.html
// =========================

// ===== Helpers =====
function qs(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("mbk-theme", theme);
}

/**
 * showToast is now compatible with:
 * 1) "global toast" (dragon-style) with toast-title + toast-msg and hidden=true/false
 * 2) "inline alert" (story-style) that shows via .show class and uses textContent
 */
function showToast(title, msg, kind = "ok") {
  const toast = qs("toast");
  if (!toast) return;

  const t = qs("toast-title");
  const m = qs("toast-msg");

  // if structured toast exists, fill title + msg
  if (t || m) {
    if (t) t.textContent = title || "";
    if (m) m.textContent = msg || "";
  } else {
    // fallback for simple alert-like toast
    const text = title && msg ? `${title}: ${msg}` : (title || msg || "");
    toast.textContent = text;
  }

  toast.setAttribute("data-kind", kind);

  // Support both strategies:
  // - story: .show class
  // - dragon: hidden attr
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

    // Active highlighting (nav cards)
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
});
