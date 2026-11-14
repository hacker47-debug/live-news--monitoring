import assert from "node:assert/strict";
import test from "node:test";
import { resolveZeeStream } from "../app/stream-auth.ts";

const stream = "https://d2i4me5ac6ausm.cloudfront.net/index.m3u8";

test("Zee uses the publisher GET flow and preserves the token suffix", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.origin + url.pathname, "https://03nwj0csy5.execute-api.ap-south-1.amazonaws.com/prod/cf-token");
    assert.match(url.searchParams.get("cb"), /^\d+$/);
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    assert.equal(options.signal.aborted, false);
    return Response.json({ video_token: "?akes=test%2Bvalue&extra=1" });
  });
  assert.equal(await resolveZeeStream(stream, new AbortController().signal), stream + "?akes=test%2Bvalue&extra=1");
});

test("Zee reports rejected authentication instead of using the unsigned stream", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
  await assert.rejects(resolveZeeStream(stream, new AbortController().signal), /authentication failed \(HTTP 403\)/);
});

test("Zee rejects missing or malformed token responses", async (t) => {
  for (const data of [null, {}, { video_token: "" }, { video_token: "?" }, { video_token: 123 }, { video_token: "https://other.example" }]) {
    const mock = t.mock.method(globalThis, "fetch", async () => Response.json(data));
    await assert.rejects(resolveZeeStream(stream, new AbortController().signal), /valid video_token query suffix/);
    mock.mock.restore();
  }
});

test("Zee token requests respect player cleanup cancellation", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
    return Response.json({ video_token: "?akes=test" });
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(resolveZeeStream(stream, controller.signal), { name: "AbortError" });
});
