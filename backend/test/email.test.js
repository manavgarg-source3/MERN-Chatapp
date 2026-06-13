import test from "node:test";
import assert from "node:assert/strict";
import {
  EmailConfigurationError,
  getGmailTransportConfig,
} from "../src/lib/email.js";

const withEmailEnvironment = (values, callback) => {
  const originalUser = process.env.EMAIL_USER;
  const originalPass = process.env.EMAIL_PASS;

  if (values.user === undefined) delete process.env.EMAIL_USER;
  else process.env.EMAIL_USER = values.user;

  if (values.pass === undefined) delete process.env.EMAIL_PASS;
  else process.env.EMAIL_PASS = values.pass;

  try {
    callback();
  } finally {
    if (originalUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalUser;

    if (originalPass === undefined) delete process.env.EMAIL_PASS;
    else process.env.EMAIL_PASS = originalPass;
  }
};

test("Gmail transport uses secure SMTP and normalizes an app password", () => {
  withEmailEnvironment(
    { user: " sender@gmail.com ", pass: "abcd efgh ijkl mnop" },
    () => {
      const config = getGmailTransportConfig();

      assert.equal(config.host, "smtp.gmail.com");
      assert.equal(config.port, 465);
      assert.equal(config.secure, true);
      assert.deepEqual(config.auth, {
        user: "sender@gmail.com",
        pass: "abcdefghijklmnop",
      });
    }
  );
});

test("Gmail transport rejects missing credentials", () => {
  withEmailEnvironment({ user: undefined, pass: undefined }, () => {
    assert.throws(() => getGmailTransportConfig(), EmailConfigurationError);
  });
});
