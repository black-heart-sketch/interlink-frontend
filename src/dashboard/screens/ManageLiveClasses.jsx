import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { liveClassService } from '../../services/liveClassService';
import { userService } from '../../services/userService';

const TYPES = [
  { value: 'course', labelKey: 'dashboard.live_classes.types.course' },
  { value: 'conference', labelKey: 'dashboard.live_classes.types.conference' },
  { value: 'webinar', labelKey: 'dashboard.live_classes.types.webinar' },
  { value: 'mentorship', labelKey: 'dashboard.live_classes.types.mentorship' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'course',
  audience: 'study_language',
  studyLanguage: '',
  teacher: '',
  participants: [],
  scheduledStartTime: '',
  scheduledEndTime: '',
};

const inputCls = 'h-12 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60';
const selectCls = 'h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60';

function toDateTimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function splitDateTime(value) {
  return {
    date: value ? value.slice(0, 10) : '',
    time: value ? value.slice(11, 16) : '',
  };
}

function mergeDateTime(currentValue, part, value) {
  const current = splitDateTime(currentValue);
  const next = { ...current, [part]: value };
  if (!next.date && !next.time) return '';
  return `${next.date || ''}T${next.time || ''}`;
}

function canJoin(item) {
  const now = Date.now();
  const start = new Date(item.scheduledStartTime).getTime() - 15 * 60 * 1000;
  const end = new Date(item.scheduledEndTime).getTime();
  return now >= start && now <= end;
}

export default function ManageLiveClasses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roles = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]').map((role) => String(role).toLowerCase());
    } catch {
      return [];
    }
  }, []);
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [items, langs, teacherRows] = await Promise.all([
        liveClassService.getLiveClasses(),
        Promise.resolve([
          { _id: 'en', name: 'English' },
          { _id: 'fr', name: 'Français' },
          { _id: 'de', name: 'Deutsch' },
          { _id: 'it', name: 'Italiano' }
        ]),
        isAdmin ? userService.getUsers({ role: 'teacher,supervisor,student' }).catch(() => []) : Promise.resolve([]),
      ]);
      setClasses(Array.isArray(items) ? items : []);
      setLanguages(langs);
      setTeachers(teacherRows);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.live_classes.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error(t('dashboard.live_classes.title_required'));
    if (form.audience === 'study_language' && !form.studyLanguage) return toast.error(t('dashboard.live_classes.study_language_required'));
    if (form.audience === 'internship_pair' && form.participants.length === 0) return toast.error(t('dashboard.live_classes.participants_required'));
    if (!form.scheduledStartTime || !form.scheduledEndTime) return toast.error(t('dashboard.live_classes.time_required'));

    setSaving(true);
    try {
      const payload = {
        ...form,
        studyLanguage: form.audience === 'study_language' ? form.studyLanguage : undefined,
        teacher: form.teacher || undefined,
        participants: form.audience === 'internship_pair' ? form.participants : [],
        scheduledStartTime: new Date(form.scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(form.scheduledEndTime).toISOString(),
      };
      if (editing) await liveClassService.updateLiveClass(editing._id, payload);
      else await liveClassService.createLiveClass(payload);
      toast.success(editing ? t('dashboard.live_classes.updated') : t('dashboard.live_classes.scheduled'));
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.live_classes.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'course',
      audience: item.audience || 'study_language',
      studyLanguage: item.studyLanguage?._id || item.studyLanguage || '',
      teacher: item.teacher?._id || item.teacher || '',
      participants: (item.participants || []).map((participant) => participant._id || participant),
      scheduledStartTime: toDateTimeLocal(item.scheduledStartTime),
      scheduledEndTime: toDateTimeLocal(item.scheduledEndTime),
    });
  };

  const remove = async (item) => {
    if (!window.confirm(t('dashboard.live_classes.confirm_delete', { title: item.title }))) return;
    try {
      await liveClassService.deleteLiveClass(item._id);
      toast.success(t('dashboard.live_classes.deleted'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.live_classes.delete_failed'));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-black text-white">{t('dashboard.live_classes.title')}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t('dashboard.live_classes.subtitle')}</p>
          </div>
          <button type="button" onClick={fetchData} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">
            {t('dashboard.live_classes.refresh')}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">{t('dashboard.live_classes.loading')}</div>
          ) : classes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">{t('dashboard.live_classes.empty')}</div>
          ) : classes.map((item) => {
            const start = new Date(item.scheduledStartTime);
            const end = new Date(item.scheduledEndTime);
            const joinable = canJoin(item) || isAdmin;
            return (
              <article key={item._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-blue-200">{t(TYPES.find(type => type.value === item.type)?.labelKey || 'dashboard.live_classes.types.course')}</span>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-emerald-200">{item.audience === 'all_users' ? t('dashboard.live_classes.audience_all_users') : item.studyLanguage?.name || t('dashboard.live_classes.language')}</span>
                    </div>
                    <h4 className="mt-3 text-lg font-black text-white">{item.title}</h4>
                    {item.description && <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                      <span><i className="fa-solid fa-calendar mr-2 text-blue-300" />{start.toLocaleDateString()}</span>
                      <span><i className="fa-solid fa-clock mr-2 text-blue-300" />{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.teacher && <span><i className="fa-solid fa-chalkboard-user mr-2 text-blue-300" />{`${item.teacher.firstName || ''} ${item.teacher.lastName || ''}`.trim() || item.teacher.email}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/live/${item.meetingId}`)}
                      disabled={!joinable}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {joinable ? t('dashboard.live_classes.join') : t('dashboard.live_classes.not_time_yet')}
                    </button>
                    {isAdmin && (
                      <>
                        <button type="button" onClick={() => startEdit(item)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">{t('dashboard.actions.edit')}</button>
                        <button type="button" onClick={() => remove(item)} className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-200 hover:bg-red-500/20">{t('dashboard.actions.delete')}</button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {isAdmin && (
        <aside className="h-fit rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <h3 className="text-xl font-black text-white">{editing ? t('dashboard.live_classes.edit_session') : t('dashboard.live_classes.program_session')}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t('dashboard.live_classes.admin_only')}</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.form_title')}</span>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="German B1 live course" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.description')}</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} h-auto py-3`} placeholder="Session agenda..." />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.type')}</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectCls}>
                  {TYPES.map(type => <option key={type.value} value={type.value}>{t(type.labelKey)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.audience')}</span>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={selectCls}>
                  <option value="study_language">{t('dashboard.live_classes.audience_study_language')}</option>
                  <option value="all_users">{t('dashboard.live_classes.audience_all_users')}</option>
                  <option value="internship_pair">{t('dashboard.live_classes.audience_internship_pair')}</option>
                </select>
              </label>
            </div>
            {form.audience === 'study_language' && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.audience_study_language')}</span>
                <select required value={form.studyLanguage} onChange={(e) => setForm({ ...form, studyLanguage: e.target.value })} className={selectCls}>
                  <option value="">{t('dashboard.live_classes.select_language')}</option>
                  {languages.map(lang => <option key={lang._id} value={lang._id}>{lang.name}</option>)}
                </select>
              </label>
            )}
            {form.type === 'course' && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.teacher')}</span>
                <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className={selectCls}>
                  <option value="">{t('dashboard.live_classes.assign_later')}</option>
                  {teachers.filter((teacher) => ['teacher', 'supervisor'].includes(teacher.role)).map(teacher => <option key={teacher._id} value={teacher._id}>{`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email}</option>)}
                </select>
              </label>
            )}
            {form.audience === 'internship_pair' && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">{t('dashboard.live_classes.participants')}</span>
                <select
                  multiple
                  required
                  value={form.participants}
                  onChange={(e) => setForm({ ...form, participants: Array.from(e.target.selectedOptions).map((option) => option.value) })}
                  className={`${selectCls} h-32 py-3`}
                >
                  {teachers.map(user => <option key={user._id} value={user._id}>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email} · {user.role}</option>)}
                </select>
                <p className="mt-2 text-xs font-semibold text-slate-500">{t('dashboard.live_classes.multi_select_hint')}</p>
              </label>
            )}
            <div className="grid gap-4">
              {[
                ['scheduledStartTime', t('dashboard.live_classes.start')],
                ['scheduledEndTime', t('dashboard.live_classes.end')],
              ].map(([field, label]) => {
                const parts = splitDateTime(form[field]);
                return (
                  <div key={field}>
                    <span className="mb-2 block text-sm font-bold text-slate-400">{label}</span>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                      <input
                        type="date"
                        required
                        value={parts.date}
                        onChange={(e) => setForm({ ...form, [field]: mergeDateTime(form[field], 'date', e.target.value) })}
                        className={inputCls}
                      />
                      <input
                        type="time"
                        required
                        value={parts.time}
                        onChange={(e) => setForm({ ...form, [field]: mergeDateTime(form[field], 'time', e.target.value) })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              {editing && <button type="button" onClick={resetForm} className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-black text-slate-300 hover:bg-white/10">{t('dashboard.actions.cancel')}</button>}
              <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-60">
                {saving ? t('dashboard.actions.saving') : editing ? t('dashboard.live_classes.save_changes') : t('dashboard.live_classes.schedule')}
              </button>
            </div>
          </form>
        </aside>
      )}
    </div>
  );
}
