export default function AppHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="bg-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#ffffff" }}>
            🌡️ Fever Tracker
          </h1>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Temperature & medication log
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 transition-colors hover:border-slate-400"
          style={{ color: "#cbd5e1" }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
