import React, { useState } from 'react';
import { FGMBuildResult } from '../fgm/types';
import { generateLAMMPSData, generateXYZData, generateLAMMPSScript } from '../fgm/lammps';
import { Copy, Check, Download, FileCode, CheckCircle2, XCircle } from 'lucide-react';

interface CodeViewerProps {
  result: FGMBuildResult;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'lammps' | 'xyz' | 'script' | 'validation'>('lammps');
  const [copied, setCopied] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);

  const previewLimit = previewAll ? undefined : 1500;

  const getActiveContent = (): string => {
    switch (activeTab) {
      case 'lammps':
        return generateLAMMPSData(result, previewLimit);
      case 'xyz':
        return generateXYZData(result);
      case 'script':
        return generateLAMMPSScript(result, 'fgm_nanowire.data');
      default:
        return '';
    }
  };

  const handleCopy = () => {
    // For copy, copy full file content
    let full = '';
    if (activeTab === 'lammps') full = generateLAMMPSData(result);
    else if (activeTab === 'xyz') full = generateXYZData(result);
    else if (activeTab === 'script') full = generateLAMMPSScript(result, 'fgm_nanowire.data');

    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    let content = '';
    let filename = '';
    let mime = 'text/plain;charset=utf-8;';

    const baseSymbols = result.config.baseSegments.map((s) => s.symbol).join('-');
    const gradedSymbol = result.config.gradedMaterial.symbol;

    if (activeTab === 'lammps') {
      content = generateLAMMPSData(result);
      filename = `fgm_${baseSymbols}_${gradedSymbol}.data`;
    } else if (activeTab === 'xyz') {
      content = generateXYZData(result);
      filename = `fgm_${baseSymbols}_${gradedSymbol}.xyz`;
    } else if (activeTab === 'script') {
      content = generateLAMMPSScript(result, `fgm_${baseSymbols}_${gradedSymbol}.data`);
      filename = `in.fgm`;
    }

    if (!content) return;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* File Type Tabs and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('lammps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'lammps'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            LAMMPS Data (.data / .nw)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xyz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'xyz'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            XYZ Coordinates (.xyz)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'script'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            LAMMPS Script (in.fgm)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'validation'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Self-Checks ({result.validations.filter((v) => v.passed).length}/{result.validations.length})
          </button>
        </div>

        {activeTab !== 'validation' && (
          <div className="flex items-center gap-2">
            {activeTab === 'lammps' && result.atoms.length > 1500 && (
              <button
                type="button"
                onClick={() => setPreviewAll(!previewAll)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded border border-slate-700 bg-slate-900"
              >
                {previewAll ? 'Truncate Preview' : 'Preview All Atoms'}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Full File!' : 'Copy'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'validation' ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            Automated Physical & Structural Integrity Diagnostics:
          </div>
          <div className="space-y-2">
            {result.validations.map((v, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border flex items-start gap-3 ${
                  v.passed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                {v.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    {v.name}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        v.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {v.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">{v.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed selection:bg-sky-900 selection:text-white">
            {getActiveContent()}
          </pre>
        </div>
      )}
    </div>
  );
};
