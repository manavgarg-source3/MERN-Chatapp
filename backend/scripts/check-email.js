import "dotenv/config";
import {
  getAppHomeUrl,
  getFriendRequestsUrl,
  sendFriendRequestAcceptedEmail,
  sendFriendRequestEmail,
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
  verifyEmailConnection,
} from "../src/lib/email.js";

try {
  const result = await verifyEmailConnection();
  console.log(`${result.provider} email authentication succeeded.`);

  if (process.argv.includes("--send-all")) {
    const recipient =
      process.argv.find((value) => value.startsWith("--to="))?.slice(5) ||
      process.env.EMAIL_TEST_RECIPIENT ||
      process.env.EMAIL_USER;

    if (!recipient) {
      throw new Error("Set EMAIL_TEST_RECIPIENT, EMAIL_USER, or pass --to=recipient@example.com.");
    }

    await sendVerificationOtpEmail({
      email: recipient,
      fullName: "Email Test",
      otp: "123456",
    });
    console.log("Verification OTP email accepted by provider.");

    await sendPasswordResetEmail({
      email: recipient,
      fullName: "Email Test",
      resetUrl: `${getAppHomeUrl()}reset-password/email-delivery-test`,
    });
    console.log("Password reset email accepted by provider.");

    await sendFriendRequestEmail({
      toEmail: recipient,
      toName: "Email Test",
      fromName: "GargX Test User",
      requestsUrl: getFriendRequestsUrl(),
    });
    console.log("Friend request email accepted by provider.");

    await sendFriendRequestAcceptedEmail({
      toEmail: recipient,
      toName: "Email Test",
      acceptedByName: "GargX Test User",
      chatUrl: getAppHomeUrl(),
    });
    console.log("Friend request accepted email accepted by provider.");
  }
} catch (error) {
  console.error(`Email check failed: ${error.message}`);
  process.exitCode = 1;
}
