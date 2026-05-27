import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import { certificateService } from '../../services/certificateService';

const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Intern';

export default function ManageCertificates() {
  const [rows, setRows] = useState([]);
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState('');
  const [active, setActive] = useState(null);

  const fetchRows = async () => {
    try {
      setRows(await certificateService.getCertificates());
      setInternships((await axiosInstance.get('/internships')).data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load certificates.');
    }
  };
  useEffect(() => { fetchRows(); }, []);

  const generate = async () => {
    if (!selectedInternship) return toast.warning('Select an internship.');
    try {
      await certificateService.generateCertificate(selectedInternship);
      toast.success('Certificate generated for manager approval.');
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to generate certificate.');
    }
  };

  const approve = async (id) => {
    try {
      await certificateService.approveCertificate(id);
      toast.success('Certificate approved and verified.');
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to approve certificate.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:grid-cols-[minmax(0,1fr)_180px]">
        <select value={selectedInternship} onChange={(e) => setSelectedInternship(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none">
          <option value="">Select completed/active internship</option>
          {internships.map((item) => <option key={item._id} value={item._id}>{name(item.student)} · {item.department}</option>)}
        </select>
        <button onClick={generate} className="rounded-xl bg-orange-400 px-5 py-3 text-sm font-black text-slate-950">Generate</button>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {rows.length === 0 ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">No certificates yet.</div> : rows.map((cert) => (
          <article key={cert._id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-300">{cert.certificateNumber}</span>
                <h3 className="mt-2 text-xl font-black text-white">{name(cert.intern)}</h3>
                <p className="mt-1 text-sm text-slate-400">{cert.department} · Score {cert.finalScore}%</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase text-slate-300">{cert.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setActive(cert)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white">View</button>
              {cert.status !== 'issued' && <button onClick={() => approve(cert._id)} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950">Approve</button>}
              <a href={`/certificate/verify/${cert.certificateNumber}`} className="rounded-xl border border-orange-400/20 px-4 py-2 text-sm font-black text-orange-200 no-underline">Verify</a>
            </div>
          </article>
        ))}
      </section>

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white p-8 text-slate-950 shadow-2xl">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">InterLink Verified Certificate</p>
                <h2 className="mt-4 text-4xl font-black">Certificate of Internship Completion</h2>
              </div>
              <button onClick={() => setActive(null)} className="h-10 w-10 rounded-xl border border-slate-200">×</button>
            </div>
            <p className="mt-8 text-lg leading-8">This certifies that <strong>{name(active.intern)}</strong> completed an InterLink internship in <strong>{active.department}</strong> with a final score of <strong>{active.finalScore}%</strong>.</p>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-black">{active.certificateNumber}</p>
                <p className="text-sm text-slate-500">{active.verificationUrl}</p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: active.qrCodeSvg }} />
            </div>
            <button onClick={() => window.print()} className="mt-8 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Download / Print</button>
          </section>
        </div>
      )}
    </div>
  );
}
