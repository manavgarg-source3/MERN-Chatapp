import test from "node:test";
import assert from "node:assert/strict";
import { getAllowedOrigins, isOriginAllowed } from "../src/lib/runtime.js";

test("configured client origins allow an optional trailing slash", () => {
  const originalClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = "https://chat.example.com/";

  try {
    assert.ok(getAllowedOrigins().includes("https://chat.example.com"));
    assert.equal(isOriginAllowed("https://chat.example.com/"), true);
    assert.equal(isOriginAllowed("https://attacker.example.com"), false);
  } finally {
    if (originalClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalClientUrl;
  }
});

test("requests without an Origin header remain allowed", () => {
  assert.equal(isOriginAllowed(undefined), true);
});
