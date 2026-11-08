import React from 'react';
import { BaseSegment, SegmentationMode } from '../fgm/types';
import { ELEMENT_LIBRARY } from '../fgm/presets';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface BaseSegmentEditorProps {
  segments: BaseSegment[];
  segmentationMode: SegmentationMode;
  onSegmentsChange: (segments: BaseSegment[]) => void;
  onSegmentationModeChange: (mode: SegmentationMode) => void;
}

export const BaseSegmentEditor: React.FC<BaseSegmentEditorProps> = ({
  segments,
  segmentationMode,
  onSegmentsChange,
  onSegmentationModeChange,
}) => {
  const totalLength = segments.reduce((sum, seg) => sum + (seg.length_nm || 0), 0);

  const handleAddSegment = (elementSymbol = 'Cu') => {
    const el = ELEMENT_LIBRARY[elementSymbol] || ELEMENT_LIBRARY.Cu;
    const nextTypeId = Math.max(...segments.map((s) => s.type_id), 0) + 1;

    const newSeg: BaseSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: el.name,
      symbol: el.symbol,
      length_nm: 2.0,
      mass: el.mass,
      lattice_a_nm: el.fcc_a_nm,
      type_id: nextTypeId,
      color: el.defaultColor,
    };

    onSegmentsChange([...segments, newSeg]);
  };

  const handleUpdateSegment = (id: string, updates: Partial<BaseSegment>) => {
    onSegmentsChange(
      segments.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  const handleElementPresetChange = (id: string, symbol: string) => {
    const el = ELEMENT_LIBRARY[symbol];
    if (!el) return;
    handleUpdateSegment(id, {
      name: el.name,
      symbol: el.symbol,
      mass: el.mass,
      lattice_a_nm: el.fcc_a_nm,
      color: el.defaultColor,
    });
  };

  const handleDeleteSegment = (id: string) => {
    if (segments.length <= 1) return;
    const remaining = segments.filter((seg) => seg.id !== id);
    // Re-assign type IDs sequentially (1, 2, 3...)
    const reindexed = remaining.map((seg, idx) => ({ ...seg, type_id: idx + 1 }));
    onSegmentsChange(reindexed);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= segments.length) return;
    const copied = [...segments];
    const temp = copied[index];
    copied[index] = copied[newIdx];
    copied[newIdx] = temp;
    // Re-index type_ids
    const reindexed = copied.map((seg, idx) => ({ ...seg, type_id: idx + 1 }));
    onSegmentsChange(reindexed);
  };

  return (
    <div className="space-y-4">
      {/* Header and Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            Multi-Material Base Segments ({segments.length})
          </label>
          <p className="text-xs text-slate-400">
            Define segmented alloys (e.g. Cu-Ni-Fe) with exact segment lengths
          </p>
        </div>

        {/* Segmentation Mode Tabs */}
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => onSegmentationModeChange('axial')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              segmentationMode === 'axial'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Layered along wire length (Z-axis)"
          >
            Axial Segments
          </button>
          <button
            type="button"
            onClick={() => onSegmentationModeChange('radial')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              segmentationMode === 'radial'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Concentric Core-Shell layers"
          >
            Core-Shell (Radial)
          </button>
        </div>
      </div>

      {/* Visual Stacked Segment Proportion Bar */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between text-xs text-slate-300">
          <span className="font-semibold text-slate-200">
            Base Composition Stack ({totalLength.toFixed(2)} nm total):
          </span>
          <span className="text-slate-400 font-mono">
            {segmentationMode === 'axial' ? 'Axial junction: L_total' : 'Radial thickness: R_total'}
          </span>
        </div>

        <div className="h-6 w-full rounded-lg overflow-hidden flex bg-slate-950 border border-slate-700/60 shadow-inner">
          {segments.map((seg, idx) => {
            const pct = totalLength > 0 ? (seg.length_nm / totalLength) * 100 : 0;
            return (
              <div
                key={seg.id}
                style={{
                  width: `${pct}%`,
                  backgroundColor: seg.color,
                }}
                className="h-full flex items-center justify-center text-[10px] font-bold text-white px-1 shadow-sm relative group overflow-hidden transition-all duration-200"
                title={`${seg.name} (${seg.symbol}): ${seg.length_nm.toFixed(2)} nm (${pct.toFixed(1)}%)`}
              >
                <span className="truncate drop-shadow-md">
                  {seg.symbol} {seg.length_nm}nm
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          {segments.map((seg, idx) => (
            <div key={seg.id} className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium">
                Segment #{idx + 1} ({seg.symbol}):
              </span>
              <span className="font-mono text-slate-400">{seg.length_nm} nm</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segments List Cards */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {segments.map((seg, index) => (
          <div
            key={seg.id}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm space-y-2"
          >
            {/* Segment Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs font-bold text-slate-200">
                  Segment {index + 1}: {seg.name} ({seg.symbol})
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400">
                  LAMMPS Type {seg.type_id}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move layer up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === segments.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move layer down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={segments.length <= 1}
                  onClick={() => handleDeleteSegment(seg.id)}
                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Remove this segment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Segment Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Element Preset */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Element</label>
                <select
                  value={seg.symbol in ELEMENT_LIBRARY ? seg.symbol : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      handleElementPresetChange(seg.id, e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                >
                  {Object.values(ELEMENT_LIBRARY).map((el) => (
                    <option key={el.symbol} value={el.symbol}>
                      {el.symbol} - {el.name}
                    </option>
                  ))}
                  <option value="custom">Custom...</option>
                </select>
              </div>

              {/* Length in nm */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {segmentationMode === 'axial' ? 'Length (nm)' : 'Thickness (nm)'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={seg.length_nm}
                  onChange={(e) =>
                    handleUpdateSegment(seg.id, {
                      length_nm: Math.max(0.2, parseFloat(e.target.value) || 0.2),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Atomic Mass (amu) */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Mass (amu)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  value={seg.mass}
                  onChange={(e) =>
                    handleUpdateSegment(seg.id, {
                      mass: Math.max(1, parseFloat(e.target.value) || 1),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Lattice Constant a (nm) */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Lattice a (nm)</label>
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.005"
                  value={seg.lattice_a_nm}
                  onChange={(e) =>
                    handleUpdateSegment(seg.id, {
                      lattice_a_nm: Math.max(0.1, parseFloat(e.target.value) || 0.1),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Segment Button */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleAddSegment('Cu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Material Segment
        </button>

        <span className="text-[11px] text-slate-400">Quick add:</span>
        {['Ni', 'Fe', 'Al', 'Ti', 'Au'].map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => handleAddSegment(sym)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            +{sym}
          </button>
        ))}
      </div>
    </div>
  );
};
