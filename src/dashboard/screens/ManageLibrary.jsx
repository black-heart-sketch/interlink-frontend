import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import { libraryService } from '../../services/libraryService';
import { studyLanguageService } from '../../services/studyLanguageService';
import FilePreviewModal from '../../components/public/FilePreviewModal';

const ITEM_TYPES = ['document', 'course', 'video', 'audio'];
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const TYPE_ICONS = { document: '📄', course: '📚', video: '🎬', audio: '🎧' };
const TYPE_COLORS = {
  document: 'bg-blue-500/10 text-blue-400',
  course: 'bg-emerald-500/10 text-emerald-400',
  video: 'bg-purple-500/10 text-purple-400',
  audio: 'bg-amber-500/10 text-amber-400',
};

const EMPTY_FORM = { title: '', description: '', type: 'document', studyLanguage: '', isPrivate: false };

function F({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

const columns = [
  { key: 'title', header: 'Titre', render: (row) => (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{TYPE_ICONS[row.type] || '📄'}</span>
      <div>
        <div className="font-bold text-white text-sm">{row.title}</div>
        <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.description}</div>
      </div>
    </div>
  )},
  { key: 'type', header: 'Type', render: (row) => (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${TYPE_COLORS[row.type]}`}>{row.type}</span>
  )},
  { key: 'studyLanguage', header: 'Langue', render: (row) => (
    <span className="bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full text-xs font-black uppercase">
      {row.studyLanguage?.name || '—'}
    </span>
  )},
  { key: 'createdAt', header: 'Ajouté le', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
];

export default function ManageLibrary() {
  const [items, setItems] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterLang, setFilterLang] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  // Custom Dashboard Layout upgrades:
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (default) or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [itemsData, langsData] = await Promise.all([
        libraryService.getItems(filterLang ? { studyLanguage: filterLang } : {}),
        studyLanguageService.getLanguages(true)
      ]);
      setItems(itemsData);
      setLanguages(langsData);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterLang]);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setForm(row ? { title: row.title, description: row.description, type: row.type, studyLanguage: row.studyLanguage?._id || '', isPrivate: row.isPrivate || false } : EMPTY_FORM);
    setFile(null); setThumb(null);
  };
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setFile(null); setThumb(null); };

  const handleAction = (type, row) => {
    if (type === 'Create') return openModal('Create');
    openModal(type, row);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.studyLanguage) { toast.error('Veuillez sélectionner une langue'); return; }
    if (modal.type === 'Create' && !file) { toast.error('Un fichier est requis'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('file', file);
      if (thumb) fd.append('thumbnail', thumb);

      if (modal.type === 'Edit') {
        await libraryService.updateItem(modal.row._id, fd);
        toast.success('Élément mis à jour !');
      } else {
        await libraryService.createItem(fd);
        toast.success('Élément ajouté à la bibliothèque !');
      }
      fetchData(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await libraryService.deleteItem(modal.row._id);
      toast.success('Élément supprimé');
      fetchData(); closeModal();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";

  if (loading) return <Loader />;

  return (
    <>
      {/* Search & Layout Toggle Controller Panel */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500/60 transition-colors text-sm w-64"
          />
          <div className="flex border border-white/10 rounded-xl overflow-hidden bg-[#0f172a]">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
            >
              🗂️ Cartes
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer border-none ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
            >
              📋 Tableau
            </button>
          </div>
        </div>
        <button
          onClick={() => handleAction('Create')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all border-none cursor-pointer flex items-center gap-2 text-sm"
        >
          <span>+</span> Ajouter à la bibliothèque
        </button>
      </div>

      {/* Language filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button onClick={() => setFilterLang('')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${!filterLang ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
          Tous
        </button>
        {languages.map(lang => (
          <button key={lang._id} onClick={() => setFilterLang(lang._id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${filterLang === lang._id ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {lang.name}
          </button>
        ))}
      </div>

      {/* Core Body View */}
      {viewMode === 'cards' ? (
        filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-400 font-bold text-lg">Aucune ressource trouvée</p>
            <p className="text-slate-500 text-xs mt-1">La bibliothèque est vide ou ne contient aucun élément correspondant à vos filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredItems.map(item => {
              const hasThumb = !!item.thumbnail;
              return (
                <div
                  key={item._id}
                  className="bg-[#0f172a]/60 border border-white/10 hover:border-blue-500/30 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col group"
                >
                  {/* Card Thumbnail Area with Hover Scale */}
                  <div className="h-44 relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-b border-white/5">
                    {hasThumb ? (
                      <img
                        src={`${API_URL}${item.thumbnail}`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <span className="text-5xl">{TYPE_ICONS[item.type] || '📄'}</span>
                      </div>
                    )}
                    {/* Language & Type Badges */}
                    <span className="absolute top-3 left-3 bg-teal-600/90 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                      {item.studyLanguage?.name || '—'}
                    </span>
                    <span className="absolute top-3 right-3 bg-slate-900/80 text-slate-300 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      {item.type}
                    </span>
                    {item.isPrivate && (
                      <span className="absolute bottom-3 right-3 bg-red-600/90 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        🔒 Privé
                      </span>
                    )}
                  </div>

                  {/* Card Details & Action Panel */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-white font-bold text-base mb-1.5 line-clamp-1">{item.title}</h4>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed flex-grow">
                      {item.description || 'Aucune description fournie.'}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                      <span className="text-[10px] text-slate-500 font-medium">
                        📅 {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAction('View', item)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold cursor-pointer"
                          title="Détails"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleAction('Edit', item)}
                          className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-600 transition-colors text-xs font-bold cursor-pointer"
                          title="Modifier"
                        >
                          ✏️
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
          title="Bibliothèque"
          rows={filteredItems}
          columns={columns}
          searchPlaceholder="Rechercher un document..."
          addAction="+ Ajouter un élément"
          onAction={handleAction}
        />
      )}

      {/* MODAL SYSTEM */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm py-8 overflow-y-auto" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl mx-4 my-4" onMouseDown={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Edit' ? 'Modifier l\'élément' : 'Ajouter à la bibliothèque'}</h3>
                  <p className="text-slate-500 text-sm mt-1">Cet élément sera visible par les étudiants de la langue sélectionnée.</p>
                </div>
                <F label="Titre"><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Introduction à l'allemand" /></F>
                <F label="Description"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Brève description..." /></F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Type">
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={selectCls}>
                      {ITEM_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </F>
                  <F label="Langue d'étude">
                    <select required value={form.studyLanguage} onChange={e => setForm({ ...form, studyLanguage: e.target.value })} className={selectCls}>
                      <option value="">Choisir...</option>
                      {languages.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                  </F>
                </div>
                <F label="Document Sécurisé / Privé">
                  <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={form.isPrivate} 
                      onChange={e => setForm({ ...form, isPrivate: e.target.checked })} 
                      className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                    />
                    <span className="text-white text-sm">Empêcher le téléchargement et activer la sécurité IA (Caméra)</span>
                  </label>
                </F>
                <F label={`Fichier ${modal.type === 'Edit' ? '(laisser vide pour conserver)' : '*'}`}>
                  <input type="file" onChange={e => setFile(e.target.files[0])} className={`${inputCls} file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white file:cursor-pointer`} />
                </F>
                <F label="Miniature (optionnel — généré automatiquement si laissé vide)">
                  <input type="file" accept="image/*" onChange={e => setThumb(e.target.files[0])} className={`${inputCls} file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-slate-600 file:text-white file:cursor-pointer`} />
                </F>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">Supprimer l'élément</h3>
                <p className="text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer <strong className="text-white">{modal.row.title}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">Annuler</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </>
            )}

            {modal.type === 'View' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{modal.row.title}</h3>
                <div className="space-y-3 mb-6">
                  {modal.row.thumbnail && (
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center mb-4">
                      <img src={`${API_URL}${modal.row.thumbnail}`} alt={modal.row.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    {[['Type', modal.row.type], ['Langue', modal.row.studyLanguage?.name || '—'], ['Ajouté le', new Date(modal.row.createdAt).toLocaleDateString('fr-FR')]].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-500 text-sm">{label}</span>
                        <span className="text-white font-bold text-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                  {modal.row.description && <p className="text-slate-400 text-sm">{modal.row.description}</p>}
                  {modal.row.fileUrl && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewFile({
                          url: modal.row.fileUrl,
                          name: modal.row.title,
                          type: modal.row.type
                        })}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-3 text-white font-bold text-sm transition-colors border-none cursor-pointer"
                      >
                        👁️ Aperçu interactif
                      </button>
                      <a href={`${API_URL}${modal.row.fileUrl}`} download
                        className="flex items-center justify-center p-3 bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-colors no-underline">
                        📥
                      </a>
                    </div>
                  )}
                </div>
                <button onClick={closeModal} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors">Fermer</button>
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
