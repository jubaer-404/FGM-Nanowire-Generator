import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Monitor, CheckCircle, Info, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone mode (desktop application)
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Desktop App Mode</span>
      </div>
    );
  }

  // Chromium / Edge / Chrome / Brave install flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/40 active:scale-95 transition-all"
        title="Install as native desktop app on your PC"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Install Desktop App</span>
      </button>
    );
  }

  // If browser beforeinstallprompt hasn't fired yet or browser is Safari/Firefox
  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        title="Software Deployment & Desktop Package Guide"
      >
        <Download className="w-3.5 h-3.5 text-sky-400" />
        <span>Install on PC</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Deploy & Run on Your PC</h3>
                  <p className="text-[11px] text-slate-400">Run as a standalone desktop application offline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Method 1: Instant Browser Desktop App Install */}
              <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 space-y-1.5">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[10px]">Method 1</span>
                  1-Click Desktop App (Chrome / Edge / Brave)
                </span>
                <p className="text-[11px] text-slate-400">
                  Open this link in Chrome or Edge. Look at the address bar on the right and click the <strong>Install</strong> icon (computer with down arrow), or click the browser menu (⋮) → <strong>Install FGM Builder</strong>.
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">
                  ✓ Creates desktop icon & taskbar shortcut • Works 100% offline
                </p>
              </div>

              {/* Method 2: Local Node.js Standalone Package */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">Method 2</span>
                  Local Software Package (Node.js & npm)
                </span>
                <p className="text-[11px] text-slate-400">
                  Download or clone this project folder to your PC, then open your terminal in the folder:
                </p>
                <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-sky-300 overflow-x-auto space-y-1">
                  <div># 1. Install dependencies</div>
                  <div>npm install</div>
                  <div># 2. Launch software locally</div>
                  <div>npm run dev</div>
                </pre>
                <p className="text-[10px] text-slate-400">
                  The software will open at <code className="text-sky-300">http://localhost:3000</code>.
                </p>
              </div>

              {/* Method 3: Desktop Executable Build */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">Method 3</span>
                  Production Standalone Package
                </span>
                <p className="text-[11px] text-slate-400">
                  Compile into an ultra-fast optimized static release:
                </p>
                <pre className="p-2 rounded-lg bg-black/60 font-mono text-[11px] text-sky-300">
                  npm run build && npm run preview
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
