import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  FGMConfig,
  FGMBuildResult,
  NanostructureShape,
  CrystalLattice,
  GradingDirection,
  GradingKind,
  FractionMode,
} from './fgm/types';
import { PRESET_CONFIGURATIONS, ELEMENT_LIBRARY } from './fgm/presets';
import { buildFGMStructure } from './fgm/generator';
import { ThreeNanowireViewer } from './components/ThreeNanowireViewer';
import { BaseSegmentEditor } from './components/BaseSegmentEditor';
import { GradedMaterialEditor } from './components/GradedMaterialEditor';
import { GradingChart } from './components/GradingChart';
import { BinTable } from './components/BinTable';
import { CodeViewer } from './components/CodeViewer';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Box,
  Layers,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  Download,
  Upload,
  Atom,
  HelpCircle,
  FileCode,
  Table,
  TrendingUp,
  Activity,
  CheckCircle,
  ArrowRight,
  Settings2,
} from 'lucide-react';

export default function App() {
  // Active configuration state (defaults to Cu-Ni-Fe + Au preset)
  const [config, setConfig] = useState<FGMConfig>(PRESET_CONFIGURATIONS[0].config);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_CONFIGURATIONS[0].id);

  // Active view tab (3D viewport, Charts, Bins, Export)
  const [activeMainTab, setActiveMainTab] = useState<'3d' | 'charts' | 'bins' | 'export'>('3d');

  // Sidebar navigation tab: default to 'graded' so user immediately sees the grading edit section!
  const [sidebarTab, setSidebarTab] = useState<'graded' | 'base' | 'geometry' | 'all'>('graded');

  // Generation result state
  const [result, setResult] = useState<FGMBuildResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Run generation
  const handleGenerate = (currentConfig = config) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = buildFGMStructure(currentConfig);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run initial build on mount
  useEffect(() => {
    handleGenerate(config);
  }, []);

  // Preset switch
  const handlePresetSelect = (presetId: string) => {
    const found = PRESET_CONFIGURATIONS.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(presetId);
    const normalizedBaseSegments = found.config.baseSegments.map((s, idx) => ({
      ...s,
      type_id: idx + 1,
    }));
    const normalizedConfig: FGMConfig = {
      ...found.config,
      baseSegments: normalizedBaseSegments,
      gradedMaterial: {
        ...found.config.gradedMaterial,
        type_id: normalizedBaseSegments.length + 1,
      },
    };
    setConfig(normalizedConfig);
    handleGenerate(normalizedConfig);
  };

  // Update config helper with automatic type_id synchronization
  const updateConfig = (updates: Partial<FGMConfig>) => {
    let next = { ...config, ...updates };
    if (updates.baseSegments || updates.gradedMaterial) {
      const baseSegments = (updates.baseSegments || config.baseSegments).map((s, idx) => ({
        ...s,
        type_id: idx + 1,
      }));
      const gradedMaterial = {
        ...(updates.gradedMaterial || config.gradedMaterial),
        type_id: baseSegments.length + 1,
      };
      next = { ...next, baseSegments, gradedMaterial };
    }
    setConfig(next);
  };

  // Graded element preset changer
  const handleGradedElementChange = (symbol: string) => {
    const el = ELEMENT_LIBRARY[symbol];
    if (!el) return;
    updateConfig({
      gradedMaterial: {
        ...config.gradedMaterial,
        name: el.name,
        symbol: el.symbol,
        mass: el.mass,
        lattice_a_nm: el.fcc_a_nm,
        color: el.defaultColor,
      },
    });
  };

  // Total length calculated from segments
  const totalLengthNm = useMemo(() => {
    return config.baseSegments.reduce((sum, seg) => sum + (seg.length_nm || 0), 0);
  }, [config.baseSegments]);

  // JSON export & import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'fgm_config.json');
    dlAnchor.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.baseSegments) {
            setConfig(parsed);
            handleGenerate(parsed);
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-md shadow-sky-900/30">
              <Atom className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Multi-Material FGM Nanostructure Generator
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  LAMMPS MD Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Segmented Base Alloys (Cu, Ni, Fe...) with Functionally Graded Material Distribution
              </p>
            </div>
          </div>

          {/* Presets and Global Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[11px]">Preset:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                {PRESET_CONFIGURATIONS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-slate-900 text-white">
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Save Configuration JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Load Configuration JSON"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Comprehensive Configuration Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 max-h-[calc(100vh-80px)] lg:overflow-y-auto pr-1">
          {/* Action Trigger Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Nanostructure Configuration
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Total Length: <span className="text-sky-300 font-semibold">{totalLengthNm.toFixed(1)} nm</span> | Total Types:{' '}
                  <span className="text-amber-300 font-semibold">{config.baseSegments.length + 1}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate(config)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isGenerating ? 'Building...' : 'Generate FGM'}
              </button>
            </div>

            {/* Quick Navigation Jump Badges */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setSidebarTab('base')}
                className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  sidebarTab === 'base'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="truncate">
                  Base: <strong className="text-slate-200">{config.baseSegments.map((s) => s.symbol).join('-')}</strong>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({config.baseSegments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('graded')}
                className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  sidebarTab === 'graded'
                    ? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-white/30"
                    style={{ backgroundColor: config.gradedMaterial.color }}
                  />
                  Graded: <strong className="text-amber-300">{config.gradedMaterial.symbol}</strong>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">✎ Edit</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
              <span className="font-bold">Generation Error:</span> {errorMessage}
            </div>
          )}

          {/* Section Navigation Tabs Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSidebarTab('graded')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === 'graded'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Graded Material</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {config.gradedMaterial.symbol}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('base')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === 'base'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Base Alloy</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {config.baseSegments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('geometry')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === 'geometry'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Geometry</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('all')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                sidebarTab === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title="Show All Sections Together"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: Graded Material Editor (Rendered when 'graded' or 'all') */}
          {(sidebarTab === 'graded' || sidebarTab === 'all') && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-md shadow-amber-950/20 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Graded Material & FGM Profile
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  LAMMPS Type {config.baseSegments.length + 1}
                </span>
              </div>

              <GradedMaterialEditor config={config} onConfigChange={updateConfig} />

              {sidebarTab === 'graded' && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('base')}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    ← Configure Base Alloy
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMainTab('charts')}
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    View Grading Profile Curve →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Multi-Material Base Segments Configurator (Rendered when 'base' or 'all') */}
          {(sidebarTab === 'base' || sidebarTab === 'all') && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <BaseSegmentEditor
                segments={config.baseSegments}
                segmentationMode={config.segmentationMode}
                onSegmentsChange={(baseSegments) => updateConfig({ baseSegments })}
                onSegmentationModeChange={(segmentationMode) => updateConfig({ segmentationMode })}
              />

              {sidebarTab === 'base' && (
                <div className="pt-2 flex justify-end border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('graded')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-medium transition-colors"
                  >
                    <span>Next: Configure Graded Material ({config.gradedMaterial.symbol})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Structure Geometry & Crystal Lattice (Rendered when 'geometry' or 'all') */}
          {(sidebarTab === 'geometry' || sidebarTab === 'all') && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-sky-400" />
                  Structure Geometry & Lattice
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nanostructure Shape</label>
                  <select
                    value={config.shape}
                    onChange={(e) => updateConfig({ shape: e.target.value as NanostructureShape })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="cylindrical">Cylindrical Nanowire</option>
                    <option value="cuboid">Cuboid Nanobar</option>
                    <option value="sphere">Spherical Nanoparticle</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Crystal Lattice</label>
                  <select
                    value={config.lattice}
                    onChange={(e) => updateConfig({ lattice: e.target.value as CrystalLattice })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="fcc">Face-Centered Cubic (FCC)</option>
                    <option value="bcc">Body-Centered Cubic (BCC)</option>
                  </select>
                </div>

                {config.shape !== 'cuboid' ? (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Radius R (nm)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.1"
                      value={config.radius_nm}
                      onChange={(e) =>
                        updateConfig({ radius_nm: Math.max(0.5, parseFloat(e.target.value) || 0.5) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">X-Dimension (nm)</label>
                      <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={config.xdim_nm}
                        onChange={(e) =>
                          updateConfig({ xdim_nm: Math.max(0.5, parseFloat(e.target.value) || 0.5) })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Y-Dimension (nm)</label>
                      <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={config.ydim_nm}
                        onChange={(e) =>
                          updateConfig({ ydim_nm: Math.max(0.5, parseFloat(e.target.value) || 0.5) })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Vacuum XY (Å)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={config.vacuum_xy}
                    onChange={(e) =>
                      updateConfig({ vacuum_xy: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {sidebarTab === 'geometry' && (
                <div className="pt-2 flex justify-end border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('base')}
                    className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <span>Configure Base Alloy Segments →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive 3D Viewport & Output Dashboards */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
          {/* Main View Tabs Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMainTab('3d')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeMainTab === '3d'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Atom className="w-4 h-4 text-sky-300" />
                3D Nanostructure
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('charts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeMainTab === 'charts'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                Grading & Composition Curves
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('bins')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeMainTab === 'bins'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 text-amber-300" />
                Bin Breakdown Table
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('export')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeMainTab === 'export'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4 text-indigo-300" />
                LAMMPS Data & Scripts
              </button>
            </div>

            {/* Quick Status Pill */}
            {result && (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                Atoms: <span className="text-white font-bold">{result.atoms.length.toLocaleString()}</span> | Time:{' '}
                <span className="text-sky-300">{result.generationTimeMs}ms</span>
              </div>
            )}
          </div>

          {/* Active Tab Viewport Rendering */}
          <div className="flex-1 min-h-[520px]">
            {activeMainTab === '3d' && <ThreeNanowireViewer result={result} />}
            {activeMainTab === 'charts' && result && <GradingChart result={result} />}
            {activeMainTab === 'bins' && result && <BinTable result={result} />}
            {activeMainTab === 'export' && result && <CodeViewer result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
}
