/**
 * Serves the ICE server list (STUN + TURN) to the WebRTC client at call time.
 *
 * Why this lives on the backend instead of being baked into the frontend:
 *  - TURN credentials stay server-side (Render env vars), out of the public JS bundle.
 *  - Credentials can be rotated/changed without rebuilding & redeploying the frontend.
 *  - We can fetch short-lived (ephemeral) TURN credentials from a provider per request.
 *
 * TURN is what makes calls work across different networks (e.g. one peer on Wi-Fi,
 * the other on mobile data). On the same Wi-Fi peers reach each other directly, so a
 * missing/broken TURN server only shows up once the two devices are on different NATs.
 *
 * Configure ONE of these in the backend environment:
 *
 *   A) Metered (free 50GB/mo — recommended). Create an app at https://dashboard.metered.ca
 *      then set:
 *        METERED_DOMAIN=yourapp.metered.live
 *        METERED_API_KEY=xxxxxxxxxxxxxxxx
 *      We fetch fresh credentials from Metered on each request.
 *
 *   B) Any self-hosted / third-party TURN (coturn, Cloudflare, Twilio, …):
 *        TURN_URLS=turn:your.turn:3478,turns:your.turn:5349
 *        TURN_USERNAME=user
 *        TURN_CREDENTIAL=pass
 *
 * If neither is set we fall back to public best-effort servers (Google STUN +
 * Open Relay), which often fail across cellular NAT — so set one of the above for
 * reliable cross-network calling.
 */

const STUN_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
];

// Fallback TURN used only if the Metered API can't be reached. These are static
// long-lived Metered credentials (less ideal than the freshly-fetched ones, but
// real working relays — unlike the old public Open Relay defaults).
const FALLBACK_TURN = [
  { urls: "stun:stun.relay.metered.ca:80" },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "e8a56513b2e5fe0aedfc0349",
    credential: "G5gbtY2OcAC0r2AD",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "e8a56513b2e5fe0aedfc0349",
    credential: "G5gbtY2OcAC0r2AD",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "e8a56513b2e5fe0aedfc0349",
    credential: "G5gbtY2OcAC0r2AD",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "e8a56513b2e5fe0aedfc0349",
    credential: "G5gbtY2OcAC0r2AD",
  },
];

// Cache Metered credentials briefly so a burst of calls doesn't hammer their API.
let meteredCache = { servers: null, expiresAt: 0 };

const fetchMeteredServers = async () => {
  const domain = process.env.METERED_DOMAIN;
  const apiKey = process.env.METERED_API_KEY;
  if (!domain || !apiKey) return null;

  const now = Date.now();
  if (meteredCache.servers && meteredCache.expiresAt > now) {
    return meteredCache.servers;
  }

  const url = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(
    apiKey
  )}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error("Metered TURN fetch failed:", res.status);
      return null;
    }
    const servers = await res.json();
    if (!Array.isArray(servers) || servers.length === 0) return null;
    // Metered creds are typically valid for hours; re-fetch every 10 min to be safe.
    meteredCache = { servers, expiresAt: now + 10 * 60 * 1000 };
    return servers;
  } catch (error) {
    console.error("Metered TURN fetch error:", error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const buildStaticTurn = () => {
  const urls = process.env.TURN_URLS;
  if (!urls) return null;
  return [
    {
      urls: urls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
      username: process.env.TURN_USERNAME || undefined,
      credential: process.env.TURN_CREDENTIAL || undefined,
    },
  ];
};

export const getIceServers = async (req, res) => {
  try {
    const iceServers = [...STUN_SERVERS];

    const metered = await fetchMeteredServers();
    const staticTurn = buildStaticTurn();

    if (metered) {
      // Metered's payload already includes its own STUN + TURN entries.
      iceServers.push(...metered);
    }
    if (staticTurn) {
      iceServers.push(...staticTurn);
    }
    if (!metered && !staticTurn) {
      // No real TURN configured — use the public best-effort relay so 1:1 calls
      // at least have a chance across NAT (unreliable; configure TURN for prod).
      iceServers.push(...FALLBACK_TURN);
    }

    // Let clients cache for a minute; creds rotate slower than that.
    res.set("Cache-Control", "private, max-age=60");
    res.status(200).json({ iceServers });
  } catch (error) {
    console.log("Error in getIceServers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
