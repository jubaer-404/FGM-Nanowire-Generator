import React, { useState } from 'react';
import { FGMBuildResult } from '../fgm/types';
import { TrendingUp, BarChart3, Atom, Percent, Sparkles } from 'lucide-react';

interface GradingChartProps {
  result: FGMBuildResult;
}

export const GradingChart: React.FC<GradingChartProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'grading' | 'composition'>('grading');
  const [curveMetric, setCurveMetric] = useState<'atom' | 'mass'>('atom');

  const { curvePoints, bins, compositionBreakdown, config } = result;

  // SVG dimensions for grading chart
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (b: number) => padding.left + b * plotWidth;
  const yScale = (val: number) => padding.top + (1.0 - Math.max(0, Math.min(1, val))) * plotHeight;

  // Theoretical path
  const theoreticalPath = curvePoints.theoretical
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(pt.b).toFixed(1)} ${yScale(pt.fraction).toFixed(1)}`)
    .join(' ');

  // Actual bins path
  const actualPath = curvePoints.actual
    .map((pt, i) => {
      const val = curveMetric === 'atom' ? pt.atomFraction : pt.massFraction;
      return `${i === 0 ? 'M' : 'L'} ${xScale(pt.b).toFixed(1)} ${yScale(val).toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      {/* Header and Chart Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'grading'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Grading Function (Desired vs Actual)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('composition')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'composition'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Multi-Material Concentration Profile
          </button>
        </div>

        {activeTab === 'grading' && (
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] px-2">Metric:</span>
            <button
              type="button"
              onClick={() => setCurveMetric('atom')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                curveMetric === 'atom' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Atom Fraction
            </button>
            <button
              type="button"
              onClick={() => setCurveMetric('mass')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                curveMetric === 'mass' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Mass Fraction
            </button>
          </div>
        )}
      </div>

      {/* Main Chart Area */}
      {activeTab === 'grading' ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-sky-400 inline-block" />
                <span>Desired ({config.gradingKind.toUpperCase()}-FGM, p={config.p})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ring-2 ring-rose-500/30" />
                <span>Modeled Structure ({curveMetric === 'atom' ? 'Atom %' : 'Mass %'})</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Bins: {bins.length} | Seed: {config.seed ?? 'Random'}
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[320px] select-none">
              {/* Grid Lines */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => (
                <g key={`y-${tick}`}>
                  <line
                    x1={padding.left}
                    y1={yScale(tick)}
                    x2={width - padding.right}
                    y2={yScale(tick)}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? '' : '3 3'}
                  />
                  <text
                    x={padding.left - 8}
                    y={yScale(tick) + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {(tick * 100).toFixed(0)}%
                  </text>
                </g>
              ))}

              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => (
                <g key={`x-${tick}`}>
                  <line
                    x1={xScale(tick)}
                    y1={padding.top}
                    x2={xScale(tick)}
                    y2={height - padding.bottom}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={xScale(tick)}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Axes Labels */}
              <text
                x={width / 2}
                y={height - 10}
                textAnchor="middle"
                className="text-[11px] fill-slate-300 font-medium"
              >
                Normalized Position b (0 = start, 1 = end / surface)
              </text>
              <text
                x={-(height / 2)}
                y={16}
                transform="rotate(-90)"
                textAnchor="middle"
                className="text-[11px] fill-slate-300 font-medium"
              >
                Graded Material {config.gradedMaterial.symbol} ({curveMetric === 'atom' ? 'Atom %' : 'Mass %'})
              </text>

              {/* Theoretical line */}
              <path
                d={theoreticalPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                className="drop-shadow-sm"
              />

              {/* Actual bins connecting dashed line */}
              <path
                d={actualPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Actual bins points */}
              {curvePoints.actual.map((pt, i) => {
                const val = curveMetric === 'atom' ? pt.atomFraction : pt.massFraction;
                const cx = xScale(pt.b);
                const cy = yScale(val);
                return (
                  <g key={`pt-${i}`} className="cursor-pointer group">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill="#f43f5e"
                      stroke="#fff"
                      strokeWidth="1.5"
                      className="transition-transform group-hover:scale-125"
                    />
                    <title>{`Bin ${i + 1}: b=${pt.b.toFixed(2)}, Value=${(val * 100).toFixed(1)}%`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Multi-Material Concentration Stack along Bins */
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <span className="font-semibold text-slate-200">
              Layer-by-Layer Elemental Composition across {bins.length} Bins:
            </span>
            <span className="text-slate-400">Shows graded material penetration across base segments</span>
          </div>

          <div className="space-y-2">
            {bins.map((bi) => {
              const total = Math.max(1, bi.totalAtoms);
              const gradedPct = (bi.gradedAtoms / total) * 100;

              return (
                <div key={bi.bin} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                    <span className="font-semibold text-sky-300">
                      Bin #{bi.bin} ({bi.lo.toFixed(1)} - {bi.hi.toFixed(1)} Å, b={bi.b.toFixed(2)}):
                    </span>
                    <span className="text-slate-400">
                      {bi.totalAtoms} atoms | {config.gradedMaterial.symbol}: {gradedPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div className="h-4.5 w-full rounded overflow-hidden flex bg-slate-900 border border-slate-800">
                    {/* Base Segment proportions in this bin */}
                    {config.baseSegments.map((seg) => {
                      const count = bi.baseAtomsCount[seg.type_id] || 0;
                      const pct = (count / total) * 100;
                      if (pct <= 0) return null;
                      return (
                        <div
                          key={seg.id}
                          style={{ width: `${pct}%`, backgroundColor: seg.color }}
                          className="h-full flex items-center justify-center text-[9px] font-bold text-white px-1 relative group overflow-hidden"
                          title={`${seg.symbol}: ${count} atoms (${pct.toFixed(1)}%)`}
                        >
                          <span className="truncate">{seg.symbol}</span>
                        </div>
                      );
                    })}

                    {/* Graded Material in this bin */}
                    {gradedPct > 0 && (
                      <div
                        style={{
                          width: `${gradedPct}%`,
                          backgroundColor: config.gradedMaterial.color,
                        }}
                        className="h-full flex items-center justify-center text-[9px] font-bold text-black px-1 relative group overflow-hidden shadow-sm"
                        title={`${config.gradedMaterial.symbol} (Graded): ${bi.gradedAtoms} atoms (${gradedPct.toFixed(1)}%)`}
                      >
                        <span className="truncate">{config.gradedMaterial.symbol}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Atom className="w-3.5 h-3.5 text-sky-400" />
            Total Atoms
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {result.atoms.length.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Graded {config.gradedMaterial.symbol} Atoms
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {result.atoms.filter((a) => a.isGraded).length.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            Graded Content
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {(
              (result.atoms.filter((a) => a.isGraded).length /
                Math.max(1, result.atoms.length)) *
              100
            ).toFixed(1)}
            %
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            Effective Lattice a
          </div>
          <div className="text-lg font-bold text-indigo-300 font-mono">
            {(result.effectiveLattice_A / 10).toFixed(4)} nm
          </div>
        </div>
      </div>
    </div>
  );
};
