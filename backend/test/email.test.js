import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import {
  EmailConfigurationError,
  getGmailTransportConfig,
  sendFriendRequestAcceptedEmail,
  sendFriendRequestEmail,
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
  setEmailSenderForTests,
} from "../src/lib/email.js";

const withEmailEnvironment = (values, callback) => {
  const keys = ["EMAIL_USER", "EMAIL_PASS"];
  const originals = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const environment = {
    EMAIL_USER: values.user,
    EMAIL_PASS: values.pass,
  };

  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test("Gmail transport uses secure SMTP and normalizes an app password", () => {
  withEmailEnvironment(
    { user: " sender@gmail.com ", pass: "abcd efgh ijkl mnop" },
    () => {
      const config = getGmailTransportConfig();

      assert.equal(config.host, "smtp.gmail.com");
      assert.equal(config.port, 587);
      assert.equal(config.secure, false);
      assert.equal(config.requireTLS, true);
      assert.equal(config.tls.servername, "smtp.gmail.com");
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

test("Gmail transport supports an IPv4 connection host with Gmail TLS validation", () => {
  withEmailEnvironment(
    { user: "sender@gmail.com", pass: "abcdefghijklmnop" },
    () => {
      const config = getGmailTransportConfig({ host: "142.250.141.108" });

      assert.equal(net.isIPv4(config.host), true);
      assert.equal(config.tls.servername, "smtp.gmail.com");
    }
  );
});

test("every email type creates a complete provider message", async () => {
  const messages = [];
  setEmailSenderForTests(async (message) => {
    messages.push(message);
    return { id: `test-${messages.length}` };
  });

  try {
    await sendVerificationOtpEmail({
      email: "recipient@example.com",
      fullName: "Recipient",
      otp: "654321",
    });
    await sendPasswordResetEmail({
      email: "recipient@example.com",
      fullName: "Recipient",
      resetUrl: "https://app.example.com/reset-password/token",
    });
    await sendFriendRequestEmail({
      toEmail: "recipient@example.com",
      toName: "Recipient",
      fromName: "Sender",
      requestsUrl: "https://app.example.com/?friendRequests=1",
    });
    await sendFriendRequestAcceptedEmail({
      toEmail: "recipient@example.com",
      toName: "Recipient",
      acceptedByName: "Accepter",
      chatUrl: "https://app.example.com/",
    });
  } finally {
    setEmailSenderForTests(undefined);
  }

  assert.equal(messages.length, 4);
  assert.deepEqual(
    messages.map((message) => message.subject),
    [
      "Verify your GargX email",
      "Reset your GargX password",
      "Sender sent you a friend request on GargX",
      "Accepter accepted your friend request on GargX",
    ]
  );
  assert.ok(messages.every((message) => message.to === "recipient@example.com"));
  assert.match(messages[0].html, /654321/);
  assert.match(messages[1].html, /reset-password\/token/);
  assert.match(messages[2].html, /friendRequests=1/);
  assert.match(messages[3].html, /Start Chatting/);
});
