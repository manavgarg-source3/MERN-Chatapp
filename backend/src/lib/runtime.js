const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, "");

export const getAllowedOrigins = () =>
  Array.from(
    new Set(
      [
    "http://localhost:5173",
    process.env.DEV_CLIENT_URL,
    process.env.CLIENT_URL,
    process.env.NODE_ENV === "production" ? "https://gargx.onrender.com" : null,
      ]
        .filter(Boolean)
        .map(normalizeOrigin)
    )
  );

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return getAllowedOrigins().includes(normalizeOrigin(origin));
};
