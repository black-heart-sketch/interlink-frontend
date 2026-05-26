import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { testimonialService } from '../../services/testimonialService';
import FilePreviewModal, { getThumbnailUrl } from '../../components/public/FilePreviewModal';

const RATINGS = [1, 2, 3, 4, 5];
const EMPTY = { authorName: '', content: '', rating: 5, programId: '', isVerified: false, photo: '', internalValidationDoc: '' };

function F({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function ManageTestimonials() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [validationFile, setValidationFile] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetch = async () => {
    try { 
      setRows(await testimonialService.getTestimonials()); 
    } catch { 
      toast.error('Erreur de chargement'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetch(); 
  }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setForm(row ? { 
      authorName: row.authorName || row.studentName || '', 
      content: row.content || row.story || '', 
      rating: row.rating || 5, 
      programId: row.programId || row.program || '', 
      isVerified: row.isVerified ?? row.verified ?? false,
      photo: row.photo || '',
      internalValidationDoc: row.internalValidationDoc || ''
    } : EMPTY);
    setPhotoFile(null);
    setValidationFile(null);
  };

  const closeModal = () => { 
    setModal(null); 
    setForm(EMPTY); 
    setPhotoFile(null); 
    setValidationFile(null); 
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'photo' || k === 'internalValidationDoc') return;
        fd.append(k, v);
      });

      if (photoFile) {
        fd.append('photo', photoFile);
      } else if (form.photo) {
        fd.append('photo', form.photo);
      }

      if (validationFile) {
        fd.append('internalValidationDoc', validationFile);
      } else if (form.internalValidationDoc) {
        fd.append('internalValidationDoc', form.internalValidationDoc);
      }

      if (modal.type === 'Create') {
        await testimonialService.createTestimonial(fd);
      } else {
        await testimonialService.updateTestimonial(modal.row._id, fd);
      }
      toast.success(modal.type === 'Create' ? 'Témoignage ajouté !' : 'Témoignage mis à jour !');
      fetch(); 
      closeModal();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Erreur'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { 
      await testimonialService.deleteTestimonial(modal.row._id); 
      toast.success('Témoignage supprimé'); 
      fetch(); 
      closeModal(); 
    } catch { 
      toast.error('Erreur'); 
    } finally { 
      setSaving(false); 
    }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/60 transition-colors w-full";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/60 transition-colors w-full";

  // Filter and Search processing
  const filteredTestimonials = rows.filter(item => {
    const name = (item.authorName || item.studentName || '').toLowerCase();
    const content = (item.content || item.story || '').toLowerCase();
    const program = (item.programId || item.program || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || content.includes(query) || program.includes(query);

    const isVerified = item.isVerified ?? item.verified ?? false;
    if (statusFilter === 'verified') return matchesSearch && isVerified;
    if (statusFilter === 'pending') return matchesSearch && !isVerified;
    return matchesSearch;
  });

  // Stats calculation
  const totalCount = rows.length;
  const verifiedCount = rows.filter(r => r.isVerified ?? r.verified ?? false).length;
  const pendingCount = totalCount - verifiedCount;

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6 pb-12">
        {/* Title and Top Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">{t('dashboard.screens.testimonials.title', 'Témoignages')}</h1>
            <p className="text-slate-400 text-xs mt-1">Gérez les retours d'expérience et les réussites de vos étudiants.</p>
          </div>
          <button 
            onClick={() => openModal('Create')}
            className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs tracking-wider uppercase transition-colors border-none cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-600/15 active:scale-95"
          >
            <span>+</span> {t('dashboard.screens.testimonials.add_testimonial', 'Ajouter')}
          </button>
        </div>

        {/* Stats Grid Dashboard Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-teal-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total Témoignages</span>
              <h3 className="text-white text-3xl font-black mt-1">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950/40 flex items-center justify-center text-lg">💬</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Publiés & Vérifiés</span>
              <h3 className="text-emerald-400 text-3xl font-black mt-1">{verifiedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg text-emerald-400 border border-emerald-500/20">✓</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-amber-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">En Attente de Revue</span>
              <h3 className="text-amber-400 text-3xl font-black mt-1">{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg text-amber-400 border border-amber-500/20">⌛</div>
          </div>
        </div>

        {/* Search and Filters Frosted Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-md">
          {/* Real-time search box */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par étudiant, programme, contenu..."
              className="bg-[#0f172a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-teal-500/60 transition-colors w-full text-xs font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtering Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Tous', count: totalCount },
              { id: 'verified', label: 'Vérifiés', count: verifiedCount, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' },
              { id: 'pending', label: 'En attente', count: pendingCount, color: 'text-amber-400 bg-amber-500/5 border-amber-500/20' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === pill.id 
                    ? 'bg-teal-600 text-white border-teal-500/50 shadow-md' 
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${statusFilter === pill.id ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fancy Card Grid Layout */}
        {filteredTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((item) => {
              const isVerified = item.isVerified ?? item.verified ?? false;
              return (
                <div 
                  key={item._id} 
                  className="bg-gradient-to-br from-slate-900 via-[#131e31] to-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg group hover:border-teal-500/30 transition-all hover:scale-[1.01]"
                >
                  {/* Glowing background ring on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div>
                    {/* Student Info & Status Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950/80 overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center relative shadow-inner">
                          {item.photo ? (
                            <img
                              src={getThumbnailUrl(item.photo)}
                              alt={item.authorName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-400 bg-slate-900" style={{ display: item.photo ? 'none' : 'flex' }}>
                            {(item.authorName || item.studentName || '👤').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-extrabold text-sm truncate max-w-[120px]">{item.authorName || item.studentName}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5 max-w-[120px] truncate">{item.programId || item.program || '—'}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isVerified 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isVerified ? 'Vérifié' : 'Revue'}
                      </span>
                    </div>

                    {/* Rating stars */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {'★'.repeat(item.rating || 5).split('').map((s, idx) => (
                        <span key={idx} className="text-amber-400 text-xs">★</span>
                      ))}
                      {'☆'.repeat(5 - (item.rating || 5)).split('').map((s, idx) => (
                        <span key={idx} className="text-slate-600 text-xs">☆</span>
                      ))}
                    </div>

                    {/* Testimonial Quote text */}
                    <div className="relative mb-5 bg-white/5 border border-white/5 rounded-xl p-3.5 shadow-inner">
                      <span className="absolute top-1 left-2 text-3xl text-white/5 font-serif pointer-events-none select-none">“</span>
                      <p className="text-slate-300 text-xs leading-relaxed italic line-clamp-4 relative z-10">
                        "{item.content || item.story}"
                      </p>
                    </div>
                  </div>

                  {/* Document and Action Controls Footer */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    {/* Attachment badge */}
                    {item.internalValidationDoc ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-bold bg-teal-500/5 px-2.5 py-1 rounded-lg border border-teal-500/10">
                        <span>📄 Doc</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Aucun doc</span>
                    )}

                    {/* Primary actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openModal('View', item)}
                        title="Détails"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-teal-500/10 text-slate-300 hover:text-teal-400 border border-white/5 hover:border-teal-500/20 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => openModal('Edit', item)}
                        title="Modifier"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => openModal('Delete', item)}
                        title="Supprimer"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/5 hover:border-red-500/20 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Mockup Illustration */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-3xl mb-4 border border-white/10">
              💬
            </div>
            <h3 className="text-white font-extrabold text-lg">Aucun témoignage trouvé</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
              {searchQuery 
                ? "Aucun résultat ne correspond à votre recherche actuelle. Veuillez effacer le filtre ou essayer une autre requête."
                : "Commencez par ajouter le tout premier témoignage en cliquant sur le bouton d'ajout en haut à droite !"}
            </p>
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-colors border border-white/5 cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fancy popup Modals (Create, Edit, View, Delete) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Create' ? t('dashboard.screens.testimonials.add_testimonial') : t('dashboard.actions.edit')}</h3>
                </div>
                <F label={t('dashboard.screens.testimonials.author')}>
                  <input required value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className={inputCls} placeholder="ex: Amina Traore" />
                </F>
                <F label={t('dashboard.screens.testimonials.program')}>
                  <input value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} className={inputCls} placeholder="ex: Allemand B1 (optionnel)" />
                </F>
                <F label={t('dashboard.screens.testimonials.content')}>
                  <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={`${inputCls} resize-none`} placeholder="Ce que l'étudiant a dit..." />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F label={t('dashboard.screens.testimonials.rating')}>
                    <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={selectCls}>
                      {RATINGS.map(r => <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>)}
                    </select>
                  </F>
                  <F label="Statut">
                    <select value={form.isVerified ? 'verified' : 'pending'} onChange={(e) => setForm({ ...form, isVerified: e.target.value === 'verified' })} className={selectCls}>
                      <option value="pending">En attente</option>
                      <option value="verified">Vérifié</option>
                    </select>
                  </F>
                  <F label="Photo Étudiant (Image)">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                        {photoFile ? (
                          <img src={URL.createObjectURL(photoFile)} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : form.photo ? (
                          <img src={getThumbnailUrl(form.photo)} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">👤</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        {form.photo && !photoFile && (
                          <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 flex items-center justify-between">
                            <span className="truncate">Fichier: {form.photo.split('/').pop()}</span>
                            <span className="text-teal-400 font-bold ml-1 flex-shrink-0">Existant</span>
                          </div>
                        )}
                        <div className="relative group flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-teal-500/40 transition-colors">
                          <span className="text-xs text-slate-400 truncate max-w-[120px]">
                            {photoFile ? photoFile.name : "Sélectionner une photo"}
                          </span>
                          <div className="flex items-center gap-1">
                            {photoFile && (
                              <button 
                                type="button" 
                                onClick={() => setPhotoFile(null)} 
                                className="text-red-400 hover:text-red-300 text-[10px] px-1 bg-transparent border-none cursor-pointer"
                              >
                                Effacer
                              </button>
                            )}
                            <label className="bg-white/10 group-hover:bg-teal-500/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-white/5">
                              Parcourir
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </F>
                  <F label="Doc de Validation (PDF/Image)">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                        {validationFile ? (
                          <span className="text-lg">📄</span>
                        ) : form.internalValidationDoc ? (
                          <img src={getThumbnailUrl(form.internalValidationDoc)} alt="Aperçu Doc" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                        ) : (
                          <span className="text-xl">📄</span>
                        )}
                        <span className="hidden text-lg absolute inset-0 items-center justify-center bg-slate-900">📄</span>
                      </div>
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        {form.internalValidationDoc && !validationFile && (
                          <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 flex items-center justify-between">
                            <span className="truncate">Fichier: {form.internalValidationDoc.split('/').pop()}</span>
                            <span className="text-teal-400 font-bold ml-1 flex-shrink-0">Existant</span>
                          </div>
                        )}
                        <div className="relative group flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-teal-500/40 transition-colors">
                          <span className="text-xs text-slate-400 truncate max-w-[120px]">
                            {validationFile ? validationFile.name : "Sélectionner un doc"}
                          </span>
                          <div className="flex items-center gap-1">
                            {validationFile && (
                              <button 
                                type="button" 
                                onClick={() => setValidationFile(null)} 
                                className="text-red-400 hover:text-red-300 text-[10px] px-1 bg-transparent border-none cursor-pointer"
                              >
                                Effacer
                              </button>
                            )}
                            <label className="bg-white/10 group-hover:bg-teal-500/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-white/5">
                              Parcourir
                              <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={(e) => e.target.files?.[0] && setValidationFile(e.target.files[0])} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </F>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : modal.type === 'Create' ? t('dashboard.actions.create') : t('dashboard.actions.save')}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'View' && (
              <div className="space-y-6">
                {/* Visual Header / Avatar Card Preview */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900 p-6 border border-white/10 flex flex-col items-center text-center shadow-xl">
                  {/* Decorative background lights */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

                  {/* Elegant Profile Photo */}
                  <div className="relative mb-3 group cursor-pointer" onClick={() => modal.row.photo && setPreviewFile({
                    url: modal.row.photo,
                    name: `Photo - ${modal.row.authorName || modal.row.studentName}`,
                    type: 'image'
                  })}>
                    <div className="w-24 h-24 rounded-full bg-slate-950/80 overflow-hidden border-2 border-teal-500/40 p-1 flex items-center justify-center relative shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {modal.row.photo ? (
                        <img
                          src={getThumbnailUrl(modal.row.photo)}
                          alt="Photo Étudiant"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden absolute inset-0 items-center justify-center bg-slate-900 rounded-full">
                        <span className="text-3xl">👤</span>
                      </div>
                    </div>

                    {/* Verified Status Pill */}
                    <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md ${
                      (modal.row.isVerified || modal.row.verified)
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}>
                      {(modal.row.isVerified || modal.row.verified) ? 'Vérifié' : 'En attente'}
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="text-white font-extrabold text-lg flex items-center justify-center gap-1.5">
                      {modal.row.authorName || modal.row.studentName}
                      {(modal.row.isVerified || modal.row.verified) && <span className="text-emerald-400 text-sm">✓</span>}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {modal.row.programId || modal.row.program || '—'}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {'★'.repeat(modal.row.rating || 5).split('').map((s, idx) => (
                        <span key={idx} className="text-amber-400 text-sm">★</span>
                      ))}
                      {'☆'.repeat(5 - (modal.row.rating || 5)).split('').map((s, idx) => (
                        <span key={idx} className="text-slate-600 text-sm">☆</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quote Content */}
                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
                  {/* Decorative Big Quote Icon */}
                  <span className="absolute top-2 left-4 text-6xl text-white/5 font-serif pointer-events-none select-none">“</span>
                  <p className="text-slate-200 text-sm leading-relaxed italic relative z-10 font-medium">
                    "{modal.row.content || modal.row.story}"
                  </p>
                </div>

                {/* Attached Validation Document */}
                {modal.row.internalValidationDoc && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Document de Validation Officiel</span>
                    <button
                      onClick={() => setPreviewFile({
                        url: modal.row.internalValidationDoc,
                        name: `Validation - ${modal.row.authorName || modal.row.studentName}`,
                        type: modal.row.internalValidationDoc.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                      })}
                      className="w-full text-left group flex items-center gap-3 bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/30 rounded-xl p-3 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-teal-400 border border-teal-500/20 text-lg">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-xs truncate group-hover:text-teal-300 transition-colors">
                          {modal.row.internalValidationDoc.split('/').pop()}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cliquez pour visualiser le document justificatif
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer border-none transition-colors">{t('dashboard.actions.edit')}</button>
                </div>
              </div>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modal.row.authorName}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving') : t('dashboard.actions.delete')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

export default ManageTestimonials;
