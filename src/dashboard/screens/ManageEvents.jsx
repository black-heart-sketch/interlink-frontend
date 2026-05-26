import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { eventService } from '../../services/eventService';

const EMPTY_SPEAKER = {
  name: '', role: '', message: '', quote: '', extra_info: '', highlights: [''], imageFile: null,
  testimonials: [{ text: '', author: '', role: '' }]
};

const EMPTY_FORM = {
  title: '', date: '', endDate: '', location: '', attendees: 0, capacity: 0,
  description: '', status: 'Draft', type: 'event', typeColor: '#3b82f6',
  badge: '', badgeColor: '#10b981', imageFile: null, speakers: []
};

function ManageEvents() {
  const { t } = useTranslation();

  const columns = [
    { key: 'title', header: t('dashboard.screens.events.event_title', 'Événement'), render: (row) => <span className="font-bold text-white">{row.title}</span> },
    { key: 'date', header: t('dashboard.screens.events.date', 'Date'), render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { key: 'attendees', header: 'Participants', render: (row) => <span className="text-blue-400 font-bold">{row.attendees}+</span> },
    { key: 'description', header: 'Description', render: (row) => <span className="line-clamp-1 text-slate-400">{row.description || '—'}</span> },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  ];
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents();
      setRows(data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAction = (type, row) => {
    setModalState({ type, row });
    setStep(1);
    if (type === 'Create') setForm(EMPTY_FORM);
    if (type === 'Edit') setForm({ ...row, date: row.date?.split('T')[0] || '', endDate: row.endDate?.split('T')[0] || '', imageFile: null });
  };
  
  const closeModal = () => { setModalState(null); setForm(EMPTY_FORM); setStep(1); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (step === 1 && form.status !== 'Past') {
      // If it's not a Past event, we don't necessarily need speakers.
      // But we can go to step 2 anyway if they want.
      // We will handle save directly on Step 2.
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'imageFile') {
          if (form.imageFile) formData.append('image', form.imageFile);
        } else if (key === 'speakers') {
          const processedSpeakers = form.speakers.map(s => {
            if (s.imageFile) return { ...s, needsImageUpload: true, imageFile: undefined };
            return s;
          });
          formData.append('speakers', JSON.stringify(processedSpeakers));

          form.speakers.forEach((s) => {
             if (s.imageFile) formData.append('speakerImages', s.imageFile);
          });
        } else {
          formData.append(key, form[key]);
        }
      });
      
      if (modalState.type === 'Edit') {
        await eventService.updateEvent(modalState.row._id, formData);
        toast.success('Événement mis à jour !');
      } else {
        await eventService.createEvent(formData);
        toast.success('Événement sauvegardé !');
      }
      
      fetchEvents();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur sauvegarde');
      console.error('Server error:', err.response?.data);
    }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await eventService.deleteEvent(modalState.row._id);
      toast.success('Événement supprimé');
      fetchEvents();
      closeModal();
    } catch { toast.error('Erreur suppression'); }
    finally { setSaving(false); }
  };

  const addSpeaker = () => setForm({ ...form, speakers: [...form.speakers, { ...EMPTY_SPEAKER, highlights: [''], testimonials: [{ text: '', author: '', role: '' }] }] });
  const updateSpeaker = (idx, field, val) => {
    const updated = [...form.speakers];
    updated[idx][field] = val;
    setForm({ ...form, speakers: updated });
  };
  const removeSpeaker = (idx) => setForm({ ...form, speakers: form.speakers.filter((_, i) => i !== idx) });

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title={t('dashboard.screens.events.title', 'Archives des Événements')}
        rows={rows}
        columns={columns}
        searchPlaceholder={t('dashboard.actions.search', 'Rechercher un événement...')}
        filters={['Draft', 'Published', 'Past']}
        addAction={`+ ${t('dashboard.screens.events.add_event', 'Créer un Événement')}`}
        onAction={handleAction}
      />

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modalState.type === 'Create' || modalState.type === 'Edit') && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black text-xl">{modalState.type === 'Create' ? t('dashboard.screens.events.add_event') : t('dashboard.actions.edit')}</h3>
                  <div className="flex gap-2 text-sm font-bold">
                    <span className={step === 1 ? 'text-blue-400' : 'text-slate-500'}>1. Détails</span>
                    <span className="text-slate-600">/</span>
                    <span className={step === 2 ? 'text-blue-400' : 'text-slate-500'}>2. Intervenants & Highlights</span>
                  </div>
                </div>

                <form onSubmit={step === 2 ? handleSave : (e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                  {step === 1 && (
                    <>
                      <label className="flex flex-col gap-2">
                        <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.events.event_title')}</span>
                        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" placeholder="Titre de l'événement" />
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.events.date')}</span>
                          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Date de fin</span>
                          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.events.location')}</span>
                          <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" placeholder="Lieu" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Type</span>
                          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60">
                            {['event', 'conference', 'webinar', 'workshop', 'seminar', 'exam'].map(s => <option value={s} key={s}>{s}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Capacité</span>
                          <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Badge (Ex: Early Bird)</span>
                          <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" placeholder="Badge" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Couleur du Type</span>
                          <input type="color" value={form.typeColor} onChange={(e) => setForm({ ...form, typeColor: e.target.value })}
                            className="w-full h-12 rounded-xl cursor-pointer bg-white/5 border border-white/10" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Couleur du Badge</span>
                          <input type="color" value={form.badgeColor} onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                            className="w-full h-12 rounded-xl cursor-pointer bg-white/5 border border-white/10" />
                        </label>
                        <label className="flex flex-col gap-2 col-span-2">
                          <span className="text-slate-400 text-sm font-semibold">Image de l'événement</span>
                          <input type="file" onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20" accept="image/*" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Participants (Inscrits)</span>
                          <input type="number" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-slate-400 text-sm font-semibold">Statut</span>
                          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60">
                            {['Draft', 'Scheduled', 'Published', 'Live', 'Past'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                      </div>
                      <label className="flex flex-col gap-2">
                        <span className="text-slate-400 text-sm font-semibold">Description</span>
                        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 resize-none" placeholder="Description..." />
                      </label>
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer bg-transparent transition-colors">{t('dashboard.actions.cancel')}</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors">
                          Suivant →
                        </button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      {form.speakers.map((speaker, sIdx) => (
                        <div key={sIdx} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative">
                          <button type="button" onClick={() => removeSpeaker(sIdx)} className="absolute top-4 right-4 text-red-400 hover:text-red-300 text-sm font-bold bg-transparent border-none cursor-pointer">
                            Retirer Intervenant
                          </button>
                          <h4 className="text-white font-bold mb-4">Intervenant {sIdx + 1}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <input value={speaker.name} onChange={(e) => updateSpeaker(sIdx, 'name', e.target.value)} placeholder="Nom de l'intervenant" className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                            <input value={speaker.role} onChange={(e) => updateSpeaker(sIdx, 'role', e.target.value)} placeholder="Rôle (Ex: Attaché Culturel)" className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                            <div className="col-span-2">
                              <label className="flex flex-col gap-2">
                                <span className="text-slate-400 text-xs">Photo (optionnel)</span>
                                <input type="file" onChange={(e) => updateSpeaker(sIdx, 'imageFile', e.target.files[0])} className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-500/10 file:text-blue-400" accept="image/*" />
                              </label>
                            </div>
                            <textarea rows={2} value={speaker.message} onChange={(e) => updateSpeaker(sIdx, 'message', e.target.value)} placeholder="Message principal..." className="col-span-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 resize-none" />
                            <input value={speaker.quote} onChange={(e) => updateSpeaker(sIdx, 'quote', e.target.value)} placeholder="Citation marquante..." className="col-span-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                            <textarea rows={2} value={speaker.extra_info} onChange={(e) => updateSpeaker(sIdx, 'extra_info', e.target.value)} placeholder="Infos supplémentaires..." className="col-span-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 resize-none" />
                          </div>
                          
                          {/* Highlights */}
                          <div className="mt-4">
                            <span className="text-slate-400 text-sm font-semibold mb-2 block">Points Forts (Highlights)</span>
                            {speaker.highlights.map((hl, hlIdx) => (
                              <div key={hlIdx} className="flex gap-2 mb-2">
                                <input value={hl} onChange={(e) => {
                                  const newHl = [...speaker.highlights];
                                  newHl[hlIdx] = e.target.value;
                                  updateSpeaker(sIdx, 'highlights', newHl);
                                }} placeholder={`Point fort ${hlIdx + 1}`} className="flex-1 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500/60" />
                              </div>
                            ))}
                            <button type="button" onClick={() => updateSpeaker(sIdx, 'highlights', [...speaker.highlights, ''])} className="text-blue-400 text-xs font-bold bg-transparent border-none cursor-pointer">+ Ajouter Point Fort</button>
                          </div>

                          {/* Testimonials */}
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <span className="text-slate-400 text-sm font-semibold mb-2 block">Commentaires Étudiants</span>
                            {speaker.testimonials.map((test, tIdx) => (
                              <div key={tIdx} className="grid grid-cols-3 gap-2 mb-2">
                                <input value={test.text} onChange={(e) => {
                                  const newT = [...speaker.testimonials];
                                  newT[tIdx].text = e.target.value;
                                  updateSpeaker(sIdx, 'testimonials', newT);
                                }} placeholder="Commentaire..." className="col-span-3 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500/60" />
                                <input value={test.author} onChange={(e) => {
                                  const newT = [...speaker.testimonials];
                                  newT[tIdx].author = e.target.value;
                                  updateSpeaker(sIdx, 'testimonials', newT);
                                }} placeholder="Auteur (Ex: Félix K.)" className="col-span-1 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500/60" />
                                <input value={test.role} onChange={(e) => {
                                  const newT = [...speaker.testimonials];
                                  newT[tIdx].role = e.target.value;
                                  updateSpeaker(sIdx, 'testimonials', newT);
                                }} placeholder="Rôle (Ex: Lycéen)" className="col-span-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500/60" />
                              </div>
                            ))}
                            <button type="button" onClick={() => updateSpeaker(sIdx, 'testimonials', [...speaker.testimonials, { text: '', author: '', role: '' }])} className="text-blue-400 text-xs font-bold bg-transparent border-none cursor-pointer">+ Ajouter Commentaire</button>
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={addSpeaker} className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-blue-400 font-bold hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                        + Ajouter un Intervenant
                      </button>

                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer bg-transparent transition-colors">← Retour</button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                          {saving ? t('dashboard.actions.saving') : 'Sauvegarder l\'événement'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}

            {modalState.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modalState.row.title}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : t('dashboard.actions.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ManageEvents;
