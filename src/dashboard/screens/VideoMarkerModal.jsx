import React, { useState, useRef, useEffect, useCallback } from 'react';
import Player from '@vimeo/player';
import { toast } from 'react-toastify';
import { courseService } from '../../services/courseService';

/* ─── Extract numeric Vimeo ID from any format ──────────────────────────────
   Accepts: "123456789", "123456789/abcdef1234", "https://vimeo.com/123456789",
            "/videos/123456789", etc.                                          */
function extractVimeoNumericId(raw) {
  if (!raw) return null;
  // Already a plain number
  if (/^\d+$/.test(String(raw))) return Number(raw);
  // "123456789/hash" — take the first segment
  const slashMatch = String(raw).match(/^(\d+)\//);
  if (slashMatch) return Number(slashMatch[1]);
  // URL like "https://vimeo.com/123456789" or "/videos/123456789"
  const urlMatch = String(raw).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (urlMatch) return Number(urlMatch[1]);
  // Fallback: take any leading digits
  const leadingDigits = String(raw).match(/(\d+)/);
  if (leadingDigits) return Number(leadingDigits[1]);
  return null;
}

function formatTime(s) {
  if (!s || isNaN(s) || s < 0) return '00:00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

const VIMEO_PROCESSING_ERROR = 'The video was uploaded successfully and is still being processed by Vimeo. Please wait a few minutes, then try opening the notion manager again.';

function getPlayerErrorMessage(err) {
  const rawMessage = String(err?.message || err || '');
  if (/not found|404|privacy|private|embed/i.test(rawMessage)) {
    return VIMEO_PROCESSING_ERROR;
  }
  return `Player error: ${rawMessage || 'Could not load video.'}`;
}

/* ─── Add / Edit Notion form ─────────────────────────────────────────────── */
function NotionForm({ capturedTime, editingNotion, onSubmit, onCancel, onCapture, playerReady, isPlaying }) {
  const [title, setTitle] = useState(editingNotion?.title || '');
  const [description, setDescription] = useState(editingNotion?.description || '');
  const [time, setTime] = useState(editingNotion?.time ?? capturedTime ?? 0);

  // Sync when editing marker changes
  useEffect(() => {
    if (editingNotion) {
      setTitle(editingNotion.title || '');
      setDescription(editingNotion.description || '');
      setTime(editingNotion.time ?? 0);
    } else {
      setTitle('');
      setDescription('');
      setTime(capturedTime ?? 0);
    }
  }, [editingNotion, capturedTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required.'); return; }
    onSubmit({ time, title: title.trim(), description: description.trim() });
  };

  const INPUT = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full text-sm placeholder:text-slate-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Timestamp row */}
      <div>
        <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">
          Timestamp
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-blue-300 font-mono text-sm font-black tracking-widest">
            {formatTime(time)}
          </div>
          {!editingNotion && (
            <button
              type="button"
              onClick={() => { onCapture((t) => setTime(t)); }}
              disabled={!playerReady}
              className="px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className="fa-solid fa-crosshairs" aria-hidden="true" />
              Capture
            </button>
          )}
        </div>
        {!editingNotion && (
          <p className="text-xs text-slate-600 mt-1.5">
            {isPlaying
              ? 'Pause the video first, then click Capture to grab the timestamp.'
              : playerReady
                ? 'Click Capture to record the current video time.'
                : 'Waiting for the video player to load...'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Notion Title *</label>
        <input
          type="text"
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Key vocabulary, Grammar rule..."
          className={INPUT}
        />
      </div>

      <div>
        <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add additional context or notes..."
          className={INPUT}
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors text-sm"
        >
          {editingNotion ? 'Save Changes' : 'Add Notion'}
        </button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
export default function VideoMarkerModal({ open, onClose, sectionId, vimeoVideoId, onNotionsUpdated, dbVideoId, videoNotions, video }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timePollerRef = useRef(null);

  const [videoMeta, setVideoMeta] = useState(video || {});
  const [markers, setMarkers] = useState(videoNotions || []);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [capturedTime, setCapturedTime] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [retryKey, setRetryKey] = useState(0);
  const [isSilentRetrying, setIsSilentRetrying] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const handleRetry = useCallback(() => {
    setIsSilentRetrying(true);
    setRetryKey((prev) => prev + 1);
    setCountdown(30);
  }, []);

  useEffect(() => {
    setVideoMeta(video || {});
  }, [video]);

  /* ── Fetch markers from backend ── */
  const fetchMarkers = useCallback(async () => {
    if (!sectionId || !vimeoVideoId) { setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const videos = await courseService.getVideos(sectionId);
      const vid = videos.find((v) => {
        const storedId = extractVimeoNumericId(v.vimeoVideoId);
        const propId = extractVimeoNumericId(vimeoVideoId);
        return storedId && propId && storedId === propId;
      }) || videos.find((v) => v.vimeoVideoId === vimeoVideoId);
      if (vid) setVideoMeta(vid);
      setMarkers(vid?.markers || videoNotions || []);
    } catch {
      setMarkers(videoNotions || []);
    } finally {
      setIsLoading(false);
    }
  }, [sectionId, vimeoVideoId, videoNotions]);

  useEffect(() => { if (open) fetchMarkers(); }, [open, fetchMarkers]);
  useEffect(() => { if (videoNotions) setMarkers(videoNotions); }, [videoNotions]);

  /* ── Init Vimeo Player ── */
  useEffect(() => {
    if (!open || !vimeoVideoId || !containerRef.current) return;

    if (!isSilentRetrying) {
      setIsLoading(true);
    }
    setPlayerReady(false);
    setIsPlaying(false);
    setLiveTime(0);
    setCapturedTime(0);

    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    clearInterval(timePollerRef.current);

    const numericId = extractVimeoNumericId(vimeoVideoId);
    if (!numericId) {
      setError(`Could not extract a valid Vimeo video ID from: "${vimeoVideoId}"`);
      setIsLoading(false);
      setIsSilentRetrying(false);
      return;
    }

    try {
      playerRef.current = new Player(containerRef.current, {
        id: numericId,
        responsive: false,
        autoplay: false,
        controls: true,
        title: false,
        byline: false,
        portrait: false,
      });

      playerRef.current.ready().then(() => {
        setPlayerReady(true);
        setIsLoading(false);
        setError(null);
        setIsSilentRetrying(false);
      }).catch((err) => {
        setError(getPlayerErrorMessage(err));
        setIsLoading(false);
        setIsSilentRetrying(false);
      });
      playerRef.current.on('play', () => {
        setIsPlaying(true);
        // Poll the current time every 500ms while playing
        clearInterval(timePollerRef.current);
        timePollerRef.current = setInterval(async () => {
          try {
            const t = await playerRef.current?.getCurrentTime();
            if (t !== undefined) setLiveTime(t);
          } catch { /* ignore */ }
        }, 500);
      });
      playerRef.current.on('pause', async () => {
        setIsPlaying(false);
        clearInterval(timePollerRef.current);
        try {
          const t = await playerRef.current.getCurrentTime();
          setLiveTime(t);
          setCapturedTime(t); // Auto-capture on pause
        } catch { /* ignore */ }
      });
      playerRef.current.on('ended', () => { setIsPlaying(false); clearInterval(timePollerRef.current); });
    } catch (err) {
      setError(getPlayerErrorMessage(err));
      setIsLoading(false);
      setIsSilentRetrying(false);
    }

    return () => {
      clearInterval(timePollerRef.current);
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    };
  }, [open, vimeoVideoId, retryKey]);

  /* ── Countdown timer for Vimeo processing auto-retry ── */
  useEffect(() => {
    if (!error || isLoading || isSilentRetrying || !open) return;

    setCountdown(30);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRetry();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error, isLoading, isSilentRetrying, open, handleRetry]);

  /* ── Capture current time on demand ── */
  const handleCapture = async (callback) => {
    if (!playerRef.current || !playerReady) { toast.warning('Player is not ready.'); return; }
    try {
      const t = await playerRef.current.getCurrentTime();
      setCapturedTime(t);
      if (callback) callback(t);
      toast.info(`Timestamp captured: ${formatTime(t)}`);
    } catch { toast.error('Could not get current video time.'); }
  };

  /* ── Open add notion form ── */
  const handleAddNotion = async () => {
    if (!playerReady) { toast.warning('Wait for the player to load.'); return; }
    try {
      const t = await playerRef.current.getCurrentTime();
      setCapturedTime(t);
    } catch { /* use last known */ }
    setEditingMarker(null);
    setFormOpen(true);
  };

  /* ── Open edit notion form ── */
  const handleEdit = (marker) => {
    setCapturedTime(marker.time);
    setEditingMarker(marker);
    setFormOpen(true);
  };

  /* ── Seek to a marker time ── */
  const seekToMarker = async (time) => {
    if (!playerRef.current || !playerReady) return;
    try {
      await playerRef.current.setCurrentTime(time);
      await playerRef.current.play();
    } catch { /* ignore */ }
  };

  /* ── Submit form (add or update) ── */
  const handleFormSubmit = async (data) => {
    if (!dbVideoId) { toast.error('Video ID is missing — cannot save.'); return; }
    try {
      let updated;
      if (editingMarker?._id) {
        const res = await courseService.updateMarkerInVideo(dbVideoId, editingMarker._id, data);
        updated = markers.map((m) => m._id === editingMarker._id ? res : m);
      } else {
        const res = await courseService.addMarkerToVideo(dbVideoId, data);
        updated = [...markers, res];
      }
      setMarkers(updated);
      if (onNotionsUpdated) onNotionsUpdated(updated);
      toast.success(editingMarker ? 'Notion updated!' : 'Notion added!');
      setFormOpen(false);
      setEditingMarker(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notion.');
    }
  };

  /* ── Delete a marker ── */
  const handleDeleteConfirm = async () => {
    if (!dbVideoId || !deleteTarget) return;
    try {
      await courseService.deleteMarkerFromVideo(dbVideoId, deleteTarget);
      const updated = markers.filter((m) => m._id !== deleteTarget);
      setMarkers(updated);
      if (onNotionsUpdated) onNotionsUpdated(updated);
      toast.success('Notion deleted.');
    } catch { toast.error('Failed to delete notion.'); }
    finally { setDeleteTarget(null); }
  };

  if (!open) return null;

  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  return (
    <>
      {/* ── Main backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
        onMouseDown={onClose}
      >
        <div
          className="relative my-6 flex max-h-[900px] w-full max-w-[1280px] flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1526] shadow-[0_28px_100px_rgba(0,0,0,0.55)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(77,131,238,0.22),transparent_34%),rgba(255,255,255,0.03)] px-6 py-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-blue-200">
                <i className="fa-solid fa-lightbulb" aria-hidden="true" />
                Notion Studio
              </span>
              <h3 className="mt-2 text-xl font-black tracking-tight text-white">Video Notion Manager</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Capture timestamps, organize notions, and jump back to key learning moments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSilentRetrying(false);
                  setRetryKey((prev) => prev + 1);
                  fetchMarkers();
                  toast.info('Refreshing video and notions...');
                }}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
                title="Refresh video player and notions"
              >
                <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                Refresh
              </button>
              {/* Live time badge */}
              {playerReady && (
                <span className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-600/10 px-3 py-1.5 font-mono text-sm font-black text-blue-300">
                  <i className="fa-regular fa-clock text-xs" aria-hidden="true" />
                  {formatTime(liveTime)}
                </span>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body: two-column */}
          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">

            {/* LEFT: Video player */}
            <div className="flex min-w-0 flex-col gap-4 border-r border-white/10 p-5">
              <div className="relative w-full overflow-hidden rounded-[1.2rem] border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div ref={containerRef} className="w-full aspect-video [&_iframe]:w-full [&_iframe]:h-full" />
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    <span className="text-sm text-slate-400">Loading video player...</span>
                  </div>
                )}
                {error && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center backdrop-blur-sm">
                    {error === VIMEO_PROCESSING_ERROR ? (
                      <div className="max-w-md space-y-5 rounded-2xl border border-blue-500/20 bg-blue-950/30 p-6 shadow-2xl backdrop-blur-md animate-fade-in">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10 text-2xl text-blue-400">
                          {isSilentRetrying ? (
                            <i className="fa-solid fa-arrows-spin fa-spin" aria-hidden="true" />
                          ) : (
                            <i className="fa-solid fa-video animate-pulse" aria-hidden="true" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-white">Video is processing on Vimeo</h4>
                          <p className="text-xs leading-relaxed text-slate-400">
                            Vimeo is currently encoding your video. It will automatically show up here once ready.
                          </p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-3 pt-2">
                          <span className="inline-flex items-center gap-2 rounded-xl bg-blue-600/10 px-4 py-2 font-mono text-xs font-bold text-blue-300">
                            {isSilentRetrying ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin mr-1" aria-hidden="true" />
                                Checking status...
                              </>
                            ) : (
                              <>
                                <i className="fa-regular fa-clock mr-1 animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
                                Checking again in {countdown}s
                              </>
                            )}
                          </span>

                          <button
                            onClick={handleRetry}
                            disabled={isSilentRetrying}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-600 hover:border-transparent disabled:opacity-50"
                          >
                            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                            Check Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-md space-y-5 rounded-2xl border border-red-500/20 bg-red-950/30 p-6 shadow-2xl backdrop-blur-md animate-fade-in">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10 text-2xl text-red-400">
                          {isSilentRetrying ? (
                            <i className="fa-solid fa-arrows-spin fa-spin" aria-hidden="true" />
                          ) : (
                            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-white">Connection Error</h4>
                          <p className="text-xs leading-relaxed text-red-300">{error}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-3 pt-2">
                          <span className="inline-flex items-center gap-2 rounded-xl bg-red-600/10 px-4 py-2 font-mono text-xs font-bold text-red-300">
                            {isSilentRetrying ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin mr-1" aria-hidden="true" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <i className="fa-regular fa-clock mr-1 animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
                                Retrying in {countdown}s
                              </>
                            )}
                          </span>

                          <button
                            onClick={handleRetry}
                            disabled={isSilentRetrying}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600 hover:border-transparent disabled:opacity-50"
                          >
                            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                            Retry Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls row */}
              <div className="flex flex-col gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-white">{videoMeta?.title || videoMeta?.videoName || 'Untitled video'}</p>
                  </div>
                  {videoMeta?.description && (
                    <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-slate-500">{videoMeta.description}</p>
                  )}
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    {playerReady
                      ? isPlaying
                        ? <span className="text-emerald-400 font-bold"><i className="fa-solid fa-circle-play mr-1" aria-hidden="true" />Playing</span>
                        : <span className="text-slate-400"><i className="fa-solid fa-pause mr-1" aria-hidden="true" />Paused — timestamp ready</span>
                      : 'Player loading...'}
                  </div>
                </div>
                <button
                  onClick={handleAddNotion}
                  disabled={!playerReady}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                  Add Notion
                </button>
              </div>

              {/* Instruction banner */}
              {playerReady && !isPlaying && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-3 text-xs leading-5 text-blue-300">
                  <i className="fa-solid fa-circle-info mt-0.5 shrink-0" aria-hidden="true" />
                  <span>The video is paused at <strong>{formatTime(liveTime)}</strong>. Click <strong>Add Notion</strong> to create a note at this exact time, or play and pause again at a different moment.</span>
                </div>
              )}
            </div>

            {/* RIGHT: Notion list */}
            <div className="flex min-h-0 flex-col gap-4 bg-slate-950/18 p-5">
              <div className="flex shrink-0 items-center justify-between">
                <h4 className="text-sm font-black text-white">
                  Notions <span className="text-blue-400">({sortedMarkers.length})</span>
                </h4>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-500">
                  Timeline
                </span>
              </div>

              {isLoading && !playerReady ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : sortedMarkers.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-xl text-blue-400">
                    <i className="fa-solid fa-lightbulb" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No notions yet</p>
                  <p className="mt-1 text-xs text-slate-600">Play the video, pause at a key moment,<br/>then click Add Notion.</p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {sortedMarkers.map((marker) => (
                    <div
                      key={marker._id || marker.time}
                      className="group rounded-xl border border-white/5 bg-white/[0.035] p-3 transition-colors hover:border-blue-500/25 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => seekToMarker(marker.time)}
                          className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
                        >
                          <span className="shrink-0 rounded-lg border border-blue-500/20 bg-blue-600/10 px-2 py-1 font-mono text-xs font-black text-blue-400">
                            {formatTime(marker.time)}
                          </span>
                        </button>
                        <div className="flex shrink-0 gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(marker)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-blue-500/20 bg-blue-600/10 text-xs text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
                          >
                            <i className="fa-solid fa-pen" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(marker._id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-500/20 bg-red-600/10 text-xs text-red-400 transition-colors hover:bg-red-600 hover:text-white"
                          >
                            <i className="fa-solid fa-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 cursor-pointer" onClick={() => seekToMarker(marker.time)}>
                        <p className="truncate text-sm font-bold text-white">{marker.title}</p>
                        {marker.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{marker.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end border-t border-white/10 px-6 py-3">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Notion Form Modal ── */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm"
          onMouseDown={() => { setFormOpen(false); setEditingMarker(null); }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0d1526] shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-6 py-4">
              <div>
                <h4 className="text-base font-black text-white">
                  {editingMarker ? 'Edit Notion' : 'Add Notion'}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">Timestamp: {formatTime(capturedTime)}</p>
              </div>
              <button
                onClick={() => { setFormOpen(false); setEditingMarker(null); }}
                className="cursor-pointer border-none bg-transparent text-xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <NotionForm
                capturedTime={capturedTime}
                editingNotion={editingMarker}
                onSubmit={handleFormSubmit}
                onCancel={() => { setFormOpen(false); setEditingMarker(null); }}
                onCapture={handleCapture}
                playerReady={playerReady}
                isPlaying={isPlaying}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-[1.35rem] border border-white/10 bg-[#0d1526] p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 text-xl mb-4">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            </div>
            <h4 className="text-white font-black text-lg">Delete Notion</h4>
            <p className="text-slate-400 text-sm mt-2 leading-6">Are you sure you want to delete this notion? This action cannot be undone.</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold border-none cursor-pointer text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
