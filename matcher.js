// Secret Santa matching + link encoding. Works in the browser and in Node (for tests).
(function (root) {
  // rules: array of { a, b, both } meaning "a can't get b" (and b can't get a if both).
  function buildBlocked(names, rules) {
    const blocked = new Map(names.map((n) => [n, new Set([n])]));
    for (const r of rules) {
      if (blocked.has(r.a)) blocked.get(r.a).add(r.b);
      if (r.both && blocked.has(r.b)) blocked.get(r.b).add(r.a);
    }
    return blocked;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Returns { giver: recipient } or null if no valid draw exists.
  function draw(names, rules) {
    if (names.length < 2) return null;
    const blocked = buildBlocked(names, rules);
    // Place the most-restricted givers first so the search finishes fast.
    const givers = shuffle(names).sort((x, y) => blocked.get(y).size - blocked.get(x).size);
    const taken = new Set();
    const result = {};

    function place(i) {
      if (i === givers.length) return true;
      const g = givers[i];
      for (const r of shuffle(names)) {
        if (taken.has(r) || blocked.get(g).has(r)) continue;
        taken.add(r);
        result[g] = r;
        if (place(i + 1)) return true;
        taken.delete(r);
        delete result[g];
      }
      return false;
    }

    return place(0) ? result : null;
  }

  // Light scrambling so the recipient isn't readable just by glancing at the link.
  const KEY = "ho-ho-ho-santa";

  function toB64Url(bytes) {
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromB64Url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  function xor(bytes) {
    return bytes.map((b, i) => b ^ KEY.charCodeAt(i % KEY.length));
  }

  function encode(obj) {
    return toB64Url(xor(new TextEncoder().encode(JSON.stringify(obj))));
  }

  function decode(str) {
    try {
      return JSON.parse(new TextDecoder().decode(xor(fromB64Url(str))));
    } catch (e) {
      return null;
    }
  }

  const api = { draw, encode, decode };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Santa = api;
})(this);
