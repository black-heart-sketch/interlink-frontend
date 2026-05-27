import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { selectCurrentUserProfile } from '../redux/authSlice';
import axiosInstance from '../config/axiosConfig';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

// --- Icons (SVG, no emojis) ---
const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
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
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

// ─── Pre-Join Camera Preview ────────────────────────────────────────────────
function PreJoinLobby({ room, isAdmin, onJoin, isLoading, error, userName }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCamError(true);
      }
    };
    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(v => !v); }
  };
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(v => !v); }
  };

  const handleJoin = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onJoin();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'radial-gradient(ellipse at 50% 0%, #1E1B4B22 0%, #0F0F23 70%)' }}>
      <div className="w-full max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {room.name}
          </h1>
          <p className="text-slate-400 text-sm">{room.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Camera Preview */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Video box */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0a0a1a] aspect-video flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              {camError || !camOn ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <p className="text-slate-500 text-sm">{t('live_class.camera_off')}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
              {/* Camera label */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {userName}
              </div>
              {/* Status indicators */}
              <div className="absolute top-3 right-3 flex gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${micOn ? 'bg-green-400' : 'bg-red-500'} shadow-lg`} />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMic}
                title={micOn ? t('live_class.mute_microphone') : t('live_class.unmute_microphone')}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all duration-200 cursor-pointer font-medium text-xs ${
                  micOn
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                }`}
              >
                {micOn ? <IconMic /> : <IconMicOff />}
                {micOn ? t('live_class.mute') : t('live_class.unmuted')}
              </button>

              <button
                onClick={toggleCam}
                disabled={camError}
                title={camOn ? t('live_class.turn_off_camera') : t('live_class.turn_on_camera')}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all duration-200 cursor-pointer font-medium text-xs ${
                  camOn
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {camOn ? <IconVideo /> : <IconVideoOff />}
                {camOn ? t('live_class.stop_video') : t('live_class.start_video')}
              </button>
            </div>
          </div>

          {/* Right: Room info + Join */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(30,27,75,0.5)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>
              {/* Room details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {room.isGlobal ? <IconGlobe /> : <IconBook />}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{room.name}</div>
                    <div className="text-slate-500 text-xs">{room.subtitle}</div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                    <IconShield />
                    {t('study_lounge.moderator_access')}
                  </div>
                )}
              </div>

              <div className="border-t border-white/5" />

              {/* Checklist */}
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('live_class.before_join')}</p>
                {[t('study_lounge.check_respectful'), t('study_lounge.check_mute'), t('study_lounge.check_screen_share')].map(item => (
                  <div key={item} className="flex items-start gap-2 text-slate-300 text-xs">
                    <svg className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Join button */}
              <button
                onClick={handleJoin}
                disabled={isLoading || !!error}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('study_lounge.preparing_room')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <IconVideo />
                    {t('study_lounge.join_now')}
                  </span>
                )}
              </button>

              <p className="text-center text-slate-600 text-xs">
                {t('live_class.community_guidelines')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StudyLounge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduxUserProfile = useSelector(selectCurrentUserProfile);
  const user = reduxUserProfile || JSON.parse(sessionStorage.getItem('userProfile') || 'null');

  const [activeRoomId, setActiveRoomId] = useState('lounge-global');
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!user || !activeRoomId) return;
    setHasJoined(false);
    setToken(null);
    setConnectionError('');
    setIsFetchingToken(true);
    axiosInstance.get(`/live-classes/lounge/${activeRoomId}/token`)
      .then(res => { setToken(res.data.token); setServerUrl(res.data.url); })
      .catch(err => setConnectionError(err.response?.data?.message || t('study_lounge.access_denied')))
      .finally(() => setIsFetchingToken(false));
  }, [activeRoomId, user?._id]);

  if (!user) { navigate('/login'); return null; }

  const userRole = (user?.role || 'student').toLowerCase();
  const isAdmin = ['superadmin', 'admin', 'teacher', 'systemadmin', 'instituteadmin'].includes(userRole);
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || t('live_class.student');

  const rooms = [
    { id: 'lounge-global', name: t('study_lounge.global_lounge'), subtitle: t('study_lounge.all_students'), icon: <IconGlobe /> },
    { id: 'lounge-en', name: t('study_lounge.english_lounge'), subtitle: t('study_lounge.english_section'), icon: <IconBook /> },
    { id: 'lounge-fr', name: t('study_lounge.french_lounge'), subtitle: t('study_lounge.french_section'), icon: <IconBook /> },
    { id: 'lounge-de', name: t('study_lounge.german_lounge'), subtitle: t('study_lounge.german_section'), icon: <IconBook /> },
    { id: 'lounge-it', name: t('study_lounge.italian_lounge'), subtitle: t('study_lounge.italian_section'), icon: <IconBook /> },
  ];

  const activeRoomName = rooms.find(r => r.id === activeRoomId)?.name || t('study_lounge.global_lounge');

  const activeRoom = {
    name: activeRoomName,
    subtitle: activeRoomId === 'lounge-global' ? t('study_lounge.open_to_all') : t('study_lounge.language_specific_room'),
    isGlobal: activeRoomId === 'lounge-global',
  };

  return (
    <>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <div
        className="flex flex-col"
        style={{ height: '100dvh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#0F0F23', color: '#F8FAFC' }}
        data-theme="dark"
      >
        <Navbar />

        {/* Below navbar - use padding-top to clear the fixed 50px bar */}
        <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '100px' }}>

          {/* ── Sidebar ── */}
          <aside
            className="hidden md:flex flex-col flex-shrink-0 overflow-y-auto"
            style={{ width: '240px', background: '#0a0a18', borderRight: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Sidebar header */}
            <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <IconUsers />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('study_lounge.study_lounges')}</span>
              </div>
            </div>

            {/* Room list */}
            <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
              {rooms.map(room => {
                const active = activeRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group"
                    style={{
                      background: active ? 'rgba(79,70,229,0.15)' : 'transparent',
                      border: active ? '1px solid rgba(79,70,229,0.35)' : '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        background: active ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'rgba(255,255,255,0.06)',
                        color: active ? 'white' : '#94a3b8',
                      }}
                    >
                      {room.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {room.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{room.subtitle}</div>
                    </div>
                    {active && <IconChevronRight />}
                  </button>
                );
              })}
            </nav>

            {/* Moderator badge */}
            {isAdmin && (
              <div className="mx-3 mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <IconShield />
                <span className="text-amber-400 text-xs font-semibold">{t('study_lounge.moderator')}</span>
              </div>
            )}
          </aside>

          {/* ── Main ── */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* Top bar */}
            <div
              className="flex items-center justify-between px-6 py-3 flex-shrink-0"
              style={{ background: '#0a0a18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/60" />
                <span className="text-sm font-semibold text-white">{activeRoomName}</span>
                <span className="text-xs text-slate-500">· {activeRoom.subtitle}</span>
              </div>
              {hasJoined && (
                <button
                  onClick={() => setHasJoined(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                >
                  {t('study_lounge.leave_room')}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!hasJoined ? (
                <PreJoinLobby
                  room={activeRoom}
                  isAdmin={isAdmin}
                  onJoin={() => setHasJoined(true)}
                  isLoading={isFetchingToken}
                  error={connectionError}
                  userName={userName}
                />
              ) : token && serverUrl ? (
                <LiveKitRoom
                  key={activeRoomId}
                  video={true}
                  audio={true}
                  token={token}
                  serverUrl={serverUrl}
                  data-lk-theme="default"
                  style={{ flex: 1, overflow: 'hidden' }}
                  onDisconnected={() => setHasJoined(false)}
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">{t('study_lounge.loading_room')}</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
