(function () {
  const $ = (id) => document.getElementById(id);
  const STORE = "secret-santa-setup";

  function route() {
    ["setup", "reveal", "bad-link"].forEach((id) => ($(id).hidden = true));
    const m = location.hash.match(/^#d=(.+)$/);
    if (!m) return showSetup();
    const data = Santa.decode(m[1]);
    if (!data || !data.g || !data.r) return ($("bad-link").hidden = false);
    showReveal(data);
  }

  // ---------- Organizer ----------
  let state = load();
  let setupWired = false;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && Array.isArray(s.people)) return s;
    } catch (e) {}
    return { event: "", people: [], rules: [], links: null };
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }
  function clearDraw() {
    state.links = null;
  }

  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function xButton(onClick, label) {
    const b = el("button", "✕", "x");
    b.type = "button";
    b.title = label;
    b.setAttribute("aria-label", label);
    b.onclick = onClick;
    return b;
  }

  function render() {
    $("event").value = state.event;

    const people = $("people");
    people.replaceChildren();
    state.people.forEach((name) => {
      const li = el("li", name);
      li.append(xButton(() => {
        state.people = state.people.filter((p) => p !== name);
        state.rules = state.rules.filter((r) => r.a !== name && r.b !== name);
        clearDraw(); save(); render();
      }, "Remove " + name));
      people.append(li);
    });

    for (const id of ["rule-a", "rule-b"]) {
      const sel = $(id);
      const prev = sel.value;
      sel.replaceChildren(...state.people.map((p) => {
        const o = el("option", p); o.value = p; return o;
      }));
      if (state.people.includes(prev)) sel.value = prev;
    }
    if ($("rule-a").value === $("rule-b").value && state.people.length > 1) {
      $("rule-b").value = state.people.find((p) => p !== $("rule-a").value);
    }

    const rules = $("rules");
    rules.replaceChildren();
    state.rules.forEach((r, i) => {
      const li = el("li", `${r.a} ${r.both ? "⇄" : "→"} ${r.b}  (${r.both ? "can't get each other" : "can't get"})`);
      li.append(xButton(() => {
        state.rules.splice(i, 1); clearDraw(); save(); render();
      }, "Remove rule"));
      rules.append(li);
    });

    $("draw-error").hidden = true;
    renderLinks();
  }

  function linkFor(giver) {
    const base = location.href.split("#")[0];
    return base + "#d=" + Santa.encode({
      e: state.event, g: giver, r: state.links[giver], n: state.people,
    });
  }

  function renderLinks() {
    const box = $("links");
    if (!state.links) { box.hidden = true; return; }
    box.hidden = false;
    const list = $("link-list");
    list.replaceChildren();
    state.people.forEach((name) => {
      const li = el("li");
      li.append(el("span", name));
      const actions = el("span", null, "actions");
      const copy = el("button", "Copy link", "secondary");
      copy.type = "button";
      copy.onclick = () => copyText(linkFor(name), copy);
      actions.append(copy);
      if (navigator.share) {
        const share = el("button", "Share");
        share.type = "button";
        share.onclick = () => navigator.share({
          title: "Secret Santa",
          text: `Hi ${name}! Here's your Secret Santa link:`,
          url: linkFor(name),
        }).catch(() => {});
        actions.append(share);
      }
      li.append(actions);
      list.append(li);
    });
  }

  function copyText(text, btn) {
    const done = () => {
      const old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = old), 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt("Copy this:", text));
    else prompt("Copy this:", text);
  }

  function wireSetup() {
    if (setupWired) return;
    setupWired = true;

    $("event").addEventListener("input", (e) => {
      state.event = e.target.value; save();
    });

    $("add-person").addEventListener("submit", (e) => {
      e.preventDefault();
      // Allow pasting several names separated by commas or new lines.
      const names = $("person").value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      for (const n of names) {
        if (!state.people.some((p) => p.toLowerCase() === n.toLowerCase())) state.people.push(n);
      }
      $("person").value = "";
      clearDraw(); save(); render();
      $("person").focus();
    });

    $("add-rule").addEventListener("submit", (e) => {
      e.preventDefault();
      const a = $("rule-a").value, b = $("rule-b").value, both = $("rule-both").checked;
      if (!a || !b || a === b) return;
      const dup = state.rules.some((r) => r.a === a && r.b === b && r.both === both);
      if (!dup) state.rules.push({ a, b, both });
      clearDraw(); save(); render();
    });

    $("do-draw").addEventListener("click", () => {
      const err = $("draw-error");
      if (state.people.length < 3) {
        err.textContent = "Add at least 3 people first.";
        err.hidden = false;
        return;
      }
      if (state.links && !confirm("Make a new draw? Old links will no longer match.")) return;
      const result = Santa.draw(state.people, state.rules);
      if (!result) {
        err.textContent = "No draw works with these rules. Try removing a rule.";
        err.hidden = false;
        return;
      }
      state.links = result;
      save(); render();
    });

    $("copy-all").addEventListener("click", (e) => {
      const text = state.people.map((n) => `${n}: ${linkFor(n)}`).join("\n");
      copyText(text, e.target);
    });
  }

  function showSetup() {
    wireSetup();
    render();
    $("setup").hidden = false;
  }

  // ---------- Participant ----------
  function showReveal(d) {
    $("reveal").hidden = false;
    $("r-event").textContent = d.e || "Secret Santa";
    $("r-hello").textContent = `Hi ${d.g}! 🎄`;
    const box = $("r-box"), btn = $("r-draw");
    box.className = "box";
    box.textContent = "🎁";
    btn.hidden = false;
    $("r-result").hidden = true;
    $("r-note").hidden = true;

    btn.onclick = () => {
      btn.hidden = true;
      const pool = (d.n || []).filter((n) => n !== d.g);
      if (!pool.length) pool.push(d.r);
      box.className = "box spin";
      let i = 0, delay = 60;
      const tick = () => {
        box.textContent = pool[i++ % pool.length];
        delay *= 1.12;
        if (delay < 450) setTimeout(tick, delay);
        else finish();
      };
      const finish = () => {
        box.className = "box done";
        box.textContent = d.r;
        const res = $("r-result");
        res.replaceChildren("You're getting a gift for ", el("strong", d.r), " 🎉");
        res.hidden = false;
        $("r-note").hidden = false;
      };
      tick();
    };
  }

  window.addEventListener("hashchange", route);
  route();
})();
