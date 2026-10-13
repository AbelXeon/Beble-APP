export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing in Vercel environment variables." });
  }

  const TRANSLATE_MODEL = "gemini-3.5-live-translate-preview";
  const TALK_MODEL = "gemini-3.8-live";

  const now = Date.now();
  const body = JSON.stringify({
    uses: 1,
    expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
    newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
  });

  let lastError = "Could not create a session token";
  for (const version of ["v1beta", "v1alpha"]) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/${version}/auth_tokens`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.name) {
        return res.status(200).json({
          token: data.name,
          version,
          translateModel: TRANSLATE_MODEL,
          talkModel: TALK_MODEL,
        });
      }
      lastError = (data.error && data.error.message) || lastError;
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(502).json({ error: lastError });
}