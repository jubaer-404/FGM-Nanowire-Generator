import React from 'react';
import { FGMBuildResult } from '../fgm/types';
import { Table, Download } from 'lucide-react';
import { generateBinCSV } from '../fgm/lammps';

interface BinTableProps {
  result: FGMBuildResult;
}

export const BinTable: React.FC<BinTableProps> = ({ result }) => {
  const { bins, config } = result;

  const handleDownloadCSV = () => {
    const csvContent = generateBinCSV(result);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fgm_bins_${config.shape}_${config.gradingKind}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Table className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">Bin-by-Bin Discrete Composition Breakdown</span>
          <span className="text-slate-400">({bins.length} bins along {config.direction} direction)</span>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Bin CSV
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
            <tr>
              <th className="px-3 py-2.5">Bin</th>
              <th className="px-3 py-2.5">Range (Å)</th>
              <th className="px-3 py-2.5">b (Norm)</th>
              <th className="px-3 py-2.5 text-right">Target x(b)</th>
              <th className="px-3 py-2.5 text-right">Total Atoms</th>
              {config.baseSegments.map((seg) => (
                <th key={seg.id} className="px-3 py-2.5 text-right text-slate-300">
                  {seg.symbol} Base
                </th>
              ))}
              <th className="px-3 py-2.5 text-right text-amber-400 font-semibold">
                {config.gradedMaterial.symbol} Graded
              </th>
              <th className="px-3 py-2.5 text-right">Atom %</th>
              <th className="px-3 py-2.5 text-right">Mass %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono">
            {bins.map((bi) => {
              const diff = (bi.actualAtomFraction - bi.targetGradingFraction) * 100;

              return (
                <tr key={bi.bin} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-3 py-2 font-bold text-sky-400">#{bi.bin}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {bi.lo.toFixed(2)} .. {bi.hi.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{bi.b.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-200">
                    {(bi.targetGradingFraction * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-white font-medium">
                    {bi.totalAtoms.toLocaleString()}
                  </td>
                  {config.baseSegments.map((seg) => {
                    const count = bi.baseAtomsCount[seg.type_id] || 0;
                    return (
                      <td key={seg.id} className="px-3 py-2 text-right text-slate-300">
                        {count.toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-amber-400 font-bold">
                    {bi.gradedAtoms.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-sky-300">
                    {(bi.actualAtomFraction * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-400">
                    {(bi.actualMassFraction * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
