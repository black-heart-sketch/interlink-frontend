function Loader({ message = '' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
      </div>
      {message && <p className="text-slate-500 text-sm tracking-widest uppercase">{message}</p>}
    </div>
  );
}

export default Loader;
