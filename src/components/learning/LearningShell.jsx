import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

const tabs = [
  { to: '/learning', label: 'All Courses', icon: 'fa-solid fa-graduation-cap', end: true },
  { to: '/learning/my-learning', label: 'My Learning', icon: 'fa-solid fa-book-open-reader' }
];

export default function LearningShell() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main className="pt-[96px]">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_35%),linear-gradient(135deg,rgba(6,9,26,0.96),rgba(5,14,32,0.92))] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="section-label !mb-4">
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                Learner workspace
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                Learn at your pace, keep every course in view.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Browse published courses, start free learning instantly, preview freemium chapters, and continue enrolled courses from one focused space.
              </p>
            </div>

            <nav className="inline-flex w-full rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 sm:w-auto">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) => [
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black no-underline transition sm:flex-none',
                    isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  ].join(' ')}
                >
                  <i className={tab.icon} aria-hidden="true" />
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </section>

        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
