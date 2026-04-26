import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isHTTPS = process.env.COOKIE_SECURE === "true";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isHTTPS, // 🔥 FIXED
    sameSite: isHTTPS ? "none" : "lax", // 🔥 FIXED
  });

  return token;
};