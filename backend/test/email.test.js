import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBrevoEmailPayload,
  EmailConfigurationError,
  getBrevoConfig,
  sendFriendRequestAcceptedEmail,
  sendFriendRequestEmail,
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
  setEmailSenderForTests,
} from "../src/lib/email.js";

const withEmailEnvironment = (values, callback) => {
  const keys = ["BREVO_API_KEY", "SENDER_NAME", "SENDER_EMAIL"];
  const originals = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const environment = {
    BREVO_API_KEY: values.apiKey,
    SENDER_NAME: values.senderName,
    SENDER_EMAIL: values.senderEmail,
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

test("Brevo config reads API key and sender details", () => {
  withEmailEnvironment(
    {
      apiKey: " xkeysib-test ",
      senderName: " GargX Mail ",
      senderEmail: " sender@example.com ",
    },
    () => {
      const config = getBrevoConfig();

      assert.deepEqual(config, {
        apiKey: "xkeysib-test",
        senderName: "GargX Mail",
        senderEmail: "sender@example.com",
      });
    }
  );
});

test("Brevo config defaults sender name and rejects missing essentials", () => {
  withEmailEnvironment({ apiKey: "xkeysib-test", senderEmail: "sender@example.com" }, () => {
    assert.equal(getBrevoConfig().senderName, "GargX");
  });

  withEmailEnvironment({ apiKey: undefined, senderEmail: "sender@example.com" }, () => {
    assert.throws(() => getBrevoConfig(), EmailConfigurationError);
  });

  withEmailEnvironment({ apiKey: "xkeysib-test", senderEmail: undefined }, () => {
    assert.throws(() => getBrevoConfig(), EmailConfigurationError);
  });
});

test("Brevo email payload follows the transactional email API shape", () => {
  withEmailEnvironment(
    {
      apiKey: "xkeysib-test",
      senderName: "GargX",
      senderEmail: "sender@example.com",
    },
    () => {
      assert.deepEqual(
        buildBrevoEmailPayload({
          to: "recipient@example.com",
          subject: "Hello",
          html: "<p>Hi</p>",
        }),
        {
          sender: { name: "GargX", email: "sender@example.com" },
          to: [{ email: "recipient@example.com" }],
          subject: "Hello",
          htmlContent: "<p>Hi</p>",
        }
      );
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
