import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import axiosInstance from '../config/axiosConfig';
import { selectCurrentUserProfile } from '../redux/authSlice';
import Navbar from '../components/Navbar';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IconVideo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
);
const IconVideoOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);
const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const IconMicOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

// ─── Pre-Join Lobby ───────────────────────────────────────────────────────────
function ClassLobby({ liveClass, isLoading, onJoin, onBack, error, userName }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError(true));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleCam = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(v => !v); }
  };
  const toggleMic = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(v => !v); }
  };

  const handleJoin = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onJoin();
  };

  const startTime = liveClass?.scheduledStartTime ? new Date(liveClass.scheduledStartTime) : null;
  const endTime = liveClass?.scheduledEndTime ? new Date(liveClass.scheduledEndTime) : null;

  return (
    <div
      className="flex-1 flex items-center justify-center p-6 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1E1B4B22 0%, #0F0F23 70%)', marginTop: '400px' }}
    >
      <div className="w-full max-w-4xl">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm cursor-pointer"
        >
          <IconArrowLeft /> Back
        </button>

        {/* Class title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: 'rgba(79,70,229,0.2)', color: '#818cf8', border: '1px solid rgba(79,70,229,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Live Class
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {liveClass?.title || 'Live Class'}
          </h1>
          {liveClass?.description && (
            <p className="text-slate-400 text-sm max-w-md mx-auto">{liveClass.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Camera preview */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div
              className="relative rounded-2xl overflow-hidden bg-[#0a0a1a] aspect-video flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              {camError || !camOn ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <p className="text-slate-500 text-sm">Camera is off</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {userName}
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${micOn ? 'bg-green-400' : 'bg-red-500'}`} />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMic}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all duration-200 cursor-pointer font-medium text-xs ${
                  micOn
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                }`}
              >
                {micOn ? <IconMic /> : <IconMicOff />}
                {micOn ? 'Mute' : 'Unmuted'}
              </button>
              <button
                onClick={toggleCam}
                disabled={camError}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all duration-200 cursor-pointer font-medium text-xs ${
                  camOn
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {camOn ? <IconVideo /> : <IconVideoOff />}
                {camOn ? 'Stop Video' : 'Start Video'}
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: 'rgba(30,27,75,0.5)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}
            >
              {/* Class metadata */}
              {(startTime || liveClass?.teacher) && (
                <div className="space-y-2.5">
                  {startTime && (
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <div className="text-indigo-400"><IconCalendar /></div>
                      {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  {startTime && endTime && (
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <div className="text-indigo-400"><IconClock /></div>
                      {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} – {endTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {liveClass?.teacher && (
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <div className="text-indigo-400"><IconUser /></div>
                      {typeof liveClass.teacher === 'object'
                        ? `${liveClass.teacher.firstName || ''} ${liveClass.teacher.lastName || ''}`.trim()
                        : 'Instructor'}
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-1" />
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Before you join</p>
                {['Ensure your camera & mic work', 'Find a quiet environment', 'Keep mic muted when not speaking'].map(item => (
                  <div key={item} className="flex items-start gap-2 text-slate-300 text-xs">
                    <div className="text-indigo-400 mt-0.5 flex-shrink-0"><IconCheck /></div>
                    {item}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Join */}
              <button
                onClick={handleJoin}
                disabled={isLoading || !!error}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Preparing…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <IconVideo />
                    Join Class
                  </span>
                )}
              </button>

              <p className="text-center text-slate-600 text-xs">
                By joining, you agree to our community guidelines
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveClassRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const reduxUserProfile = useSelector(selectCurrentUserProfile);
  const user = reduxUserProfile || JSON.parse(sessionStorage.getItem('userProfile') || 'null');

  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [liveClass, setLiveClass] = useState(null);

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';

  useEffect(() => {
    if (!meetingId) return;
    setIsLoading(true);
    Promise.all([
      axiosInstance.get(`/live-classes/${meetingId}/token`),
      axiosInstance.get(`/live-classes?meetingId=${meetingId}`).catch(() => ({ data: [] })),
    ])
      .then(([tokenRes, classRes]) => {
        setToken(tokenRes.data.token);
        setServerUrl(tokenRes.data.url);
        if (classRes.data?.length > 0) setLiveClass(classRes.data[0]);
      })
      .catch(err => setError(err.response?.data?.message || 'Access denied or meeting not found.'))
      .finally(() => setIsLoading(false));
  }, [meetingId]);

  // Error screen
  if (error && !isLoading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div className="min-h-screen flex flex-col" style={{ background: '#0F0F23', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4" style={{ paddingTop: '50px' }}>
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Cannot join class</h2>
            <p className="text-slate-400 max-w-sm text-sm">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
              style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.3)' }}
            >
              <IconArrowLeft /> Return to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // Fullscreen room view
  if (hasJoined && token && serverUrl) {
    return (
      <LiveKitRoom
        key={meetingId}
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100dvh', width: '100vw' }}
        onDisconnected={() => setHasJoined(false)}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  // Pre-join lobby
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div
        className="flex flex-col"
        style={{ height: '100dvh', background: '#0F0F23', color: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        data-theme="dark"
      >
        <Navbar />
        <div className="flex flex-1 flex-col overflow-hidden" style={{ paddingTop: '50px' }}>
          {/* Top bar */}
          <div
            className="flex items-center px-6 py-3 flex-shrink-0"
            style={{ background: '#0a0a18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">{liveClass?.title || 'Live Class'}</span>
              <span className="text-xs text-slate-500 ml-1">· {meetingId}</span>
            </div>
          </div>

          <ClassLobby
            liveClass={liveClass}
            isLoading={isLoading}
            onJoin={() => setHasJoined(true)}
            onBack={() => navigate(-1)}
            error={error}
            userName={userName}
          />
        </div>
      </div>
    </>
  );
}
