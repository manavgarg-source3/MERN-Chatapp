// Temp test helper: read the email-verification OTP for a user, or delete the user.
// Usage: node _tmp_test.mjs otp <email>   |   node _tmp_test.mjs del <email
// >
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const [, , action, email] = process.argv;
const uri = process.env.MONGODB_URI.trim();

await mongoose.connect(uri);
const coll = mongoose.connection.collection("users");

if (action === "otp") {
  const u = await coll.findOne({ email });
  console.log(JSON.stringify({ otp: u?.emailVerificationOtp ?? null, isVerified: u?.isVerified }));
} else if (action === "del") {
  const r = await coll.deleteOne({ email });
  console.log(JSON.stringify({ deleted: r.deletedCount }));
}
await mongoose.disconnect();
