// Run with: node test.js
const assert = require("assert");
// Older Node versions don't have these browser helpers.
if (!global.btoa) global.btoa = (s) => Buffer.from(s, "binary").toString("base64");
if (!global.atob) global.atob = (s) => Buffer.from(s, "base64").toString("binary");
if (!global.TextEncoder) global.TextEncoder = require("util").TextEncoder;
if (!global.TextDecoder) global.TextDecoder = require("util").TextDecoder;
const { draw, encode, decode } = require("./matcher.js");

const names = ["Alice", "Bob", "Cara", "Dan", "Eve", "Finn"];
const rules = [
  { a: "Alice", b: "Bob", both: true },
  { a: "Cara", b: "Dan", both: true },
  { a: "Eve", b: "Finn", both: false },
];

for (let i = 0; i < 2000; i++) {
  const r = draw(names, rules);
  assert(r, "draw should succeed");
  assert.deepStrictEqual(Object.keys(r).sort(), [...names].sort());
  assert.deepStrictEqual(Object.values(r).sort(), [...names].sort(), "everyone gets exactly one");
  for (const n of names) assert.notStrictEqual(r[n], n, "nobody gets themself");
  assert(r.Alice !== "Bob" && r.Bob !== "Alice");
  assert(r.Cara !== "Dan" && r.Dan !== "Cara");
  assert(r.Eve !== "Finn");
}

// Impossible: 2 people who can't get each other.
assert.strictEqual(draw(["A", "B"], [{ a: "A", b: "B", both: true }]), null);
// Impossible: 3 people where one couple blocks everything for the third.
assert.strictEqual(
  draw(["A", "B", "C"], [{ a: "A", b: "B", both: true }]),
  null
);

// Link round trip, with non-English names.
const obj = { e: "Noël 🎄", g: "Zoë", r: "José", n: names };
assert.deepStrictEqual(decode(encode(obj)), obj);
assert.strictEqual(decode("garbage!!"), null);
assert(!encode(obj).includes("José"), "recipient not readable in the link");

console.log("All tests passed");
