export const getAllowedOrigins = () =>
  [
    "http://localhost:5173",
    process.env.DEV_CLIENT_URL,
    process.env.CLIENT_URL,
    process.env.NODE_ENV === "production" ? "https://gargx.onrender.com" : null,
  ].filter(Boolean);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
};
