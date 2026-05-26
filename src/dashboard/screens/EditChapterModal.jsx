import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
const uuidv4 = () => crypto.randomUUID();
import { courseService } from '../../services/courseService';
import VideoMarkerModal from './VideoMarkerModal';

/* ─── Shared styles ─────────────────────────────────────── */
const INPUT = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full placeholder:text-slate-600 text-sm';

/* ─── FieldCard — mirrors wowinvest Paper card style ──── */
function FieldCard({ label, onEdit, editIcon = true, children }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mb-3">
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10">
        <span className="text-sm font-bold text-blue-200">{label}</span>
        {onEdit && editIcon && (
          <button
            onClick={onEdit}
            className="text-slate-400 hover:text-blue-400 transition-colors text-sm cursor-pointer bg-transparent border-none flex items-center gap-1"
          >
            <i className="fa-solid fa-pen" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="bg-white/[0.02] px-4 py-3 min-h-[46px]">
        {children}
      </div>
    </div>
  );
}

/* ─── Inline edit dialog ─────────────────────────────── */
function EditDialog({ open, title, onClose, onSave, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={onClose}>
      <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-black text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-5 py-2.5 border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 rounded-xl cursor-pointer text-sm">Cancel</button>
          <button onClick={onSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl border-none cursor-pointer text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Progress bar ─────────────────────────────────────── */
function ProgressBar({ value, color = 'blue', label }) {
  const colors = { blue: 'bg-blue-500', violet: 'bg-violet-500' };
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span><span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-300 ${colors[color]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════ */
export default function EditChapterModal({ chapter, onClose, open, courseId, onChapterUpdated }) {

  const [chapterData, setChapterData] = useState({
    title: chapter?.title || '',
    description: chapter?.description || '',
    isFreePreview: chapter?.free || false,
    videoUrl: chapter?.videoUrl || null,
    videoName: chapter?.videoName || '',
    videoTranscript: chapter?.videoTranscript || '',
    videoNotions: chapter?.videoNotions || [],
    resources: (chapter?.resources || []).map((r, i) => ({
      _id: r._id || `temp-${Date.now()}-${i}`,
      name: r.name,
      type: r.type || (r.url?.match(/\.(jpg|jpeg|png)$/i) ? 'image' : r.url?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'document'),
      url: r.url || r.content,
      size: r.size || 0,
      transcript: r.transcript,
    })),
    priceIfLocked: chapter?.priceIfLocked || 0,
    order: chapter?.order || 0,
    published: chapter?.published || false,
  });

  /* ── Videos ── */
  const [sectionVideos, setSectionVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoFetchError, setVideoFetchError] = useState('');

  /* ── Upload ── */
  const [videoFile, setVideoFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [axiosProgress, setAxiosProgress] = useState(0);
  const [vimeoProgress, setVimeoProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  /* ── Resources ── */
  const [newResources, setNewResources] = useState([]);
  const [resourceMode, setResourceMode] = useState(null);
  const [resourceData, setResourceData] = useState({ name: '', type: 'document', url: '', size: 0, file: null, transcript: '' });
  const [transcriptFile, setTranscriptFile] = useState(null);

  /* ── Inline edit dialogs ── */
  const [editDialog, setEditDialog] = useState(null); // 'title'|'description'|'access'
  const [editValue, setEditValue] = useState('');

  /* ── Marker modal ── */
  const [markerTarget, setMarkerTarget] = useState(null);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [videoEditTarget, setVideoEditTarget] = useState(null);
  const [videoEditData, setVideoEditData] = useState({ title: '', description: '' });

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Preview ── */
  const [previewResource, setPreviewResource] = useState(null);

  /* ── Save ── */
  const [isSaving, setIsSaving] = useState(false);

  /* ── Refs ── */
  const socketRef = useRef(null);
  const uploadJobRef = useRef(null);
  const fileInputRef = useRef(null);
  const resourceFileRef = useRef(null);
  const transcriptFileRef = useRef(null);

  /* completion tracking */
  const completion = {
    title: !!chapterData.title.trim(),
    description: !!chapterData.description.trim(),
    video: sectionVideos.length > 0,
  };
  const completed = Object.values(completion).filter(Boolean).length;
  const total = Object.keys(completion).length;

  /* ── Socket.io ── */
  useEffect(() => {
    if (!open) return;
    const url = import.meta.env.VITE_SOCKET_IO_URL || window.location.origin.replace(/:[0-9]+$/, ':5001');
    socketRef.current = io(url, { reconnectionAttempts: 3 });
    socketRef.current.on('vimeoUploadProgress', d => {
      if (d.uploadJobId === uploadJobRef.current) setVimeoProgress(d.progress || 0);
    });
    socketRef.current.on('vimeoUploadComplete', d => {
      if (d.uploadJobId === uploadJobRef.current) setVimeoProgress(100);
    });
    socketRef.current.on('vimeoUploadError', d => {
      if (d.uploadJobId === uploadJobRef.current) {
        toast.error(d.message || 'Vimeo error.'); setIsUploading(false); uploadJobRef.current = null;
      }
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [open]);

  /* ── Fetch videos ── */
  const fetchVideos = useCallback(async () => {
    if (!chapter?._id) return;
    setIsLoadingVideos(true); setVideoFetchError('');
    try {
      const data = await courseService.getVideos(chapter._id);
      const list = data.videos || (Array.isArray(data) ? data : []);
      setSectionVideos(list);
      if (list[0]) setChapterData(p => ({ ...p, videoUrl: list[0].videoUrl || null, videoName: list[0].title || '' }));
    } catch (err) {
      setVideoFetchError(err.response?.data?.message || 'Unable to load videos.');
    } finally { setIsLoadingVideos(false); }
  }, [chapter?._id]);

  useEffect(() => { if (open) fetchVideos(); }, [open, fetchVideos]);

  if (!open) return null;

  /* ─── Handlers ─── */

  const handleFileChange = e => {
    const f = e.target.files[0]; if (!f) return;
    setVideoFile(f);
    setUploadTitle(f.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\s_-]/g, ''));
    setAxiosProgress(0); setVimeoProgress(0);
  };

  const handleUploadSubmit = async e => {
    e.preventDefault();
    if (!videoFile) { toast.warning('Select a video file.'); return; }
    if (!uploadTitle.trim()) { toast.warning('Title is required.'); return; }

    const jobId = uuidv4();
    uploadJobRef.current = jobId;
    if (socketRef.current?.connected) socketRef.current.emit('joinUploadRoom', jobId);

    setIsUploading(true); setAxiosProgress(0); setVimeoProgress(0);
    const fd = new FormData();
    fd.append('video', videoFile); fd.append('title', uploadTitle);
    fd.append('description', uploadDescription); fd.append('uploadJobId', jobId);

    try {
      const uploaded = await courseService.uploadVideoFile(fd, ev => setAxiosProgress(Math.round(ev.loaded / ev.total * 100)));
      const payload = {
        vimeoVideoId: uploaded.vimeoVideoId,
        title: uploaded.title || uploadTitle,
        description: uploaded.description || uploadDescription,
        duration: Number(uploaded.duration) || 0,
        thumbnailUrl: uploaded.thumbnailUrl || '',
        url: uploaded.url || uploaded.link || '',
      };
      const saved = await courseService.addVideo(chapter._id, payload);
      setSectionVideos(prev => [...prev, { ...payload, ...saved }]);
      setChapterData(p => ({ ...p, videoUrl: saved.url || payload.url, videoName: saved.title || payload.title }));
      toast.success('Video added successfully.');
    } catch (err) {
      console.error('Video upload/save error:', err);
      toast.error(err.response?.data?.message || 'Video upload failed.');
    } finally {
      setIsUploading(false);
      setVideoFile(null); setUploadTitle(''); setUploadDescription('');
      setAxiosProgress(0); setVimeoProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = null;
      if (socketRef.current && uploadJobRef.current) socketRef.current.emit('leaveUploadRoom', uploadJobRef.current);
      uploadJobRef.current = null;
    }
  };

  const handleDeleteVideo = async id => {
    try {
      await courseService.deleteVideoFromSection(chapter._id, id);
      setSectionVideos(prev => prev.filter(v => v._id !== id));
      toast.success('Video deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de supprimer.');
    }
    setDeleteTarget(null);
  };

  const openVideoEdit = (video) => {
    setVideoEditTarget(video);
    setVideoEditData({
      title: video.title || video.videoName || '',
      description: video.description || '',
    });
  };

  const handleSaveVideoEdit = async () => {
    if (!videoEditTarget?._id) return;
    if (!videoEditData.title.trim()) {
      toast.error('Video title cannot be empty.');
      return;
    }

    try {
      const updatedVideo = await courseService.updateVideoDetails(videoEditTarget._id, {
        title: videoEditData.title.trim(),
        description: videoEditData.description.trim(),
      });
      setSectionVideos((prev) => prev.map((video) => video._id === updatedVideo._id ? updatedVideo : video));
      if (markerTarget?._id === updatedVideo._id) setMarkerTarget(updatedVideo);
      setChapterData((prev) => ({
        ...prev,
        videoName: prev.videoName === videoEditTarget.title || prev.videoName === videoEditTarget.videoName
          ? updatedVideo.title
          : prev.videoName,
      }));
      toast.success('Video details updated.');
      setVideoEditTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update video details.');
    }
  };

  const handleSaveEdit = () => {
    if (editDialog === 'title' && !editValue.trim()) { toast.error('Title cannot be empty.'); return; }
    setChapterData(p => ({ ...p, [editDialog]: editValue }));
    toast.success('Updated.');
    setEditDialog(null);
  };

  const handleTranscriptFileChange = e => {
    const f = e.target.files[0]; if (!f) return;
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
    if (!allowed.includes(f.type) && !/\.(pdf|doc|docx|txt)$/i.test(f.name)) { toast.error('Unsupported type. Allowed: PDF, Word, txt.'); return; }
    setTranscriptFile(f);
    setChapterData(p => ({ ...p, videoTranscript: f.name }));
  };

  const handleResourceFileChange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const type = f.type.includes('image') ? 'image' : f.type.includes('video') ? 'video' : 'document';
      setResourceData(p => ({ ...p, name: p.name.trim() || f.name, type, url: ev.target.result, size: f.size, file: f }));
    };
    reader.readAsDataURL(f);
  };

  const handleSaveResource = () => {
    if (!resourceData.name.trim()) { toast.error('Nom requis.'); return; }
    if (resourceMode?.mode === 'add' && !resourceData.file) { toast.error('Select a file.'); return; }
    if (resourceData.file && resourceData.file.size > 10 * 1024 * 1024) { toast.error('Max 10 Mo.'); return; }

    const payload = { ...resourceData, thumbnailName: '' };
    if (resourceMode?.mode === 'add') {
      setNewResources(p => [...p, { ...payload, _id: `temp-${Date.now()}` }]);
      toast.success(`"${resourceData.name}" added.`);
    } else {
      const isNew = typeof resourceData._id === 'string' && resourceData._id.startsWith('temp-');
      if (isNew) setNewResources(p => p.map(r => r._id === resourceData._id ? payload : r));
      else setChapterData(p => ({ ...p, resources: p.resources.map(r => r._id === resourceData._id ? payload : r) }));
      toast.success('Resource updated.');
    }
    setResourceMode(null);
    setResourceData({ name: '', type: 'document', url: '', size: 0, file: null, transcript: '' });
    if (resourceFileRef.current) resourceFileRef.current.value = null;
  };

  const handleDeleteResource = id => {
    const isNew = typeof id === 'string' && id.startsWith('temp-');
    if (isNew) setNewResources(p => p.filter(r => r._id !== id));
    else setChapterData(p => ({ ...p, resources: p.resources.filter(r => r._id !== id) }));
    toast.success('Resource deleted.');
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    if (!chapterData.title.trim()) { toast.error('Chapter title is required.'); return; }
    setIsSaving(true);
    try {
      const allRes = [...chapterData.resources, ...newResources];
      const resources = allRes.map(r => {
        const m = { name: r.name, thumbnailName: r.thumbnailName || '', type: r.type, size: r.size, url: r.url, transcript: r.transcript };
        if (r._id && !r._id.startsWith('temp-')) m._id = r._id;
        return m;
      });
      const sectionPayload = {
        title: chapterData.title, description: chapterData.description,
        isPreviewable: chapterData.isFreePreview, priceIfLocked: chapterData.priceIfLocked || 0,
        order: chapterData.order || 0, course: courseId,
        videos: sectionVideos.map(v => v._id), resources,
      };
      if (chapterData.videoTranscript && typeof chapterData.videoTranscript === 'object') {
        sectionPayload.videoTranscript = chapterData.videoTranscript;
      } else if (typeof chapterData.videoTranscript === 'string' && chapterData.videoTranscript.trim()) {
        sectionPayload.videoTranscript = chapterData.videoTranscript.trim();
      }
      await courseService.updateSection(chapter._id, sectionPayload).then((updated) => {
        if (onChapterUpdated) onChapterUpdated(updated);
      });
      toast.success('Chapter saved.');
      setTimeout(onClose, 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save the chapter.');
    } finally { setIsSaving(false); }
  };

  const formatTime = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };
  const formatSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const allResources = [...chapterData.resources, ...newResources];

  /* ════════ RENDER ════════ */
  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4" onMouseDown={onClose}>
        <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-[1100px] shadow-2xl my-8" onMouseDown={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-white/10">
            {/* back */}
            <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 text-sm font-bold cursor-pointer bg-transparent border-none transition-colors">
              <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to course setup
            </button>
            {/* publish */}
            <button
              onClick={async () => {
                if (!chapter?._id) return toast.error('Save this chapter before changing its status.');
                if (!chapterData.published && completed !== total) {
                  return toast.error('Complete all required fields (title, description, video) before publishing.');
                }
                try {
                  const next = !chapterData.published;
                  const updated = await courseService.publishSection(chapter._id, next);
                  setChapterData((previous) => ({ ...previous, published: next }));
                  if (onChapterUpdated) onChapterUpdated(updated);
                  toast.success(`Chapter ${next ? 'published' : 'unpublished'}.`);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Unable to update the chapter status.');
                }
              }}
              disabled={!chapterData.published && completed !== total}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chapterData.published ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-[#1e3a8a] hover:bg-blue-700 text-white'}`}
            >
              {chapterData.published ? 'Unpublish' : 'Publish'}
            </button>
          </div>

          {/* ── Sub-header ── */}
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-2xl font-black text-blue-100">Chapter creation</h2>
            <p className="text-slate-500 text-sm mt-1">
              Complete fields: {completed}/{total} · Status: <span className={chapterData.published ? 'text-emerald-400' : 'text-slate-400'}>{chapterData.published ? 'Published' : 'Draft'}</span>
            </p>
          </div>

          {/* ── Body: two-column ── */}
          <div className="px-6 pb-6 grid md:grid-cols-2 gap-6">

            {/* ══ LEFT: Customize + Access + Resources ══ */}
            <div>
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-sliders" aria-hidden="true" /></div>
                <span className="text-base font-black text-blue-100">Customize your chapter</span>
              </div>

              {/* TITLE */}
              <FieldCard label="Chapter title" onEdit={() => { setEditDialog('title'); setEditValue(chapterData.title); }}>
                <span className="text-white">{chapterData.title || <span className="text-slate-500 italic">Not set</span>}</span>
              </FieldCard>

              {/* DESCRIPTION */}
              <FieldCard label="Chapter description" onEdit={() => { setEditDialog('description'); setEditValue(chapterData.description); }}>
                <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm line-clamp-4">
                  {chapterData.description || <span className="text-slate-500 italic">Not set</span>}
                </pre>
              </FieldCard>

              {/* ACCESS SETTINGS */}
              <div className="flex items-center gap-3 mb-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-eye" aria-hidden="true" /></div>
                <span className="text-base font-black text-blue-100">Access settings</span>
              </div>

              <FieldCard label="Free preview" onEdit={() => { setEditDialog('isFreePreview'); setEditValue(chapterData.isFreePreview); }}>
                <span className={`font-bold ${chapterData.isFreePreview ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <i className={`fa-solid ${chapterData.isFreePreview ? 'fa-unlock' : 'fa-lock'} mr-2`} aria-hidden="true" />
                  {chapterData.isFreePreview ? 'Free preview enabled' : 'Free preview disabled'}
                </span>
              </FieldCard>

              {/* RESOURCES */}
              <div className="flex items-center gap-3 mb-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-link" aria-hidden="true" /></div>
                <span className="text-base font-black text-blue-100">Chapter resources</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 mb-3">
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10">
                  <span className="text-sm font-bold text-blue-200">Resources</span>
                  <button
                    onClick={() => { setResourceMode({ mode: 'add' }); setResourceData({ name: '', type: 'document', url: '', size: 0, file: null, transcript: '' }); if (resourceFileRef.current) resourceFileRef.current.value = null; }}
                    className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer bg-transparent border-none"
                  ><i className="fa-solid fa-plus" aria-hidden="true" /></button>
                </div>
                <div className="bg-white/[0.02] divide-y divide-white/5">
                  {allResources.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      No resources yet. Click + to add one.
                    </div>
                  ) : allResources.map((r, i) => {
                    const icons = { image: 'fa-regular fa-image', video: 'fa-solid fa-film', document: 'fa-regular fa-file-lines' };
                    const name = typeof r.name === 'object' ? r.name.name : r.name;
                    const isNew = typeof r._id === 'string' && r._id.startsWith('temp-');
                    return (
                      <div key={r._id || i} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xl flex-shrink-0 text-blue-300"><i className={icons[r.type] || 'fa-regular fa-file-lines'} aria-hidden="true" /></span>
                        <div className="flex-grow min-w-0">
                          <div className="font-bold text-white text-sm truncate">{name}</div>
                          <div className="text-xs text-slate-500">
                            {r.type} {r.size ? `· ${formatSize(r.size)}` : ''} {r.type === 'video' && r.transcript ? '· Transcript available' : ''} {isNew ? '· Unsaved' : ''}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {r.type !== 'document' && r.url && (
                            <button onClick={() => setPreviewResource(r)} className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors text-xs cursor-pointer" title="Preview"><i className="fa-solid fa-eye" aria-hidden="true" /></button>
                          )}
                          <button onClick={() => { setResourceMode({ mode: 'edit', idx: i }); setResourceData({ ...r, file: null }); }} className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors text-xs cursor-pointer" title="Edit"><i className="fa-solid fa-pen" aria-hidden="true" /></button>
                          <button onClick={() => setDeleteTarget({ type: 'resource', id: r._id })} className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors text-xs cursor-pointer" title="Delete"><i className="fa-solid fa-trash" aria-hidden="true" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transcript upload */}
              <div className="rounded-xl overflow-hidden border border-white/10">
                <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10">
                  <span className="text-sm font-bold text-blue-200">Video transcript (optional)</span>
                </div>
                <div className="px-4 py-4 bg-white/[0.02] space-y-3">
                  <input ref={transcriptFileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleTranscriptFileChange} className="hidden" />
                  <button
                    onClick={() => transcriptFileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl text-sm cursor-pointer transition-colors bg-transparent"
                  >
                    <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Upload transcript
                  </button>
                  {transcriptFile && <p className="text-xs text-slate-400">Selected file: {transcriptFile.name}</p>}
                  {chapterData.videoTranscript && !transcriptFile && (
                    <p className="text-xs text-slate-400">Current transcript: {typeof chapterData.videoTranscript === 'object' ? chapterData.videoTranscript.name : chapterData.videoTranscript}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ══ RIGHT: Video upload + Section videos ══ */}
            <div>
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-film" aria-hidden="true" /></div>
                <span className="text-base font-black text-blue-100">Add a video</span>
              </div>

              {/* Video upload card */}
              <div className="rounded-xl overflow-hidden border border-white/10 mb-5">
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10">
                  <span className="text-sm font-bold text-blue-200">
                    Chapter video{chapterData.videoName ? ` - ${chapterData.videoName}` : ''}
                  </span>
                  <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-blue-400 text-sm cursor-pointer bg-transparent border-none"><i className="fa-solid fa-pen" aria-hidden="true" /></button>
                </div>
                <div className="bg-white/[0.02] px-4 py-4 space-y-3">
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Video title</label>
                    <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className={INPUT} placeholder="Video title..." />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                    <textarea value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} rows={3} className={INPUT} placeholder="Video summary..." />
                  </div>

                  {videoFile && !isUploading && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">File: {videoFile.name}</p>
                      <button
                        onClick={handleUploadSubmit}
                        disabled={!uploadTitle.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl border-none cursor-pointer text-sm transition-colors"
                      >
                        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Upload video to server
                      </button>
                    </div>
                  )}

                  {!videoFile && !isUploading && (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl cursor-pointer text-sm transition-colors bg-transparent"
                      >
                        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Upload video (max: 500 MB)
                      </button>
                      <span className="text-xs text-slate-500">Formats: MP4, WebM, MOV</span>
                      {videoFetchError && <span className="text-xs text-red-400">{videoFetchError}</span>}
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span>Uploading to Vimeo...</span>
                      </div>
                      <ProgressBar value={axiosProgress} color="blue" label={`Transfer ${Math.round(axiosProgress)}%`} />
                      <ProgressBar value={vimeoProgress} color="violet" label={`Vimeo processing ${Math.round(vimeoProgress)}%`} />
                    </div>
                  )}
                </div>
              </div>

              {/* Section videos list */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-video" aria-hidden="true" /></div>
                <span className="text-base font-black text-blue-100">Section videos</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10">
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10">
                  <span className="text-sm font-bold text-blue-200">Available videos</span>
                  <button onClick={fetchVideos} disabled={isLoadingVideos} className="text-slate-400 hover:text-blue-400 text-sm cursor-pointer bg-transparent border-none disabled:opacity-50 transition-colors">
                    {isLoadingVideos ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" /> : <i className="fa-solid fa-rotate-right" aria-hidden="true" />}
                  </button>
                </div>
                <div className="bg-white/[0.02] divide-y divide-white/5">
                  {isLoadingVideos ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : videoFetchError ? (
                    <div className="px-4 py-4 text-red-400 text-sm">{videoFetchError}</div>
                  ) : sectionVideos.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">No videos found for this section.</div>
                  ) : sectionVideos.map(video => (
                    <div key={video._id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xl flex-shrink-0 text-violet-300"><i className="fa-solid fa-clapperboard" aria-hidden="true" /></span>
                      <div className="flex-grow min-w-0">
                        <div className="font-bold text-white text-sm truncate">{video.title || video.videoName || 'Video'}</div>
                        <div className="text-xs text-slate-500">{video.duration ? `Duration: ${formatTime(video.duration)}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openVideoEdit(video)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold cursor-pointer flex items-center gap-1.5"
                          title="Edit video title and description"
                        >
                          <i className="fa-solid fa-pen" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          onClick={() => { setMarkerTarget(video); setMarkerOpen(true); }}
                          className="px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                        >
                          Add notions
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'video', id: video._id })}
                          className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors text-xs cursor-pointer"
                        ><i className="fa-solid fa-trash" aria-hidden="true" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer actions ── */}
          {isSaving && (
            <div className="px-6 pb-2">
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 bg-blue-500 rounded-full animate-pulse w-3/4" />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1">Saving...</p>
            </div>
          )}
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10">
            <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 rounded-xl cursor-pointer text-sm transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!chapterData.title.trim() || isSaving}
              className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl border-none cursor-pointer text-sm transition-colors flex items-center gap-2"
            >
              {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ══ EDIT DIALOGS ══ */}
      <EditDialog open={editDialog === 'title'} title="Edit title" onClose={() => setEditDialog(null)} onSave={handleSaveEdit}>
        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className={INPUT} placeholder="Chapter title..." onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} />
      </EditDialog>

      <EditDialog open={editDialog === 'description'} title="Edit description" onClose={() => setEditDialog(null)} onSave={handleSaveEdit}>
        <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} rows={7} className={INPUT} placeholder="Chapter description..." />
      </EditDialog>

      <EditDialog open={editDialog === 'isFreePreview'} title="Access settings" onClose={() => setEditDialog(null)} onSave={() => { setChapterData(p => ({ ...p, isFreePreview: editValue })); setEditDialog(null); }}>
        <label className="flex items-center gap-4 cursor-pointer">
          <div
            onClick={() => setEditValue(v => !v)}
            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${editValue ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${editValue ? 'left-6' : 'left-0.5'}`} />
          </div>
          <span className={`font-bold text-sm ${editValue ? 'text-emerald-400' : 'text-slate-400'}`}>
            {editValue ? 'Free preview enabled' : 'Free preview disabled'}
          </span>
        </label>
      </EditDialog>

      {/* ══ Resource form dialog ══ */}
      {resourceMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={() => setResourceMode(null)}>
          <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-black text-base">{resourceMode.mode === 'add' ? 'Add resource' : 'Edit resource'}</h3>
              <button onClick={() => setResourceMode(null)} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Resource name</label>
                <input type="text" value={typeof resourceData.name === 'object' ? resourceData.name.name : resourceData.name} onChange={e => setResourceData(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Name..." />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">File</label>
                <input ref={resourceFileRef} type="file" accept=".jpg,.jpeg,.png,.mp4,.webm,.mov,.pdf,.doc,.docx,.txt" onChange={handleResourceFileChange} className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600/20 file:text-blue-400 file:font-bold cursor-pointer" />
                {resourceData.file && <p className="text-xs text-slate-500 mt-1">{resourceData.file.name} ({formatSize(resourceData.size)})</p>}
              </div>
              {resourceData.type === 'video' && (
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Transcript (optional)</label>
                  <input ref={transcriptFileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleTranscriptFileChange} className="hidden" />
                  <button onClick={() => transcriptFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl cursor-pointer text-sm bg-transparent transition-colors">
                    <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Upload transcript
                  </button>
                  {transcriptFile && <p className="text-xs text-slate-400 mt-1">Selected: {transcriptFile.name}</p>}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button onClick={() => setResourceMode(null)} className="px-5 py-2.5 border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 rounded-xl cursor-pointer text-sm">Cancel</button>
              <button onClick={handleSaveResource} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl border-none cursor-pointer text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Video details editor ══ */}
      {videoEditTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={() => setVideoEditTarget(null)}>
          <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-white font-black text-base">Edit video details</h3>
                <p className="text-xs text-slate-500 mt-1">Update the title and description shown for this video.</p>
              </div>
              <button onClick={() => setVideoEditTarget(null)} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Video title</label>
                <input
                  autoFocus
                  value={videoEditData.title}
                  onChange={e => setVideoEditData(p => ({ ...p, title: e.target.value }))}
                  className={INPUT}
                  placeholder="Video title..."
                  onKeyDown={e => e.key === 'Enter' && handleSaveVideoEdit()}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Video description</label>
                <textarea
                  value={videoEditData.description}
                  onChange={e => setVideoEditData(p => ({ ...p, description: e.target.value }))}
                  rows={5}
                  className={INPUT}
                  placeholder="Describe what learners will understand in this video..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button onClick={() => setVideoEditTarget(null)} className="px-5 py-2.5 border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 rounded-xl cursor-pointer text-sm">Cancel</button>
              <button onClick={handleSaveVideoEdit} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl border-none cursor-pointer text-sm">Save video</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete confirm ══ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={() => setDeleteTarget(null)}>
          <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6" onMouseDown={e => e.stopPropagation()}>
            <h4 className="text-white font-black text-lg mb-2">Confirm deletion</h4>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this {deleteTarget.type === 'video' ? 'video' : 'resource'}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 rounded-xl cursor-pointer text-sm transition-colors">Cancel</button>
              <button
                onClick={() => deleteTarget.type === 'video' ? handleDeleteVideo(deleteTarget.id) : handleDeleteResource(deleteTarget.id)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl border-none cursor-pointer text-sm transition-colors"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Resource preview ══ */}
      {previewResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onMouseDown={() => setPreviewResource(null)}>
          <div className="bg-[#0d1526] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl p-4" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-bold">{typeof previewResource.name === 'object' ? previewResource.name.name : previewResource.name}</h4>
              <button onClick={() => setPreviewResource(null)} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
            </div>
            {previewResource.type === 'image' ? (
              <img src={previewResource.url} alt="" className="w-full max-h-[60vh] object-contain rounded-xl" />
            ) : (
              <video src={previewResource.url} controls className="w-full max-h-[60vh] rounded-xl"><track kind="captions" /></video>
            )}
          </div>
        </div>
      )}

      {/* ══ VideoMarkerModal ══ */}
      {markerTarget && (
        <VideoMarkerModal
          open={markerOpen}
          onClose={() => { setMarkerOpen(false); setMarkerTarget(null); }}
          sectionId={chapter._id}
          vimeoVideoId={markerTarget.vimeoVideoId}
          dbVideoId={markerTarget._id}
          video={markerTarget}
          videoNotions={chapterData.videoNotions}
          onNotionsUpdated={updated => setChapterData(p => ({ ...p, videoNotions: updated }))}
        />
      )}
    </>
  );
}
