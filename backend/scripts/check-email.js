import "dotenv/config";
import { verifyEmailConnection } from "../src/lib/email.js";

try {
  await verifyEmailConnection();
  console.log("Gmail SMTP authentication succeeded.");
} catch (error) {
  console.error(`Gmail SMTP authentication failed: ${error.message}`);
  process.exitCode = 1;
}
