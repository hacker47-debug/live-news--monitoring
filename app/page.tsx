"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

const initialStreams = [
  { name: "Sandesh News", url: "https://mumt01.tangotv.in/O5aw8Zn3SANDESHNEWS/index.m3u8" },
  { name: "VTV Gujarati", url: "https://stream.ottlive.co.in/vtvgujarati/index.m3u8" },
  { name: "Screen 3", url: "https://mumt01.tangotv.in/O5aw8Zn3SANDESHNEWS/index.m3u8" },
  { name: "Screen 4", url: "https://mumt01.tangotv.in/O5aw8Zn3SANDESHNEWS/index.m3u8" },
];

function StreamCard({ name, initialUrl, number }: { name: string; initialUrl: string; number: number }) {
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialUrl) return;

    let active = true;
    let hls: Hls | undefined;
    video.muted = true;
    const play = () => {
      video.play().catch(() => {
        if (active) setError("Autoplay was blocked. Press play on the video.");
      });
    };
    const onVideoError = () => {
      if (active) setError("Unable to play this stream. Check the URL and stream availability.");
    };
    video.addEventListener("error", onVideoError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = initialUrl;
      play();
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(initialUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, play);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (active && data.fatal) {
          setError("Unable to load this stream. Check the URL, connection, and CORS permissions.");
          hls?.destroy();
        }
      });
    } else {
      queueMicrotask(() => {
        if (active) setError("This browser does not support HLS playback. Try a current version of Chrome, Edge, or Safari.");
      });
    }

    return () => {
      active = false;
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [initialUrl]);

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
          {initialStreams.map((stream, index) => <StreamCard key={index} name={stream.name} initialUrl={stream.url} number={index + 1} />)}
        </div>
        <footer><span><span className="footer-dot" /> LIVE STREAM MONITOR</span><span>Streams start muted · Use player controls for audio</span></footer>
      </div>
      {wall && <button className="exit-wall" onClick={toggleWall}>Exit fullscreen</button>}
    </main>
  );
}
