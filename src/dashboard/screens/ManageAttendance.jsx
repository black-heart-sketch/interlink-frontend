import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import { attendanceService } from '../../services/attendanceService';
import Loader from '../components/Loader';

const normalizeRole = (role) => String(role || '').toLowerCase();
const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const statusCls = {
  present: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  late: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  absent: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  excused: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
};

export default function ManageAttendance({ dashboardRoles }) {
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const roles = useMemo(() => {
    const source = Array.isArray(dashboardRoles) && dashboardRoles.length ? dashboardRoles : reduxRoles;
    return (source || []).map(normalizeRole);
  }, [dashboardRoles, reduxRoles]);
  const isStudent = roles.includes('student') || (!roles.includes('supervisor') && !roles.includes('admin') && !roles.includes('superadmin') && !roles.includes('manager'));
  const isPrivileged = !isStudent;

  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', internId: 'all' });
  const [markForm, setMarkForm] = useState({ internId: '', date: dateKey(new Date()), status: 'present', notes: '' });

  const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/60';

  const fetchRows = async () => {
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.internId !== 'all') params.internId = filters.internId;
      setRows(await attendanceService.getAttendance(params));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!isPrivileged) return;
    try {
      setStudents((await axiosInstance.get('/users', { params: { role: 'student' } })).data || []);
    } catch (error) {
      console.warn('Unable to load students.', error);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchStudents();
  }, [filters.status, filters.internId, isPrivileged]);

  const todayRow = useMemo(() => rows.find((row) => dateKey(row.date) === dateKey(new Date())), [rows]);
  const metrics = useMemo(() => {
    const total = rows.length;
    const present = rows.filter((row) => ['present', 'late', 'excused'].includes(row.status)).length;
    return {
      total,
      present,
      late: rows.filter((row) => row.status === 'late').length,
      absent: rows.filter((row) => row.status === 'absent').length,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [rows]);

  const checkIn = async () => {
    setSaving(true);
    try {
      await attendanceService.checkIn();
      toast.success('Checked in successfully.');
      await fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed.');
    } finally {
      setSaving(false);
    }
  };

  const checkOut = async () => {
    setSaving(true);
    try {
      await attendanceService.checkOut();
      toast.success('Checked out successfully.');
      await fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-out failed.');
    } finally {
      setSaving(false);
    }
  };

  const markAttendance = async (event) => {
    event.preventDefault();
    if (!markForm.internId) return toast.warning('Select a student.');
    setSaving(true);
    try {
      await attendanceService.markAttendance(markForm);
      toast.success('Attendance updated.');
      setMarkForm({ internId: '', date: dateKey(new Date()), status: 'present', notes: '' });
      await fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark attendance.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Attendance Rate', `${metrics.rate}%`, 'fa-chart-line', 'text-emerald-300'],
          ['Recorded Days', metrics.total, 'fa-calendar-days', 'text-blue-300'],
          ['Present/Excused', metrics.present, 'fa-circle-check', 'text-emerald-300'],
          ['Late', metrics.late, 'fa-clock', 'text-amber-300'],
          ['Absent', metrics.absent, 'fa-circle-xmark', 'text-rose-300'],
        ].map(([label, value, icon, color]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
              <i className={`fa-solid ${icon} ${color}`} />
            </div>
            <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
          </article>
        ))}
      </div>

      {isStudent && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-black text-white">Today’s Attendance</h3>
              <p className="mt-1 text-sm text-slate-400">Check in when you start and check out when your internship day ends.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button disabled={saving || Boolean(todayRow?.checkInAt)} onClick={checkIn} className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                Check In
              </button>
              <button disabled={saving || !todayRow?.checkInAt || Boolean(todayRow?.checkOutAt)} onClick={checkOut} className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                Check Out
              </button>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
            Status: <span className="font-black capitalize text-white">{todayRow?.status || 'Not checked in'}</span>
            {todayRow?.checkInAt && <span className="ml-4">In: {new Date(todayRow.checkInAt).toLocaleTimeString()}</span>}
            {todayRow?.checkOutAt && <span className="ml-4">Out: {new Date(todayRow.checkOutAt).toLocaleTimeString()}</span>}
          </div>
        </section>
      )}

      {isPrivileged && (
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <h3 className="text-xl font-black text-white">Attendance Monitoring</h3>
            <p className="mt-1 text-sm text-slate-400">Filter history and manually mark exceptions such as absent or excused days.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select className={inputCls} value={filters.internId} onChange={(e) => setFilters({ ...filters, internId: e.target.value })}>
                <option value="all">All students</option>
                {students.map((student) => <option key={student._id} value={student._id}>{fullName(student)}</option>)}
              </select>
              <select className={inputCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="all">All statuses</option>
                {['present', 'late', 'absent', 'excused'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <form onSubmit={markAttendance} className="grid gap-3">
            <select className={inputCls} value={markForm.internId} onChange={(e) => setMarkForm({ ...markForm, internId: e.target.value })}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student._id} value={student._id}>{fullName(student)}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputCls} type="date" value={markForm.date} onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })} />
              <select className={inputCls} value={markForm.status} onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}>
                {['present', 'late', 'absent', 'excused'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <input className={inputCls} value={markForm.notes} onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })} placeholder="Optional note" />
            <button disabled={saving} className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Mark Attendance</button>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
          <span>Student</span><span>Date</span><span>Times</span><span>Status</span>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No attendance records yet.</div>
        ) : rows.map((row) => (
          <div key={row._id} className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-3 border-b border-white/5 px-5 py-4 text-sm text-slate-300 last:border-b-0">
            <span className="font-bold text-white">{fullName(row.intern)}</span>
            <span>{new Date(row.date).toLocaleDateString()}</span>
            <span>{row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} - {row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
            <span className={`w-fit rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${statusCls[row.status] || statusCls.present}`}>{row.status}</span>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-cyan-400/15 bg-cyan-500/[0.06] p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">QR Check-In Foundation</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">Backend check-in accepts a `qrToken` and records source as `qr`, so QR scanner UI can be added without changing the attendance schema.</p>
      </section>
    </div>
  );
}
