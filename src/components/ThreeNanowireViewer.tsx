import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AtomRecord, FGMBuildResult } from '../fgm/types';
import {
  RotateCcw,
  Scissors,
  Layers,
  Eye,
  Maximize2,
  Info,
  Palette,
  Sparkles,
} from 'lucide-react';

interface ThreeNanowireViewerProps {
  result: FGMBuildResult | null;
}

type ColorMode = 'material' | 'base_vs_graded' | 'bin' | 'axial';

export const ThreeNanowireViewer: React.FC<ThreeNanowireViewerProps> = ({ result }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('material');
  const [sliceEnabled, setSliceEnabled] = useState(false);
  const [slicePosition, setSlicePosition] = useState(0.5); // 0 to 1
  const [atomScale, setAtomScale] = useState(0.85);
  const [showBox, setShowBox] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [selectedAtom, setSelectedAtom] = useState<AtomRecord | null>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const boxHelperRef = useRef<THREE.Box3Helper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Map element types to colors
  const colorPalette = useMemo(() => {
    if (!result) return new Map<number, THREE.Color>();
    const map = new Map<number, THREE.Color>();
    for (const seg of result.config.baseSegments) {
      map.set(seg.type_id, new THREE.Color(seg.color));
    }
    map.set(
      result.config.gradedMaterial.type_id,
      new THREE.Color(result.config.gradedMaterial.color)
    );
    return map;
  }, [result]);

  // Color generator based on mode
  const getAtomColor = (atom: AtomRecord): THREE.Color => {
    if (!result) return new THREE.Color('#999');

    if (colorMode === 'base_vs_graded') {
      if (atom.isGraded) {
        return new THREE.Color('#fbbf24'); // Bright Gold
      }
      return new THREE.Color('#475569'); // Dark Slate for base
    }

    if (colorMode === 'bin') {
      const hue = ((atom.bin - 1) / Math.max(1, result.bins.length)) * 0.75;
      return new THREE.Color().setHSL(hue, 0.85, 0.5);
    }

    if (colorMode === 'axial') {
      const maxZ = result.box.z[1] - result.box.z[0];
      const normZ = maxZ > 0 ? atom.z / maxZ : 0;
      return new THREE.Color().setHSL(0.65 - normZ * 0.65, 0.9, 0.55);
    }

    // Default: 'material'
    return colorPalette.get(atom.type) || new THREE.Color('#64748b');
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19'); // Deep slate night
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(50, 40, 70);
    cameraRef.current = camera;

    // Renderer (software GL friendly, high stability)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'default',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(50, 80, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.6);
    dirLight2.position.set(-50, -40, -50);
    scene.add(dirLight2);

    // Axes
    const axes = new THREE.AxesHelper(15);
    axesHelperRef.current = axes;
    scene.add(axes);

    // On-demand rendering pattern (software-WebGL friendly)
    const renderScene = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    controls.addEventListener('change', renderScene);

    // Initial render
    renderScene();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      renderScene();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      controls.removeEventListener('change', renderScene);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update atoms instanced mesh
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !result) return;

    // Clean previous mesh & helpers
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      (instancedMeshRef.current.material as THREE.Material).dispose();
      instancedMeshRef.current = null;
    }
    if (boxHelperRef.current) {
      scene.remove(boxHelperRef.current);
      boxHelperRef.current.dispose();
      boxHelperRef.current = null;
    }

    const { atoms, box } = result;
    const atomRadius = (result.effectiveLattice_A / 4) * atomScale;

    // Filter atoms if slicing is active
    let visibleAtoms = atoms;
    if (sliceEnabled) {
      // Cut in half along X axis (longitudinal cross-section)
      const cutThreshold = box.x[0] + (box.x[1] - box.x[0]) * slicePosition;
      visibleAtoms = atoms.filter((a) => a.x >= cutThreshold);
    }

    const count = visibleAtoms.length;
    if (count === 0) return;

    // Geometry & Material
    const sphereGeometry = new THREE.SphereGeometry(atomRadius, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.65,
    });

    const instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, count);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const atom = visibleAtoms[i];
      dummy.position.set(atom.x, atom.y, atom.z);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      const c = getAtomColor(atom);
      color.set(c);
      instancedMesh.setColorAt(i, color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    instancedMesh.userData = { atomsList: visibleAtoms };

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    // Bounding Box Helper
    const box3 = new THREE.Box3(
      new THREE.Vector3(box.x[0], box.y[0], box.z[0]),
      new THREE.Vector3(box.x[1], box.y[1], box.z[1])
    );
    const boxHelper = new THREE.Box3Helper(box3, new THREE.Color('#38bdf8'));
    boxHelper.visible = showBox;
    scene.add(boxHelper);
    boxHelperRef.current = boxHelper;

    // Center camera on the wire
    const center = new THREE.Vector3();
    box3.getCenter(center);
    const size = new THREE.Vector3();
    box3.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.copy(center);
      cameraRef.current.position.set(center.x + maxDim * 1.3, center.y + maxDim * 0.9, center.z + maxDim * 1.4);
      cameraRef.current.lookAt(center);
      controlsRef.current.update();
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }
  }, [result, colorMode, sliceEnabled, slicePosition, atomScale, showBox]);

  // Toggle helpers
  useEffect(() => {
    if (boxHelperRef.current) {
      boxHelperRef.current.visible = showBox;
    }
  }, [showBox]);

  useEffect(() => {
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = showAxes;
    }
  }, [showAxes]);

  // Click Raycaster for Atom Inspection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !instancedMeshRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(instancedMeshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const idx = intersects[0].instanceId;
      const atomsList = instancedMeshRef.current.userData?.atomsList as AtomRecord[];
      if (atomsList && atomsList[idx]) {
        setSelectedAtom(atomsList[idx]);
      }
    } else {
      setSelectedAtom(null);
    }
  };

  const resetCamera = () => {
    if (!result || !controlsRef.current || !cameraRef.current) return;
    const { box } = result;
    const box3 = new THREE.Box3(
      new THREE.Vector3(box.x[0], box.y[0], box.z[0]),
      new THREE.Vector3(box.x[1], box.y[1], box.z[1])
    );
    const center = new THREE.Vector3();
    box3.getCenter(center);
    const size = new THREE.Vector3();
    box3.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    controlsRef.current.target.copy(center);
    cameraRef.current.position.set(center.x + maxDim * 1.3, center.y + maxDim * 0.9, center.z + maxDim * 1.4);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col">
      {/* Top Overlay Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 pointer-events-auto shadow-xl">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            Color:
          </span>
          <button
            type="button"
            onClick={() => setColorMode('material')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              colorMode === 'material'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Color each element distinctively (Cu, Ni, Fe, Graded)"
          >
            Elements
          </button>
          <button
            type="button"
            onClick={() => setColorMode('base_vs_graded')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              colorMode === 'base_vs_graded'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Highlight graded atoms against base matrix"
          >
            Base vs Graded
          </button>
          <button
            type="button"
            onClick={() => setColorMode('bin')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              colorMode === 'bin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Color by FGM bin spectrum"
          >
            Bins
          </button>
          <button
            type="button"
            onClick={() => setColorMode('axial')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              colorMode === 'axial'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Color by continuous axial depth"
          >
            Z-Gradient
          </button>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 pointer-events-auto shadow-xl">
          <button
            type="button"
            onClick={() => setSliceEnabled(!sliceEnabled)}
            className={`px-2 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              sliceEnabled ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Cut longitudinal half cross-section to reveal core structure"
          >
            <Scissors className="w-3.5 h-3.5" />
            {sliceEnabled ? 'Sliced' : 'Cross-Section'}
          </button>

          <button
            type="button"
            onClick={() => setShowBox(!showBox)}
            className={`p-1.5 text-xs rounded-md transition-colors ${
              showBox ? 'text-sky-400 bg-sky-950/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle simulation box wireframe"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowAxes(!showAxes)}
            className={`p-1.5 text-xs rounded-md transition-colors ${
              showAxes ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle XYZ axes gizmo"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={resetCamera}
            className="p-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
            title="Reset 3D camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slicing Slider Overlay (if slicing enabled) */}
      {sliceEnabled && (
        <div className="absolute top-16 left-3 z-10 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-lg border border-rose-500/40 shadow-xl flex items-center gap-3 text-xs text-slate-200">
          <Scissors className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Cut Plane:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={slicePosition}
            onChange={(e) => setSlicePosition(parseFloat(e.target.value))}
            className="w-32 accent-rose-500 cursor-pointer"
          />
          <span className="font-mono text-rose-300">{(slicePosition * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full block" />
      </div>

      {/* Bottom Element Legend Bar */}
      {result && (
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/80 shadow-xl flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Materials:
          </span>
          {result.compositionBreakdown.map((item) => (
            <div key={item.typeId} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-200">{item.name} ({item.symbol})</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {item.atomPercent.toFixed(1)}% ({item.count})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Atom Scale Slider Control (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xl flex items-center gap-2 text-xs text-slate-300">
        <span className="text-slate-400">Atom Size:</span>
        <input
          type="range"
          min="0.3"
          max="1.4"
          step="0.05"
          value={atomScale}
          onChange={(e) => setAtomScale(parseFloat(e.target.value))}
          className="w-20 accent-sky-500 cursor-pointer"
        />
        <span className="font-mono text-slate-400">{atomScale.toFixed(2)}x</span>
      </div>

      {/* Selected Atom Inspection Popup Card */}
      {selectedAtom && (
        <div className="absolute top-16 right-3 z-20 w-64 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-sky-500/50 shadow-2xl text-xs text-slate-200 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <Info className="w-4 h-4" />
              Atom #{selectedAtom.id}
            </div>
            <button
              type="button"
              onClick={() => setSelectedAtom(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Element:</span>
              <span className="font-semibold text-white">
                {selectedAtom.materialName} ({selectedAtom.symbol})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  selectedAtom.isGraded
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {selectedAtom.isGraded ? 'Graded Additive' : 'Base Alloy Matrix'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">LAMMPS Type:</span>
              <span className="font-mono text-sky-300">Type {selectedAtom.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">FGM Bin:</span>
              <span className="font-mono text-emerald-400">Bin #{selectedAtom.bin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Radial Dist (r):</span>
              <span className="font-mono">{selectedAtom.distFromAxis.toFixed(2)} Å</span>
            </div>
            <div className="pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Coordinates (x, y, z) Å:</span>
              <div className="font-mono bg-slate-950 p-1.5 rounded text-[11px] text-sky-200">
                x: {selectedAtom.x.toFixed(3)} Å<br />
                y: {selectedAtom.y.toFixed(3)} Å<br />
                z: {selectedAtom.z.toFixed(3)} Å
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
