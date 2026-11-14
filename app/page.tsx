"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { resolveZeeStream } from "./stream-auth";

const initialStreams: { name: string; url: string; auth?: "zee" }[] = [
  { name: "Sandesh News", url: "https://mumt01.tangotv.in/O5aw8Zn3SANDESHNEWS/index.m3u8" },
  { name: "VTV Gujarati", url: "https://stream.ottlive.co.in/vtvgujarati/index.m3u8" },
  { name: "Zee 24 Kalak", url: "https://d2i4me5ac6ausm.cloudfront.net/index.m3u8", auth: "zee" },
  { name: "TV9 Gujarati", url: "https://dyjmyiv3bp2ez.cloudfront.net/pub-iotv9guj3ki8lu/liveabr/playlist.m3u8" },
];

function StreamCard({ name, initialUrl, number, auth }: { name: string; initialUrl: string; number: number; auth?: "zee" }) {
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialUrl) return;

    let active = true;
    let hls: Hls | undefined;
    const controller = new AbortController();
    video.muted = true;
    const play = () => {
      video.play().catch(() => {
        if (active) setError("Autoplay was blocked. Press play on the video.");
      });
    };
    const onVideoError = () => {
      if (active) setError(`Video error ${video.error?.code ?? "unknown"}: ${video.error?.message || "Stream unavailable or unsupported."}`);
    };
    video.addEventListener("error", onVideoError);

    async function initialize(player: HTMLVideoElement) {
      try {
        const source = auth === "zee"
          ? await resolveZeeStream(initialUrl, controller.signal)
          : initialUrl;
        if (!active) return;

        if (player.canPlayType("application/vnd.apple.mpegurl")) {
          player.src = source;
          play();
        } else if (Hls.isSupported()) {
          hls = new Hls();
          hls.on(Hls.Events.MANIFEST_PARSED, play);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (active && data.fatal) {
              const status = data.response?.code;
              setError(`HLS ${data.type}: ${data.details}${status ? ` (HTTP ${status})` : ""}.`);
              hls?.destroy();
            }
          });
          hls.loadSource(source);
          hls.attachMedia(player);
        } else {
          setError("This browser does not support HLS playback. Try a current version of Chrome, Edge, or Safari.");
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Stream initialization failed.");
        }
      }
    }
    void initialize(video);

    return () => {
      active = false;
      controller.abort();
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [initialUrl, auth]);

  return (
    <section className="stream-card" aria-label={`${name}, screen ${number}`}>
      <div className="card-heading">
        <div className="channel-title">
          <span className="screen-number">{String(number).padStart(2, "0")}</span>
          <div>
            <h2>{name}</h2>
            <p>{initialUrl ? "LIVE STREAM" : "AVAILABLE SCREEN"}</p>
          </div>
        </div>
        <span className={initialUrl && !error ? "status status-live" : "status"}><span />{error ? "ERROR" : initialUrl ? "STREAM" : "EMPTY"}</span>
      </div>
      <div className="video-wrap">
        {initialUrl ? (
          <video ref={videoRef} controls muted playsInline aria-label={`${name} player`} />
        ) : (
          <div className="empty-screen">
            <div className="empty-icon">+</div>
            <strong>Ready for a stream</strong>
            <span>No stream is configured for this screen</span>
          </div>
        )}
      </div>
      {error && <p className="error card-error" role="alert">{error}</p>}
    </section>
  );
}

export default function Home() {
  const wallRef = useRef<HTMLElement>(null);
  const [wall, setWall] = useState(false);
  const [wallError, setWallError] = useState("");

  useEffect(() => {
    const onFullscreenChange = () => {
      if (document.fullscreenElement !== wallRef.current) setWall(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function muteAll() {
    wallRef.current?.querySelectorAll("video").forEach((video) => { video.muted = true; });
  }

  async function toggleWall() {
    setWallError("");
    try {
      if (document.fullscreenElement === wallRef.current) {
        await document.exitFullscreen();
      } else if (wallRef.current) {
        muteAll();
        await wallRef.current.requestFullscreen();
        setWall(true);
      }
    } catch {
      setWallError("Fullscreen is unavailable in this browser.");
    }
  }

  return (
    <main ref={wallRef} className={`app-shell${wall ? " wall-mode" : ""}`}>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><span /><span /><span /><span /></div><div>STREAM<span>WALL</span><small>LIVE MONITORING</small></div></div>
        <div className="header-right">
          <span className="header-status"><span /> ALL SCREENS IN ONE PLACE</span>
          <button className="button-secondary" onClick={muteAll}>Mute all</button>
          <button className="button-primary" onClick={toggleWall}><span aria-hidden="true">⛶</span> Fullscreen wall</button>
        </div>
      </header>
      <div className="page-content">
        <div className="intro">
          <div><div className="eyebrow"><span /> YOUR LIVE DASHBOARD</div><h1>All your streams. <em>One view.</em></h1><p>Keep an eye on what matters, all in one place.</p></div>
          <div className="intro-meta"><span className="meta-icon">▦</span><div><strong>4 screens</strong><small>YOUR VIDEO WALL</small></div></div>
        </div>
        {wallError && <p className="error wall-error" role="alert">{wallError}</p>}
        <div className="grid">
          {initialStreams.map((stream, index) => <StreamCard key={index} name={stream.name} initialUrl={stream.url} number={index + 1} auth={stream.auth} />)}
        </div>
        <footer><span><span className="footer-dot" /> LIVE STREAM MONITOR</span><span>Streams start muted · Use player controls for audio</span></footer>
      </div>
      {wall && <button className="exit-wall" onClick={toggleWall}>Exit fullscreen</button>}
    </main>
  );
}
