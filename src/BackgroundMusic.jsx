import { useEffect, useRef, useState } from "react";
import {
  Music2, X, Play, Pause, Square, Volume2, VolumeX,
  SkipBack, SkipForward
} from "lucide-react";

const TRACKS = [
  { title: "Balrog's Theme", src: "/audio/background-music.mp3" },
  { title: "Clock Tower (MVC2)", src: "/audio/clocktowermvc2.mp3" },
  { title: "Dudley Theme", src: "/audio/dudleytheme.mp3" },
  { title: "River (MVC2)", src: "/audio/rivermvc2.mp3" },
  { title: "True Love Making", src: "/audio/truelovemaking.mp3" }
];

// Shuffle a full set of tracks before repeating any on subsequent page loads.
// Store the remaining queue so consecutive reloads cannot pick the same song.
function chooseStartupTrack() {
  const key = "fightlab_music_startup_queue_v1";
  const lastKey = "fightlab_music_last_startup_v1";
  try {
    const previous = Number(localStorage.getItem(lastKey));
    let queue = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(queue) || queue.some(i => !Number.isInteger(i) || i < 0 || i >= TRACKS.length)) queue = [];
    if (!queue.length) {
      queue = TRACKS.map((_, i) => i);
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }
    // Avoid a repeat at the boundary between shuffled rounds.
    if (queue.length > 1 && queue[0] === previous) {
      const swapIndex = 1 + Math.floor(Math.random() * (queue.length - 1));
      [queue[0], queue[swapIndex]] = [queue[swapIndex], queue[0]];
    }
    const chosen = queue.shift();
    localStorage.setItem(key, JSON.stringify(queue));
    localStorage.setItem(lastKey, String(chosen));
    return chosen;
  } catch {
    return Math.floor(Math.random() * TRACKS.length);
  }
}

// Evaluate once per full page load, even in React Strict Mode.
const STARTUP_TRACK = chooseStartupTrack();

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const userStoppedRef = useRef(false);
  const playAfterChangeRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(15);
  const [trackIndex, setTrackIndex] = useState(STARTUP_TRACK);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // Keep the existing attempt-to-autoplay behavior (browser policy may block it).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    async function attemptAutoplay() {
      if (!active || userStoppedRef.current || !audio.paused) return;
      try { await audio.play(); } catch { /* Await browser permission or interaction. */ }
    }
    attemptAutoplay();
    function startOnInteraction(event) {
      if (event.target.closest?.(".music-widget")) return;
      attemptAutoplay();
    }
    document.addEventListener("pointerdown", startOnInteraction);
    document.addEventListener("keydown", startOnInteraction);
    return () => {
      active = false;
      document.removeEventListener("pointerdown", startOnInteraction);
      document.removeEventListener("keydown", startOnInteraction);
    };
  }, []);

  async function playMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    userStoppedRef.current = false;
    try { await audio.play(); } catch (error) {
      console.error("Music playback failed:", error);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playMusic();
    else {
      userStoppedRef.current = true;
      audio.pause();
    }
  }

  function stopMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    userStoppedRef.current = true;
    playAfterChangeRef.current = false;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  }

  function changeTrack(direction, fromEnded = false) {
    const audio = audioRef.current;
    playAfterChangeRef.current = fromEnded || Boolean(audio && !audio.paused);
    setTrackIndex(index => (index + direction + TRACKS.length) % TRACKS.length);
  }

  function onTrackLoaded() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
    if (playAfterChangeRef.current) {
      playAfterChangeRef.current = false;
      playMusic();
    }
  }

  return (
    <div className="music-widget">
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex].src}
        preload="auto"
        onLoadedData={onTrackLoaded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => changeTrack(1, true)}
      />

      {expanded && (
        <div className="music-widget-panel">
          <button type="button" className="music-control" onClick={() => changeTrack(-1)} title="Previous track" aria-label="Previous track">
            <SkipBack size={16} />
          </button>
          <button type="button" className="music-control" onClick={togglePlay} title={playing ? "Pause" : "Play"} aria-label={playing ? "Pause music" : "Play music"}>
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" className="music-control" onClick={stopMusic} title="Stop" aria-label="Stop music">
            <Square size={15} />
          </button>
          <button type="button" className="music-control" onClick={() => changeTrack(1)} title="Next track" aria-label="Next track">
            <SkipForward size={16} />
          </button>
          <span className="music-track-name" title={TRACKS[trackIndex].title} aria-live="polite">{TRACKS[trackIndex].title}</span>
          <div className="music-volume">
            {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Music volume" />
            <span>{volume}%</span>
          </div>
        </div>
      )}

      <button type="button" className="music-widget-toggle" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Close music controls" : "Open music controls"} aria-expanded={expanded} title="Music controls">
        {expanded ? <X size={21} /> : <Music2 size={21} />}
      </button>
    </div>
  );
}
