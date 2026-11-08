export type CrystalLattice = 'fcc' | 'bcc';
export type NanostructureShape = 'cylindrical' | 'cuboid' | 'sphere';
export type GradingDirection = 'axial' | 'radial';
export type GradingKind = 'power' | 'exp' | 'sigmoid' | 'linear' | 'custom';
export type FractionMode = 'mass' | 'atom';
export type SegmentationMode = 'axial' | 'radial';

export interface BaseSegment {
  id: string;
  name: string;
  symbol: string;
  length_nm: number; // in axial mode, length in nm; in radial mode, thickness in nm
  mass: number;      // amu
  lattice_a_nm: number; // nm
  type_id: number;   // LAMMPS atom type index (e.g. 1, 2, 3...)
  color: string;     // Hex color
}

export interface GradedMaterial {
  name: string;
  symbol: string;
  mass: number;
  lattice_a_nm: number;
  type_id: number;
  color: string;
}

export interface FGMConfig {
  shape: NanostructureShape;
  radius_nm: number;
  xdim_nm: number;
  ydim_nm: number;
  lattice: CrystalLattice;
  segmentationMode: SegmentationMode;
  baseSegments: BaseSegment[];
  gradedMaterial: GradedMaterial;
  direction: GradingDirection;
  gradingKind: GradingKind;
  p: number;
  customFormula: string;
  bins: number;
  fractionMode: FractionMode;
  seed: number | null;
  vacuum_xy: number; // Angstrom
  vacuum_z: number;  // Angstrom
}

export interface AtomRecord {
  id: number;
  type: number;
  symbol: string;
  materialName: string;
  isGraded: boolean;
  baseSegmentId: string;
  x: number; // Angstrom
  y: number; // Angstrom
  z: number; // Angstrom
  bin: number;
  distFromAxis: number;
}

export interface BinInfo {
  bin: number;
  lo: number; // Angstrom
  hi: number; // Angstrom
  b: number;  // Normalized coordinate 0..1
  targetGradingFraction: number; // x(b)
  totalAtoms: number;
  gradedAtoms: number;
  baseAtomsCount: Record<number, number>; // type_id -> count
  actualAtomFraction: number;
  actualMassFraction: number;
}

export interface BuildValidationResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface FGMBuildResult {
  config: FGMConfig;
  atoms: AtomRecord[];
  totalLength_nm: number;
  box: {
    x: [number, number];
    y: [number, number];
    z: [number, number];
  };
  effectiveLattice_A: number;
  bins: BinInfo[];
  curvePoints: {
    theoretical: { b: number; fraction: number }[];
    actual: { b: number; massFraction: number; atomFraction: number }[];
  };
  compositionBreakdown: {
    typeId: number;
    symbol: string;
    name: string;
    color: string;
    count: number;
    atomPercent: number;
    massPercent: number;
  }[];
  validations: BuildValidationResult[];
  generationTimeMs: number;
}
