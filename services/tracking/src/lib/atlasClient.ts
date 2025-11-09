import fetch from "node-fetch";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(apiKey: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt - 60_000) return cachedToken.value;

  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`
  });
  if (!response.ok) throw new Error(`IAM token fetch failed: ${response.statusText}`);

  const data = await response.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function callAtlas(payload: unknown) {
  const token = await getToken(process.env.IBM_API_KEY!);
  const response = await fetch(process.env.IBM_API_ENDPOINT!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Atlas call failed: ${response.status} ${text}`);
  }
  return response.json();
}