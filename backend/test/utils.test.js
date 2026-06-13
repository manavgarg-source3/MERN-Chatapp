import test from "node:test";
import assert from "node:assert/strict";
import { generateToken } from "../src/lib/utils.js";

const generateCookieOptions = (environment) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCookieSecure = process.env.COOKIE_SECURE;
  const originalJwtSecret = process.env.JWT_SECRET;
  let cookie;

  process.env.NODE_ENV = environment.nodeEnv;
  process.env.JWT_SECRET = "test-secret";
  if (environment.cookieSecure === undefined) delete process.env.COOKIE_SECURE;
  else process.env.COOKIE_SECURE = environment.cookieSecure;

  try {
    generateToken("user-id", {
      cookie: (name, value, options) => {
        cookie = { name, value, options };
      },
    });
    return cookie;
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalCookieSecure === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = originalCookieSecure;

    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
};

test("production auth cookies are secure by default", () => {
  const cookie = generateCookieOptions({ nodeEnv: "production" });

  assert.equal(cookie.name, "jwt");
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, "none");
});

test("local auth cookies work over HTTP", () => {
  const cookie = generateCookieOptions({ nodeEnv: "development" });

  assert.equal(cookie.options.secure, false);
  assert.equal(cookie.options.sameSite, "lax");
});
