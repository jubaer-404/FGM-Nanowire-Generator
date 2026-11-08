import React, { useState } from 'react';
import { FGMConfig, GradedMaterial, GradingDirection, GradingKind, FractionMode } from '../fgm/types';
import { ELEMENT_LIBRARY } from '../fgm/presets';
import {
  Sparkles,
  TrendingUp,
  Compass,
  Percent,
  Sliders,
  Dices,
  HelpCircle,
  Palette,
} from 'lucide-react';

interface GradedMaterialEditorProps {
  config: FGMConfig;
  onConfigChange: (updates: Partial<FGMConfig>) => void;
}

export const GradedMaterialEditor: React.FC<GradedMaterialEditorProps> = ({
  config,
  onConfigChange,
}) => {
  const [isCustomElement, setIsCustomElement] = useState(
    !(config.gradedMaterial.symbol in ELEMENT_LIBRARY)
  );

  const graded = config.gradedMaterial;
  const gradedTypeId = config.baseSegments.length + 1;

  // Handle preset element selection
  const handleSelectPresetElement = (symbol: string) => {
    setIsCustomElement(false);
    const el = ELEMENT_LIBRARY[symbol];
    if (!el) return;
    onConfigChange({
      gradedMaterial: {
        name: el.name,
        symbol: el.symbol,
        mass: el.mass,
        lattice_a_nm: el.fcc_a_nm,
        type_id: gradedTypeId,
        color: el.defaultColor,
      },
    });
  };

  const handleUpdateGraded = (updates: Partial<GradedMaterial>) => {
    onConfigChange({
      gradedMaterial: {
        ...graded,
        ...updates,
        type_id: gradedTypeId,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-full border-2 border-white/40 shadow-md shadow-amber-500/20"
            style={{ backgroundColor: graded.color }}
          />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Graded Material:</span>
              <span className="text-amber-400 font-semibold">{graded.name} ({graded.symbol})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Distributed through base alloy according to grading profile
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            LAMMPS Type {gradedTypeId}
          </span>
        </div>
      </div>

      {/* Element Quick Select Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Choose Graded Element:</span>
          <span className="text-[11px] text-slate-400 font-normal">Click to apply element preset</span>
        </label>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {Object.values(ELEMENT_LIBRARY).map((el) => {
            const isSelected = !isCustomElement && graded.symbol === el.symbol;
            return (
              <button
                key={el.symbol}
                type="button"
                onClick={() => handleSelectPresetElement(el.symbol)}
                className={`p-1.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-600/20 border-amber-500 shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{el.symbol}</span>
                  <span
                    className="w-2 h-2 rounded-full border border-white/20"
                    style={{ backgroundColor: el.defaultColor }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 truncate">{el.name}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Element Toggle */}
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsCustomElement(!isCustomElement)}
            className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
              isCustomElement
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isCustomElement ? '✓ Custom Element Active' : '+ Define Custom Element...'}
          </button>
        </div>
      </div>

      {/* Custom Element Details (if active or expanded) */}
      {isCustomElement && (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2.5">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Custom Graded Element Parameters:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Element Name</label>
              <input
                type="text"
                value={graded.name}
                onChange={(e) => handleUpdateGraded({ name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Platinum"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Chemical Symbol</label>
              <input
                type="text"
                maxLength={3}
                value={graded.symbol}
                onChange={(e) => handleUpdateGraded({ symbol: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                placeholder="e.g. Pt"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Atomic Mass (amu)</label>
              <input
                type="number"
                min="1"
                max="350"
                step="0.01"
                value={graded.mass}
                onChange={(e) =>
                  handleUpdateGraded({ mass: Math.max(1, parseFloat(e.target.value) || 1) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Atom Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={graded.color}
                  onChange={(e) => handleUpdateGraded({ color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-300">{graded.color}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Mathematical Function and Profile */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Grading Function & Direction
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Grading Direction */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              Grading Direction
            </label>
            <select
              value={config.direction}
              onChange={(e) => onConfigChange({ direction: e.target.value as GradingDirection })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="axial">Axial (Grading along Wire Length Z)</option>
              <option value="radial">Radial (Grading Core to Outer Surface R)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {config.direction === 'axial'
                ? 'Additive concentration increases along the nanowire longitudinal axis (Z).'
                : 'Additive concentration increases radially from central axis outward to outer shell.'}
            </p>
          </div>

          {/* Grading Mathematical Model */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Grading Mathematical Function
            </label>
            <select
              value={config.gradingKind}
              onChange={(e) => onConfigChange({ gradingKind: e.target.value as GradingKind })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="power">Power Law: P-FGM [ x = b^p ]</option>
              <option value="exp">Exponential: E-FGM [ x = 1 - exp(-b^p) ]</option>
              <option value="sigmoid">Sigmoidal: S-FGM [ S-Curve ]</option>
              <option value="linear">Linear: [ x = b ]</option>
              <option value="custom">Custom Formula: f(x)</option>
            </select>
          </div>
        </div>

        {/* Exponent Slider (if not custom) */}
        {config.gradingKind !== 'custom' && config.gradingKind !== 'linear' ? (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                Grading Exponent Index (p):
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="0.05"
                  max="10"
                  step="0.05"
                  value={config.p}
                  onChange={(e) =>
                    onConfigChange({ p: Math.max(0.01, parseFloat(e.target.value) || 0.01) })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right text-sky-400 font-bold"
                />
              </div>
            </div>

            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.05"
              value={config.p}
              onChange={(e) => onConfigChange({ p: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>p &lt; 1 (Rapid Initial Rise)</span>
              <span>p = 1 (Linear Trend)</span>
              <span>p &gt; 1 (Gradual / Surface Concentration)</span>
            </div>
          </div>
        ) : config.gradingKind === 'custom' ? (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-xs text-slate-300 block font-medium">
              Custom Mathematical Formula f(x):
            </label>
            <input
              type="text"
              placeholder="e.g. sin(pi * x / 2), x^2, or 1 - cos(pi * x / 2)"
              value={config.customFormula}
              onChange={(e) => onConfigChange({ customFormula: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-400">
              Variable <code className="text-sky-300">x</code> represents normalized coordinate from 0 to 1. Supported functions: sin, cos, exp, log, sqrt, abs, pi.
            </p>
          </div>
        ) : null}

        {/* Fraction Mode and Bins Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Fraction Type</label>
            <select
              value={config.fractionMode}
              onChange={(e) => onConfigChange({ fractionMode: e.target.value as FractionMode })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="atom">Atom Fraction (at. %)</option>
              <option value="mass">Mass Fraction (wt. %)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Number of Bins</label>
            <input
              type="number"
              min="2"
              max="50"
              value={config.bins}
              onChange={(e) =>
                onConfigChange({ bins: Math.max(2, parseInt(e.target.value, 10) || 2) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Random Seed</label>
            <div className="flex gap-1">
              <input
                type="number"
                placeholder="Random"
                value={config.seed ?? ''}
                onChange={(e) =>
                  onConfigChange({
                    seed: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => onConfigChange({ seed: Math.floor(Math.random() * 99999) })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                title="Randomize Seed"
              >
                🎲
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
