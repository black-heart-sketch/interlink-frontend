import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Image, Video, Music, ExternalLink, ZoomIn, ZoomOut, RotateCw, ShieldAlert, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../config/axiosConfig';
import { API_ORIGIN } from '../../config/apiConfig';
import AntiCheatMonitor from './AntiCheatMonitor';

const API_URL = API_ORIGIN;

export const getThumbnailUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.includes('-thumbnail.png')) return `${API_URL}${fileUrl}`;
  const lastDotIndex = fileUrl.lastIndexOf('.');
  if (lastDotIndex === -1) return `${API_URL}${fileUrl}`;
  return `${API_URL}${fileUrl.substring(0, lastDotIndex)}-thumbnail.png`;
};

export const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_URL}${fileUrl}`;
};

export default function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, fileType, isPrivate, user }) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [violation, setViolation] = useState(null);

  // Authenticated blob URL state
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState('');
  const prevBlobUrl = useRef(null);

  // Auto-detect type
  const extension = fileUrl ? fileUrl.split('.').pop().toLowerCase() : '';
  let detectedType = fileType;
  if (!detectedType) {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) detectedType = 'image';
    else if (['pdf'].includes(extension)) detectedType = 'pdf';
    else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) detectedType = 'video';
    else if (['mp3', 'wav', 'aac', 'm4a'].includes(extension)) detectedType = 'audio';
    else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) detectedType = 'office';
    else detectedType = 'document';
  }

  // Revoke old blob URL on change to prevent memory leaks
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, [blobUrl]);

  // Fetch file as authenticated blob
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl(null);
      setBlobLoading(false);
      return;
    }

    setZoom(1);
    setRotation(0);
    setViolation(null);
    setBlobUrl(null);
    setBlobError('');
    setBlobLoading(true);
    document.body.style.overflow = 'hidden';

    const fullUrl = getFullFileUrl(fileUrl);

    // For library files, route through the authenticated API stream endpoint
    // instead of hitting the express.static /library/* path which can fail
    // when the DB connection hasn't been initialised on that route.
    let fetchUrl = fullUrl;
    if (fileUrl && fileUrl.startsWith('/library/')) {
      const filename = fileUrl.split('/').pop();
      fetchUrl = `/library/stream/${filename}`; // relative to axiosInstance baseURL → /api/library/stream/...
    }

    axiosInstance.get(fetchUrl, {
      responseType: 'blob',
    })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = url;
        setBlobUrl(url);
      })
      .catch(err => {
        console.error('Failed to fetch file blob', err);
        setBlobError(t('file_preview.load_failed'));
      })
      .finally(() => setBlobLoading(false));

    return () => {
      isMounted = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fileUrl]);

  if (!isOpen || !fileUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    if (isPrivate) return;
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'document';
      a.click();
    }
  };

  const renderContent = () => {
    if (blobLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{t('file_preview.secure_loading')}</p>
        </div>
      );
    }

    if (blobError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px] text-center p-8">
          <FileText className="w-16 h-16 text-red-400" />
          <p className="text-red-300 font-semibold">{blobError}</p>
        </div>
      );
    }

    if (!blobUrl) return null;

    switch (detectedType) {
      case 'image':
        return (
          <div className="relative flex-1 flex items-center justify-center overflow-auto p-4 bg-slate-950/40 rounded-2xl min-h-[300px]">
            <img
              src={blobUrl}
              alt={fileName || t('file_preview.preview')}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.2s ease-out' }}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <button onClick={handleZoomOut} className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs font-semibold text-slate-400 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={handleRotate} className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"><RotateCw className="w-4 h-4" /></button>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="relative flex-1 w-full h-[65vh] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              title={fileName || t('file_preview.pdf_preview')}
              className="w-full h-full border-0"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative flex-1 flex items-center justify-center p-2 bg-black rounded-2xl overflow-hidden border border-white/5">
            <video src={blobUrl} controls autoPlay className="max-h-[60vh] max-w-full rounded-lg shadow-2xl" />
          </div>
        );

      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/5">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg animate-pulse">
              <Music className="w-10 h-10 text-amber-500" />
            </div>
            <div className="text-center max-w-md">
              <h4 className="text-white font-bold text-lg truncate mb-1">{fileName || t('file_preview.audio_file')}</h4>
              <p className="text-xs text-slate-400">{t('file_preview.audio_playback')}</p>
            </div>
            <audio src={blobUrl} controls className="w-full max-w-md" />
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
            <div className="text-center max-w-md">
              <h4 className="text-white font-bold text-lg break-all mb-1">{fileName || t('file_preview.document')}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold bg-slate-800/40 px-3 py-1 rounded-full border border-white/5 inline-block">
                {t('file_preview.file_type', { extension: extension.toUpperCase() })}
              </p>
            </div>
            {!isPrivate && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer border-none"
              >
                <Download className="w-4 h-4" /> {t('library.download')}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-[90vw] max-h-[85vh] flex flex-col z-10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40 flex-shrink-0">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-amber-400 flex-shrink-0">
              {detectedType === 'image' ? <Image className="w-5 h-5" /> : detectedType === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-white font-bold text-sm sm:text-base truncate leading-snug">{fileName || t('file_preview.file_preview')}</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                {isPrivate && <span className="text-red-400">🔒 {t('file_preview.secure_document')}</span>}
                {!isPrivate && t('file_preview.interactive_preview')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPrivate && blobUrl && (
              <button
                onClick={handleDownload}
                title={t('file_preview.download_file')}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-6 flex flex-col relative min-h-0">
          {violation ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md p-8 text-center rounded-b-3xl">
              <ShieldAlert className="w-20 h-20 text-red-500 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white mb-2">{t('file_preview.access_blocked')}</h2>
              <p className="text-red-200 text-lg max-w-md">
                {t('file_preview.suspicious_behavior')}: <strong className="text-white">{violation}</strong>
              </p>
              <p className="text-slate-400 mt-4 text-sm max-w-md">
                {t('file_preview.confidential_warning')}
              </p>
              <button
                onClick={onClose}
                className="mt-8 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition-colors cursor-pointer border-none"
              >
                {t('file_preview.exit_view')}
              </button>
            </div>
          ) : (
            renderContent()
          )}

          {/* Watermark & Anti-Cheat for private docs */}
          {isPrivate && !blobLoading && blobUrl && !violation && (
            <>
              <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden select-none" style={{ opacity: 0.08 }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: `${(i % 8) * 13}%`,
                      left: `${Math.floor(i / 8) * 25}%`,
                      transform: 'rotate(-35deg)',
                      whiteSpace: 'nowrap',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                    }}
                  >
                    {t('file_preview.confidential')} - {user?.email || user?.firstName || t('live_class.student')} - {new Date().toLocaleDateString()}
                  </div>
                ))}
              </div>
              <AntiCheatMonitor active={true} onViolation={(reason) => setViolation(reason)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
