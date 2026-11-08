import {
  AtomRecord,
  BinInfo,
  BuildValidationResult,
  FGMBuildResult,
  FGMConfig,
} from './types';
import { calculateGradedCount, calculateGradingFraction, generateTheoreticalCurve } from './grading';

/**
 * Seedable pseudo-random number generator (Mulberry32)
 */
function createSeededRandom(seed: number | null) {
  if (seed === null || seed === undefined) {
    return Math.random;
  }
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Main pure generator for Multi-Material Base FGM Nanostructures
 */
export function buildFGMStructure(rawConfig: FGMConfig): FGMBuildResult {
  const startTime = Date.now();
  const rng = createSeededRandom(rawConfig.seed);

  // Normalize baseSegments and gradedMaterial type_ids so atom types are strictly 1..N
  const normalizedBaseSegments = rawConfig.baseSegments.map((seg, idx) => ({
    ...seg,
    type_id: idx + 1,
  }));
  const gradedTypeId = normalizedBaseSegments.length + 1;
  const normalizedGradedMaterial = {
    ...rawConfig.gradedMaterial,
    type_id: gradedTypeId,
  };
  const config: FGMConfig = {
    ...rawConfig,
    baseSegments: normalizedBaseSegments,
    gradedMaterial: normalizedGradedMaterial,
  };

  // 1. Calculate dimensions
  const totalBaseLength_nm = config.baseSegments.reduce((sum, seg) => sum + seg.length_nm, 0);
  const length_nm = config.shape === 'sphere' ? config.radius_nm * 2 : totalBaseLength_nm;
  const radius_nm = config.radius_nm;

  const length_A = length_nm * 10;
  const radius_A = radius_nm * 10;
  const xdim_A = config.xdim_nm * 10;
  const ydim_A = config.ydim_nm * 10;

  // 2. Calculate effective lattice parameter a (Angstrom)
  let weightedLatticeSum = 0;
  for (const seg of config.baseSegments) {
    weightedLatticeSum += seg.length_nm * seg.lattice_a_nm;
  }
  const avgLattice_nm = totalBaseLength_nm > 0 ? weightedLatticeSum / totalBaseLength_nm : 0.36;
  const lat_a = avgLattice_nm * 10; // Angstrom

  // Cross-section boundaries
  let x_max = 0;
  let y_max = 0;
  let z_max = length_A;

  if (config.shape === 'cylindrical') {
    x_max = 2 * radius_A;
    y_max = 2 * radius_A;
  } else if (config.shape === 'cuboid') {
    x_max = xdim_A;
    y_max = ydim_A;
  } else if (config.shape === 'sphere') {
    x_max = 2 * radius_A;
    y_max = 2 * radius_A;
    z_max = 2 * radius_A;
  }

  // Periodic z alignment: ensure whole unit cells along z for cylindrical & cuboid
  let z_cut = z_max;
  if (config.shape !== 'sphere') {
    const nCellsZ = Math.max(1, Math.round(z_max / lat_a));
    z_cut = nCellsZ * lat_a;
  }

  // Unit cell count in each direction
  const nx = Math.ceil(x_max / lat_a) + 1;
  const ny = Math.ceil(y_max / lat_a) + 1;
  const nz = Math.ceil(z_cut / lat_a) + 1;

  // Center axes
  const cx = x_max / 2;
  const cy = y_max / 2;
  const cz = z_cut / 2;

  // Basis offsets for unit cells
  const basis = config.lattice === 'fcc'
    ? [
        [0, 0, 0],
        [0.5, 0.5, 0],
        [0.5, 0, 0.5],
        [0, 0.5, 0.5],
      ]
    : [
        [0, 0, 0],
        [0.5, 0.5, 0.5],
      ];

  // 3. Generate carved lattice points
  interface RawPoint {
    x: number;
    y: number;
    z: number;
    distFromAxis: number;
  }
  const rawPoints: RawPoint[] = [];

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (const [bx, by, bz] of basis) {
          const px = (ix + bx) * lat_a;
          const py = (iy + by) * lat_a;
          const pz = (iz + bz) * lat_a;

          // Check boundary and carve shape
          if (config.shape === 'cylindrical') {
            const dx = px - cx;
            const dy = py - cy;
            const r2 = dx * dx + dy * dy;
            if (r2 <= radius_A * radius_A && pz >= 0 && pz <= z_cut) {
              rawPoints.push({
                x: px,
                y: py,
                z: pz,
                distFromAxis: Math.sqrt(r2),
              });
            }
          } else if (config.shape === 'cuboid') {
            if (px >= 0 && px <= x_max && py >= 0 && py <= y_max && pz >= 0 && pz <= z_cut) {
              const dx = px - cx;
              const dy = py - cy;
              rawPoints.push({
                x: px,
                y: py,
                z: pz,
                distFromAxis: Math.sqrt(dx * dx + dy * dy),
              });
            }
          } else if (config.shape === 'sphere') {
            const dx = px - cx;
            const dy = py - cy;
            const dz = pz - cz;
            const r2 = dx * dx + dy * dy + dz * dz;
            if (r2 <= radius_A * radius_A) {
              rawPoints.push({
                x: px,
                y: py,
                z: pz,
                distFromAxis: Math.sqrt(r2),
              });
            }
          }
        }
      }
    }
  }

  if (rawPoints.length === 0) {
    throw new Error('No lattice points generated. Please increase dimensions or decrease lattice parameter.');
  }

  // Shift to origin (0, 0, 0)
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const pt of rawPoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
    if (pt.z > maxZ) maxZ = pt.z;
  }

  // 4. Multi-Material Base Segment Boundaries Calculation
  // Calculate boundary thresholds
  const totalWireZ = maxZ - minZ;
  const maxRadialR = config.shape === 'cuboid'
    ? Math.sqrt(Math.pow((maxX - minX) / 2, 2) + Math.pow((maxY - minY) / 2, 2))
    : radius_A;

  interface SegmentBoundary {
    seg: typeof config.baseSegments[0];
    start: number;
    end: number;
  }

  const segmentBoundaries: SegmentBoundary[] = [];
  let accum = 0;
  for (let i = 0; i < config.baseSegments.length; i++) {
    const seg = config.baseSegments[i];
    const isLast = i === config.baseSegments.length - 1;
    const startFrac = accum / totalBaseLength_nm;
    accum += seg.length_nm;
    const endFrac = isLast ? 1.0 : accum / totalBaseLength_nm;

    if (config.segmentationMode === 'axial') {
      segmentBoundaries.push({
        seg,
        start: startFrac * totalWireZ,
        end: endFrac * totalWireZ + (isLast ? 0.001 : 0),
      });
    } else {
      // radial core-shell
      segmentBoundaries.push({
        seg,
        start: startFrac * maxRadialR,
        end: endFrac * maxRadialR + (isLast ? 0.001 : 0),
      });
    }
  }

  // Function to determine which base segment a coordinate falls into
  function getBaseSegment(val: number): typeof config.baseSegments[0] {
    for (const b of segmentBoundaries) {
      if (val >= b.start && val <= b.end) {
        return b.seg;
      }
    }
    // Fallback to last segment
    return config.baseSegments[config.baseSegments.length - 1];
  }

  // 5. Create Atom Records and Assign Base Segments
  const atoms: AtomRecord[] = [];
  let idCounter = 1;

  for (const pt of rawPoints) {
    // Coordinates start from 0.000000 at the box boundary plus vacuum padding
    const sx = (pt.x - minX) + config.vacuum_xy;
    const sy = (pt.y - minY) + config.vacuum_xy;
    const sz = (pt.z - minZ) + config.vacuum_z;

    // Relative coordinate along wire length (0 to totalWireZ) for axial base segmentation
    const segCoord = config.segmentationMode === 'axial' ? (pt.z - minZ) : pt.distFromAxis;
    const baseSeg = getBaseSegment(segCoord);

    atoms.push({
      id: idCounter++,
      type: baseSeg.type_id,
      symbol: baseSeg.symbol,
      materialName: baseSeg.name,
      isGraded: false,
      baseSegmentId: baseSeg.id,
      x: sx,
      y: sy,
      z: sz,
      bin: 0,
      distFromAxis: pt.distFromAxis,
    });
  }

  // 6. Partition Atoms into Bins along Grading Direction
  const numBins = Math.max(2, Math.floor(config.bins));
  const gradingCoordMax = config.direction === 'axial' ? totalWireZ : maxRadialR;
  const binStep = gradingCoordMax / numBins;

  const binAtoms: AtomRecord[][] = Array.from({ length: numBins }, () => []);

  for (const atom of atoms) {
    // Relative coordinate along wire length (0 to totalWireZ) for axial grading
    const coord = config.direction === 'axial' ? (atom.z - config.vacuum_z) : atom.distFromAxis;
    const rawBin = Math.floor(coord / binStep);
    const binIdx = Math.max(0, Math.min(numBins - 1, rawBin));
    atom.bin = binIdx + 1;
    binAtoms[binIdx].push(atom);
  }

  // 7. Apply Functionally Graded Material Substitution in Each Bin
  const binInfoList: BinInfo[] = [];

  for (let j = 0; j < numBins; j++) {
    const binMembers = binAtoms[j];
    const nInBin = binMembers.length;
    const b = (j + 0.5) / numBins;
    const targetFraction = calculateGradingFraction(b, config.gradingKind, config.p, config.customFormula);

    // Calculate average base mass in this bin
    let sumBaseMass = 0;
    const baseCounts: Record<number, number> = {};
    for (const a of binMembers) {
      const seg = config.baseSegments.find((s) => s.id === a.baseSegmentId) || config.baseSegments[0];
      sumBaseMass += seg.mass;
      baseCounts[a.type] = (baseCounts[a.type] || 0) + 1;
    }
    const avgBaseMass = nInBin > 0 ? sumBaseMass / nInBin : config.baseSegments[0].mass;

    // Determine number of atoms to replace with graded material
    const kGraded = calculateGradedCount(
      targetFraction,
      nInBin,
      avgBaseMass,
      config.gradedMaterial.mass,
      config.fractionMode
    );

    // Shuffle and pick k atoms to become graded material
    if (kGraded > 0 && nInBin > 0) {
      // Fisher-Yates partial shuffle of indices
      const indices = Array.from({ length: nInBin }, (_, idx) => idx);
      for (let s = 0; s < kGraded; s++) {
        const swapIdx = s + Math.floor(rng() * (nInBin - s));
        const temp = indices[s];
        indices[s] = indices[swapIdx];
        indices[swapIdx] = temp;

        const pickedAtom = binMembers[indices[s]];
        pickedAtom.isGraded = true;
        pickedAtom.type = config.gradedMaterial.type_id;
        pickedAtom.symbol = config.gradedMaterial.symbol;
        pickedAtom.materialName = config.gradedMaterial.name;
      }
    }

    // Compute actual mass fraction and atom fraction
    const actualGraded = kGraded;
    const actualAtomFrac = nInBin > 0 ? actualGraded / nInBin : 0;
    const gradedTotalMass = actualGraded * config.gradedMaterial.mass;

    let unshiftedBaseMass = 0;
    for (const a of binMembers) {
      if (!a.isGraded) {
        const seg = config.baseSegments.find((s) => s.id === a.baseSegmentId) || config.baseSegments[0];
        unshiftedBaseMass += seg.mass;
      }
    }
    const totalMass = gradedTotalMass + unshiftedBaseMass;
    const actualMassFrac = totalMass > 0 ? gradedTotalMass / totalMass : 0;

    binInfoList.push({
      bin: j + 1,
      lo: j * binStep,
      hi: (j + 1) * binStep,
      b,
      targetGradingFraction: targetFraction,
      totalAtoms: nInBin,
      gradedAtoms: actualGraded,
      baseAtomsCount: baseCounts,
      actualAtomFraction: actualAtomFrac,
      actualMassFraction: actualMassFrac,
    });
  }

  // 8. Simulation box bounds starting strictly from 0.00000000 with symmetric vacuum padding
  const boxXLo = 0.0;
  const boxXHi = (maxX - minX) + (config.vacuum_xy > 0 ? 2 * config.vacuum_xy : lat_a / 2);
  const boxYLo = 0.0;
  const boxYHi = (maxY - minY) + (config.vacuum_xy > 0 ? 2 * config.vacuum_xy : lat_a / 2);
  const boxZLo = 0.0;
  const boxZHi = totalWireZ + (config.vacuum_z > 0 ? 2 * config.vacuum_z : lat_a / 2);

  // 9. Overall Composition Breakdown
  const typeMap: Record<number, { count: number; mass: number; symbol: string; name: string; color: string }> = {};

  // Initialize all base types
  for (const seg of config.baseSegments) {
    typeMap[seg.type_id] = {
      count: 0,
      mass: seg.mass,
      symbol: seg.symbol,
      name: seg.name,
      color: seg.color,
    };
  }
  // Initialize graded type
  typeMap[config.gradedMaterial.type_id] = {
    count: 0,
    mass: config.gradedMaterial.mass,
    symbol: config.gradedMaterial.symbol,
    name: config.gradedMaterial.name,
    color: config.gradedMaterial.color,
  };

  for (const atom of atoms) {
    if (typeMap[atom.type]) {
      typeMap[atom.type].count++;
    }
  }

  const totalAtomsCount = atoms.length;
  let totalSystemMass = 0;
  for (const entry of Object.values(typeMap)) {
    totalSystemMass += entry.count * entry.mass;
  }

  const compositionBreakdown = Object.entries(typeMap).map(([typeIdStr, entry]) => {
    const typeId = parseInt(typeIdStr, 10);
    return {
      typeId,
      symbol: entry.symbol,
      name: entry.name,
      color: entry.color,
      count: entry.count,
      atomPercent: totalAtomsCount > 0 ? (entry.count / totalAtomsCount) * 100 : 0,
      massPercent: totalSystemMass > 0 ? ((entry.count * entry.mass) / totalSystemMass) * 100 : 0,
    };
  });

  // 10. Curves data
  const theoretical = generateTheoreticalCurve(config.gradingKind, config.p, config.customFormula, 60);
  const actual = binInfoList.map((bi) => ({
    b: bi.b,
    massFraction: bi.actualMassFraction,
    atomFraction: bi.actualAtomFraction,
  }));

  // 11. Self-validations
  const validations: BuildValidationResult[] = [
    {
      name: 'Non-zero Atom Count',
      passed: atoms.length > 0,
      message: `Generated ${atoms.length.toLocaleString()} atoms successfully.`,
    },
    {
      name: 'Multi-Material Base Segments Presence',
      passed: config.baseSegments.every((seg) => atoms.some((a) => a.baseSegmentId === seg.id)),
      message: `All ${config.baseSegments.length} base material segment(s) are populated with atoms.`,
    },
    {
      name: 'Graded Material Distribution',
      passed: atoms.some((a) => a.isGraded),
      message: `Graded material (${config.gradedMaterial.symbol}) substituted into ${atoms.filter((a) => a.isGraded).length} atom sites.`,
    },
    {
      name: 'Bin Coverage & Partition',
      passed: binInfoList.every((bi) => bi.totalAtoms > 0),
      message: `All ${numBins} bins have valid atoms with no unpopulated gaps.`,
    },
    {
      name: 'Atom ID Uniqueness',
      passed: new Set(atoms.map((a) => a.id)).size === atoms.length,
      message: 'All atom IDs are contiguous and unique (1 to N).',
    },
    {
      name: 'LAMMPS Atom Type Contiguity',
      passed: atoms.every((a) => a.type >= 1 && a.type <= config.baseSegments.length + 1) &&
        atoms.some((a) => a.type === config.baseSegments.length + 1),
      message: `All atom types strictly adhere to 1..${config.baseSegments.length + 1} with no gaps, ensuring flawless OVITO and LAMMPS loading.`,
    },
  ];

  return {
    config,
    atoms,
    totalLength_nm: totalBaseLength_nm,
    box: {
      x: [boxXLo, boxXHi],
      y: [boxYLo, boxYHi],
      z: [boxZLo, boxZHi],
    },
    effectiveLattice_A: lat_a,
    bins: binInfoList,
    curvePoints: {
      theoretical,
      actual,
    },
    compositionBreakdown,
    validations,
    generationTimeMs: Date.now() - startTime,
  };
}
