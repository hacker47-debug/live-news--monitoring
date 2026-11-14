export async function resolveZeeStream(url: string, signal: AbortSignal): Promise<string> {
  const endpoint = new URL("https://03nwj0csy5.execute-api.ap-south-1.amazonaws.com/prod/cf-token");
  endpoint.searchParams.set("cb", String(Math.floor(Math.random() * 900000 + 100000)));

  const response = await fetch(endpoint, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) throw new Error(`Zee authentication failed (HTTP ${response.status}).`);

  const data: unknown = await response.json();
  if (
    typeof data !== "object" || data === null ||
    !("video_token" in data) || typeof data.video_token !== "string" ||
    !data.video_token.startsWith("?") || data.video_token.length < 2
  ) {
    throw new Error("Zee authentication did not return a valid video_token query suffix.");
  }

  // The publisher's vgr_util_kaltura player appends the token verbatim.
  return url.trim() + data.video_token;
}
