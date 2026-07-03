import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { mediaService } from '../../services/mediaService';
import FilePreviewModal, { getThumbnailUrl, getFullFileUrl } from '../../components/public/FilePreviewModal';

const EMPTY_FORM = { title: '', description: '', type: 'photo', url: '', status: 'Review', files: [] };
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://interiilink.com';

const TYPE_ICONS = { photo: '📷', video: '🎥' };
const STATUS_COLORS = {
  Live: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Archived: 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

function ManageGallery() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Custom Dashboard Layout upgrades:
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (default) or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    { key: 'title', header: t('dashboard.screens.gallery.album', 'Album / Fichier'), render: (row) => <span className="font-bold text-white">{row.title?.fr || row.title}</span> },
    { key: 'type', header: t('dashboard.screens.gallery.type', 'Type'), render: (row) => <span className="px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] bg-pink-500/10 text-pink-400">{row.type}</span> },
    { 
      key: 'url', 
      header: t('dashboard.screens.gallery.url', 'Aperçu / Miniature'), 
      render: (row) => {
        const fullUrl = getFullFileUrl(row.url);
        const thumbUrl = getThumbnailUrl(row.url);
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 relative group">
              {row.url ? (
                <img
                  src={thumbUrl}
                  alt="Miniature"
                  onError={(e) => {
                    e.target.src = fullUrl;
                  }}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <span className="text-lg">📷</span>
              )}
              {row.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="text-[10px]">▶️</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setPreviewFile({
                url: row.url,
                name: row.title?.fr || row.title,
                type: row.type === 'video' ? 'video' : 'image'
              })}
              className="text-xs bg-pink-500/10 hover:bg-pink-500 hover:text-white border border-pink-500/20 text-pink-400 px-2 py-1 rounded-md transition-all cursor-pointer font-bold"
            >
              Aperçu
            </button>
          </div>
        );
      }
    },
    { key: 'createdAt', header: t('dashboard.screens.gallery.date', 'Ajouté le'), render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    { key: 'status', header: t('dashboard.screens.gallery.status', 'Statut'), render: (row) => <StatusBadge value={row.status} /> },
  ];

  const fetchMedia = async () => {
    try {
      const data = await mediaService.getMedia();
      setRows(data.filter(m => m.type !== 'flyer'));
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleAction = (type, row) => {
    setModalState({ type, row });
    if (type === 'Create') setForm(EMPTY_FORM);
    if (type === 'Edit') setForm({ title: row.title, description: row.description || '', type: row.type, url: row.url, status: row.status, files: [] });
  };
  const closeModal = () => { setModalState(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setUploadProgress(0);
    try {
      if (form.files && form.files.length > 0) {
        let count = 0;
        for (let i = 0; i < form.files.length; i++) {
          const file = form.files[i];
          const formData = new FormData();
          formData.append('title', form.title);
          formData.append('description', form.description);
          formData.append('type', form.type);
          formData.append('status', form.status);
          formData.append('file', file, `media_${file.name}`);
          
          await mediaService.createMedia(formData);
          count++;
          setUploadProgress(Math.round((count / form.files.length) * 100));
        }
      } else if (form.url) {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('type', form.type);
        formData.append('status', form.status);
        formData.append('url', form.url);
        await mediaService.createMedia(formData);
      }

      toast.success('Média(s) ajouté(s) !'); fetchMedia(); closeModal();
    } catch { toast.error('Erreur sauvegarde'); }
    finally { setSaving(false); setUploadProgress(0); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await mediaService.deleteMedia(modalState.row._id);
      toast.success('Média supprimé'); fetchMedia(); closeModal();
    } catch { toast.error('Erreur suppression'); }
    finally { setSaving(false); }
  };

  const filteredMedia = rows.filter(item => {
    const titleText = (item.title?.fr || item.title || '').toLowerCase();
    const descText = (item.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return !searchQuery || titleText.includes(query) || descText.includes(query);
  });

  if (loading) return <Loader />;

  return (
    <>
      {/* Dynamic Header Panel */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher dans la galerie..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-pink-500/60 transition-colors text-sm w-64"
          />
          <div className="flex border border-white/10 rounded-xl overflow-hidden bg-[#0f172a]">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none ${viewMode === 'cards' ? 'bg-pink-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
            >
              🗂️ Cartes
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none ${viewMode === 'table' ? 'bg-pink-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
            >
              📋 Tableau
            </button>
          </div>
        </div>
        <button
          onClick={() => handleAction('Create')}
          className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all border-none cursor-pointer flex items-center gap-2 text-sm"
        >
          + Ajouter un Média
        </button>
      </div>

      {/* Render layout based on viewMode */}
      {viewMode === 'cards' ? (
        filteredMedia.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-slate-400 font-bold text-lg">Aucun média trouvé</p>
            <p className="text-slate-500 text-xs mt-1">La galerie est vide ou aucun élément ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredMedia.map(item => {
              const fullUrl = getFullFileUrl(item.url);
              const thumbUrl = getThumbnailUrl(item.url);
              return (
                <div
                  key={item._id}
                  className="bg-[#0f172a]/60 border border-white/10 hover:border-pink-500/30 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/5 transition-all flex flex-col group"
                >
                  {/* Card Thumbnail Area */}
                  <div className="h-48 relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-b border-white/5">
                    {item.url ? (
                      <img
                        src={thumbUrl}
                        alt={item.title?.fr || item.title}
                        onError={(e) => {
                          e.target.src = fullUrl;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-5xl">📷</span>
                    )}

                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <span className="text-3xl">▶️</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm ${STATUS_COLORS[item.status] || 'bg-slate-500/10 text-slate-300'}`}>
                      {item.status}
                    </span>

                    <span className="absolute top-3 right-3 bg-slate-900/80 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                      {TYPE_ICONS[item.type] || '📷'} {item.type}
                    </span>
                  </div>

                  {/* Details Area */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-white font-bold text-base mb-1.5 line-clamp-1">{item.title?.fr || item.title}</h4>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed flex-grow">
                      {item.description || 'Aucune description fournie.'}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                      <span className="text-[10px] text-slate-500 font-medium">
                        📅 {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewFile({
                            url: item.url,
                            name: item.title?.fr || item.title,
                            type: item.type === 'video' ? 'video' : 'image'
                          })}
                          className="p-2 rounded-lg bg-pink-600/10 border border-pink-500/20 text-pink-400 hover:text-white hover:bg-pink-600 transition-colors text-xs font-bold cursor-pointer"
                          title="Aperçu plein écran"
                        >
                          👁️ Aperçu
                        </button>
                        <button
                          onClick={() => handleAction('Delete', item)}
                          className="p-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-600 transition-colors text-xs font-bold cursor-pointer"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <DataTable 
          title={t('dashboard.screens.gallery.title', 'Assets Numériques')} 
          rows={filteredMedia} 
          columns={columns} 
          searchPlaceholder={t('dashboard.actions.search', 'Rechercher...')} 
          filters={['Live', 'Review', 'Archived']} 
          addAction={`+ ${t('dashboard.screens.gallery.add_media', 'Ajouter un Média')}`} 
          onAction={handleAction} 
        />
      )}

      {/* MODAL SYSTEM */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modalState.type === 'Create' || modalState.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-white font-black text-xl mb-2">{modalState.type === 'Create' ? t('dashboard.screens.gallery.add_media') : t('dashboard.actions.edit')}</h3>
                <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">Titre</span>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/60 w-full" placeholder="Titre du média..." />
                </label>
                <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">Description</span>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/60 w-full resize-none" rows={2} placeholder="Description (facultatif)" />
                </label>
                <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">Fichier(s)</span>
                  <input type="file" multiple required={modalState.type === 'Create'} onChange={(e) => setForm({ ...form, files: Array.from(e.target.files) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 outline-none w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20" accept="image/*,video/*" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.gallery.type')}</span>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none w-full">
                      <option value="photo">Photo</option><option value="video">Vidéo</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.gallery.status')}</span>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none w-full">
                      {['Review', 'Live', 'Archived'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? (uploadProgress > 0 ? `Upload... ${uploadProgress}%` : t('dashboard.actions.saving', 'Sauvegarde...')) : t('dashboard.actions.save', 'Enregistrer')}</button>
                </div>
              </form>
            )}

            {modalState.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete', 'Supprimer')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modalState.row.title?.fr || modalState.row.title}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving', 'Suppression...') : t('dashboard.actions.delete', 'Supprimer')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reusable premium glassmorphic modal file preview system */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        fileType={previewFile?.type}
      />
    </>
  );
}

export default ManageGallery;
