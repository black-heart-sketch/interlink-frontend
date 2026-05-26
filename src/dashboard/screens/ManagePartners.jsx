import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { partnerService } from '../../services/partnerService';
import FilePreviewModal, { getThumbnailUrl } from '../../components/public/FilePreviewModal';

const TYPES = ['school', 'employer', 'nursing_home', 'training_center', 'agency', 'institution', 'ngo', 'legal'];
const STATUSES = ['active', 'inactive', 'pending'];
const EMPTY = { name: '', country: '', city: '', type: 'school', website: '', email: '', contactPerson: '', status: 'active', publicVisible: true, logo: '', agreementFiles: [] };

function F({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function ManagePartners() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Upload states
  const [logoFile, setLogoFile] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetch = async () => {
    try { 
      setRows(await partnerService.getPartners()); 
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
      name: row.name, 
      country: row.country || '', 
      city: row.city || '', 
      type: row.type || 'school', 
      website: row.website || '', 
      email: row.email || '', 
      contactPerson: row.contactPerson || '', 
      status: row.status || 'active', 
      publicVisible: row.publicVisible ?? true,
      logo: row.logo || '',
      agreementFiles: row.agreementFiles || []
    } : EMPTY);
    setLogoFile(null);
    setAgreementFile(null);
  };

  const closeModal = () => { 
    setModal(null); 
    setForm(EMPTY); 
    setLogoFile(null); 
    setAgreementFile(null); 
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'logo' || k === 'agreementFiles') return;
        fd.append(k, v);
      });

      if (logoFile) {
        fd.append('logo', logoFile);
      } else if (form.logo) {
        fd.append('logo', form.logo);
      }

      if (agreementFile) {
        fd.append('agreementFile', agreementFile);
      } else if (form.agreementFiles && form.agreementFiles.length > 0) {
        fd.append('agreementFiles', JSON.stringify(form.agreementFiles));
      }

      if (modal.type === 'Create') {
        await partnerService.createPartner(fd);
      } else {
        await partnerService.updatePartner(modal.row._id, fd);
      }
      toast.success(modal.type === 'Create' ? 'Partenaire créé !' : 'Partenaire mis à jour !');
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
      await partnerService.deletePartner(modal.row._id); 
      toast.success('Partenaire supprimé'); 
      fetch(); 
      closeModal(); 
    } catch { 
      toast.error('Erreur'); 
    } finally { 
      setSaving(false); 
    }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/60 transition-colors w-full";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/60 transition-colors w-full";

  // Search and Filter calculation
  const filteredPartners = rows.filter(item => {
    const name = (item.name || '').toLowerCase();
    const city = (item.city || '').toLowerCase();
    const country = (item.country || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || city.includes(query) || country.includes(query) || type.includes(query);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // KPI calculations
  const totalCount = rows.length;
  const activeCount = rows.filter(r => r.status === 'active').length;
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const inactiveCount = rows.filter(r => r.status === 'inactive').length;

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6 pb-12">
        {/* Title and Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">{t('dashboard.screens.partners.title', 'Réseau de Partenaires')}</h1>
            <p className="text-slate-400 text-xs mt-1">Gérez les universités partenaires, employeurs et structures partenaires.</p>
          </div>
          <button 
            onClick={() => openModal('Create')}
            className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs tracking-wider uppercase transition-colors border-none cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-600/15 active:scale-95"
          >
            <span>+</span> {t('dashboard.screens.partners.add_partner', 'Ajouter un Partenaire')}
          </button>
        </div>

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-amber-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total Partenaires</span>
              <h3 className="text-white text-3xl font-black mt-1">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950/40 flex items-center justify-center text-lg">🏢</div>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Actifs</span>
              <h3 className="text-emerald-400 text-3xl font-black mt-1">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg text-emerald-400 border border-emerald-500/20">✓</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-amber-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">En attente</span>
              <h3 className="text-amber-400 text-3xl font-black mt-1">{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg text-amber-400 border border-amber-500/20">⌛</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-red-500/20 transition-colors">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Inactifs</span>
              <h3 className="text-red-400 text-3xl font-black mt-1">{inactiveCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-lg text-red-400 border border-red-500/20">✕</div>
          </div>
        </div>

        {/* Real-time Search & Filter Pills */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-md">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ville, pays ou type..."
              className="bg-[#0f172a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-amber-500/60 transition-colors w-full text-xs font-medium"
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
              { id: 'active', label: 'Actifs', count: activeCount },
              { id: 'pending', label: 'En attente', count: pendingCount },
              { id: 'inactive', label: 'Inactifs', count: inactiveCount }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === pill.id 
                    ? 'bg-amber-600 text-white border-amber-500/50 shadow-md' 
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

        {/* Glassmorphic Cards Grid */}
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((item) => {
              return (
                <div 
                  key={item._id}
                  className="bg-gradient-to-br from-slate-900 via-[#131e31] to-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg group hover:border-amber-500/30 transition-all hover:scale-[1.01]"
                >
                  {/* Glowing background ring on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div>
                    {/* Header: Logo, Name & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950/80 overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center relative shadow-inner">
                          {item.logo ? (
                            <img
                              src={getThumbnailUrl(item.logo)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-amber-400 bg-slate-900" style={{ display: item.logo ? 'none' : 'flex' }}>
                            {item.name ? item.name.charAt(0).toUpperCase() : '🏢'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-extrabold text-sm truncate max-w-[140px]">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5 max-w-[140px] truncate">
                            📍 {item.city ? `${item.city}, ` : ''}{item.country || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Status pill badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : item.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {item.status === 'active' ? 'Actif' : item.status === 'pending' ? 'En attente' : 'Inactif'}
                      </span>
                    </div>

                    {/* Partner Type Badge & Placed Students Info */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.type?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                        <span>👨‍🎓</span>
                        <span>{item.studentsPlaced || 0} Placements</span>
                      </div>
                    </div>

                    {/* Metadata Detail Row */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2 mb-4 text-xs">
                      {item.contactPerson && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contact:</span>
                          <span className="text-white font-medium truncate max-w-[130px]">{item.contactPerson}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="text-white font-medium truncate max-w-[130px]">{item.email}</span>
                        </div>
                      )}
                      {item.website && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Site Web:</span>
                          <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium truncate max-w-[130px] hover:underline">
                            {item.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer row */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    {/* Agreement file indicator badge */}
                    {item.agreementFiles && item.agreementFiles.length > 0 ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                        <span>📄 Accord</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Aucun accord</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openModal('View', item)}
                        title="Détails"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 flex items-center justify-center cursor-pointer transition-colors"
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
              🏢
            </div>
            <h3 className="text-white font-extrabold text-lg">Aucun partenaire trouvé</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
              {searchQuery 
                ? "Aucun résultat ne correspond à votre recherche. Veuillez modifier vos filtres ou réinitialiser."
                : "Commencez par ajouter le tout premier partenaire de votre réseau en cliquant sur le bouton d'ajout."}
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

      {/* Modal overlays */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-2xl shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Create' ? t('dashboard.screens.partners.add_partner') : t('dashboard.actions.edit')}</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {modal.type === 'Edit' ? `Modification de "${modal.row.name}"` : 'Ajouter un partenaire au réseau.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <F label="Nom du partenaire">
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="ex: Université de Stuttgart" />
                    </F>
                  </div>
                  
                  <F label="Type">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectCls}>
                      {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </F>
                  
                  <F label="Statut">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </F>

                  <F label="Pays">
                    <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} placeholder="Allemagne" />
                  </F>

                  <F label="Ville">
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="Stuttgart" />
                  </F>

                  <F label="Site Web">
                    <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} placeholder="https://..." />
                  </F>

                  <F label="Email">
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="contact@partenaire.com" />
                  </F>

                  <F label="Personne de contact">
                    <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={inputCls} placeholder="Nom du responsable" />
                  </F>

                  <F label="Nombre d'étudiants placés">
                    <input type="number" min="0" value={form.studentsPlaced || 0} onChange={(e) => setForm({ ...form, studentsPlaced: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                  </F>

                  {/* Direct Image Logo Uploader Field */}
                  <div className="col-span-1">
                    <F label="Logo du Partenaire">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                          {logoFile ? (
                            <img src={URL.createObjectURL(logoFile)} alt="Aperçu" className="w-full h-full object-cover" />
                          ) : form.logo ? (
                            <img src={getThumbnailUrl(form.logo)} alt="Aperçu Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🏢</span>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          {form.logo && !logoFile && (
                            <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 flex items-center justify-between">
                              <span className="truncate">Fichier: {form.logo.split('/').pop()}</span>
                              <span className="text-amber-400 font-bold ml-1 flex-shrink-0">Existant</span>
                            </div>
                          )}
                          <div className="relative group flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-amber-500/40 transition-colors">
                            <span className="text-xs text-slate-400 truncate max-w-[110px]">
                              {logoFile ? logoFile.name : "Sélectionner logo"}
                            </span>
                            <div className="flex items-center gap-1">
                              {logoFile && (
                                <button 
                                  type="button" 
                                  onClick={() => setLogoFile(null)} 
                                  className="text-red-400 hover:text-red-300 text-[10px] px-1 bg-transparent border-none cursor-pointer"
                                >
                                  Effacer
                                </button>
                              )}
                              <label className="bg-white/10 group-hover:bg-amber-500/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-white/5">
                                Parcourir
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </F>
                  </div>

                  {/* Direct Agreement File Uploader Field */}
                  <div className="col-span-1">
                    <F label="Accord de Placement (PDF/Doc)">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                          {agreementFile ? (
                            <span className="text-lg">📄</span>
                          ) : form.agreementFiles && form.agreementFiles.length > 0 ? (
                            <img src={getThumbnailUrl(form.agreementFiles[0].url)} alt="Aperçu Accord" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                          ) : (
                            <span className="text-xl">📄</span>
                          )}
                          <span className="hidden text-lg absolute inset-0 items-center justify-center bg-slate-900">📄</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          {form.agreementFiles && form.agreementFiles.length > 0 && !agreementFile && (
                            <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 flex items-center justify-between">
                              <span className="truncate">Fichier: {form.agreementFiles[0].name || form.agreementFiles[0].url.split('/').pop()}</span>
                              <span className="text-emerald-400 font-bold ml-1 flex-shrink-0">Existant</span>
                            </div>
                          )}
                          <div className="relative group flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-amber-500/40 transition-colors">
                            <span className="text-xs text-slate-400 truncate max-w-[110px]">
                              {agreementFile ? agreementFile.name : "Sélectionner accord"}
                            </span>
                            <div className="flex items-center gap-1">
                              {agreementFile && (
                                <button 
                                  type="button" 
                                  onClick={() => setAgreementFile(null)} 
                                  className="text-red-400 hover:text-red-300 text-[10px] px-1 bg-transparent border-none cursor-pointer"
                                >
                                  Effacer
                                </button>
                              )}
                              <label className="bg-white/10 group-hover:bg-amber-500/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-white/5">
                                Parcourir
                                <input 
                                  type="file" 
                                  accept="image/*,application/pdf" 
                                  onChange={(e) => e.target.files?.[0] && setAgreementFile(e.target.files[0])} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </F>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving', 'Sauvegarde...') : t('dashboard.actions.save', 'Enregistrer')}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'View' && (
              <div className="space-y-6">
                {/* Profile Header Visual Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900 p-6 border border-white/10 flex flex-col items-center text-center shadow-xl">
                  {/* Glowing blur spotlights */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />

                  {/* Partner Logo */}
                  <div className="relative mb-3 group cursor-pointer" onClick={() => modal.row.logo && setPreviewFile({
                    url: modal.row.logo,
                    name: `Logo - ${modal.row.name}`,
                    type: 'image'
                  })}>
                    <div className="w-24 h-24 rounded-2xl bg-slate-950/80 overflow-hidden border-2 border-amber-500/40 p-1 flex items-center justify-center relative shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {modal.row.logo ? (
                        <img
                          src={getThumbnailUrl(modal.row.logo)}
                          alt="Logo Partenaire"
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden absolute inset-0 items-center justify-center bg-slate-900 rounded-xl">
                        <span className="text-3xl">🏢</span>
                      </div>
                    </div>

                    {/* Status badge pill */}
                    <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md ${
                      modal.row.status === 'active' 
                        ? 'bg-emerald-500 text-slate-950'
                        : modal.row.status === 'pending'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-red-500 text-white'
                    }`}>
                      {modal.row.status === 'active' ? 'Actif' : modal.row.status === 'pending' ? 'En attente' : 'Inactif'}
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="text-white font-extrabold text-lg flex items-center justify-center gap-1.5">
                      {modal.row.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      📍 {modal.row.city ? `${modal.row.city}, ` : ''}{modal.row.country || '—'}
                    </p>
                    <span className="mt-2 inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {modal.row.type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Specific details info list */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                  {[
                    ['Personne de Contact', modal.row.contactPerson || '—'],
                    ['Adresse Email', modal.row.email || '—'],
                    ['Site Officiel', modal.row.website || '—'],
                    ['Étudiants Placées', modal.row.studentsPlaced || 0]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
                      {label === 'Site Officiel' && val !== '—' ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm font-bold truncate block">
                          {val}
                        </a>
                      ) : (
                        <strong className="text-white text-sm">{val}</strong>
                      )}
                    </div>
                  ))}
                </div>

                {/* File previews */}
                {modal.row.agreementFiles && modal.row.agreementFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Accord de Placement Actif</span>
                    <button
                      onClick={() => setPreviewFile({
                        url: modal.row.agreementFiles[0].url,
                        name: modal.row.agreementFiles[0].name || 'Accord de Placement',
                        type: modal.row.agreementFiles[0].url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                      })}
                      className="w-full text-left group flex items-center gap-3 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl p-3 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-amber-400 border border-amber-500/20 text-lg">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-xs truncate group-hover:text-amber-300 transition-colors">
                          {modal.row.agreementFiles[0].name || 'Accord de Placement'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cliquez pour visualiser le document justificatif
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.close', 'Fermer')}</button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer border-none transition-colors">{t('dashboard.actions.edit', 'Modifier')}</button>
                </div>
              </div>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete', 'Supprimer')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modal.row.name}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving', 'Suppression...') : t('dashboard.actions.delete', 'Supprimer')}</button>
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

export default ManagePartners;
