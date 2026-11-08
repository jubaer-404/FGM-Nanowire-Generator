import { BaseSegment, FGMConfig, GradedMaterial } from './types';

export interface ElementData {
  symbol: string;
  name: string;
  mass: number;         // amu
  fcc_a_nm: number;     // nm
  bcc_a_nm: number;     // nm
  defaultColor: string;
  category: string;
}

export const ELEMENT_LIBRARY: Record<string, ElementData> = {
  Cu: {
    symbol: 'Cu',
    name: 'Copper',
    mass: 63.546,
    fcc_a_nm: 0.3615,
    bcc_a_nm: 0.288,
    defaultColor: '#c27847', // Copper warm
    category: 'Transition Metal',
  },
  Ni: {
    symbol: 'Ni',
    name: 'Nickel',
    mass: 58.693,
    fcc_a_nm: 0.3524,
    bcc_a_nm: 0.288,
    defaultColor: '#8a9ea7', // Nickel silver sheen
    category: 'Transition Metal',
  },
  Fe: {
    symbol: 'Fe',
    name: 'Iron',
    mass: 55.845,
    fcc_a_nm: 0.3580,
    bcc_a_nm: 0.2866,
    defaultColor: '#5c6b73', // Steel slate
    category: 'Transition Metal',
  },
  Al: {
    symbol: 'Al',
    name: 'Aluminum',
    mass: 26.982,
    fcc_a_nm: 0.4049,
    bcc_a_nm: 0.330,
    defaultColor: '#a0aec0', // Silver
    category: 'Post-transition Metal',
  },
  Ti: {
    symbol: 'Ti',
    name: 'Titanium',
    mass: 47.867,
    fcc_a_nm: 0.410,
    bcc_a_nm: 0.332,
    defaultColor: '#718096', // Titanium grey
    category: 'Transition Metal',
  },
  Au: {
    symbol: 'Au',
    name: 'Gold',
    mass: 196.967,
    fcc_a_nm: 0.4078,
    bcc_a_nm: 0.330,
    defaultColor: '#eab308', // Gold yellow
    category: 'Noble Metal',
  },
  Ag: {
    symbol: 'Ag',
    name: 'Silver',
    mass: 107.868,
    fcc_a_nm: 0.4085,
    bcc_a_nm: 0.330,
    defaultColor: '#cbd5e1', // Bright silver
    category: 'Noble Metal',
  },
  Pt: {
    symbol: 'Pt',
    name: 'Platinum',
    mass: 195.084,
    fcc_a_nm: 0.3924,
    bcc_a_nm: 0.320,
    defaultColor: '#94a3b8', // Platinum cool
    category: 'Noble Metal',
  },
  Co: {
    symbol: 'Co',
    name: 'Cobalt',
    mass: 58.933,
    fcc_a_nm: 0.3548,
    bcc_a_nm: 0.282,
    defaultColor: '#3b82f6', // Cobalt blue tint
    category: 'Transition Metal',
  },
  Cr: {
    symbol: 'Cr',
    name: 'Chromium',
    mass: 51.996,
    fcc_a_nm: 0.368,
    bcc_a_nm: 0.2884,
    defaultColor: '#64748b', // Chrome
    category: 'Transition Metal',
  },
  W: {
    symbol: 'W',
    name: 'Tungsten',
    mass: 183.84,
    fcc_a_nm: 0.402,
    bcc_a_nm: 0.3165,
    defaultColor: '#475569', // Tungsten
    category: 'Refractory Metal',
  },
  Mo: {
    symbol: 'Mo',
    name: 'Molybdenum',
    mass: 95.95,
    fcc_a_nm: 0.395,
    bcc_a_nm: 0.3147,
    defaultColor: '#52525b', // Moly
    category: 'Refractory Metal',
  },
};

export interface PresetConfiguration {
  id: string;
  name: string;
  description: string;
  config: FGMConfig;
}

export const PRESET_CONFIGURATIONS: PresetConfiguration[] = [
  {
    id: 'single-cu-ni',
    name: 'Single Base Cu + Ni Graded (2-Material FGM)',
    description: 'Single material Copper base with functionally graded Nickel (Ni). Exactly 2 atom types (Type 1: Cu, Type 2: Ni) for full OVITO compatibility.',
    config: {
      shape: 'cylindrical',
      radius_nm: 1.8,
      xdim_nm: 2.0,
      ydim_nm: 2.0,
      lattice: 'fcc',
      segmentationMode: 'axial',
      baseSegments: [
        {
          id: 'seg-cu',
          name: 'Copper',
          symbol: 'Cu',
          length_nm: 8.0,
          mass: 63.546,
          lattice_a_nm: 0.3615,
          type_id: 1,
          color: '#c27847',
        },
      ],
      gradedMaterial: {
        name: 'Nickel',
        symbol: 'Ni',
        mass: 58.693,
        lattice_a_nm: 0.3524,
        type_id: 2,
        color: '#8a9ea7',
      },
      direction: 'axial',
      gradingKind: 'power',
      p: 1.0,
      customFormula: '',
      bins: 10,
      fractionMode: 'atom',
      seed: 42,
      vacuum_xy: 5.0,
      vacuum_z: 0.0,
    },
  },
  {
    id: 'cu-ni-fe-au',
    name: 'Cu - Ni - Fe Trimetallic Base + Au Graded',
    description: '3-segment multi-material base (Copper 2.5 nm, Nickel 3.0 nm, Iron 2.5 nm) with axial Power-law functionally graded Gold (Au).',
    config: {
      shape: 'cylindrical',
      radius_nm: 1.8,
      xdim_nm: 2.0,
      ydim_nm: 2.0,
      lattice: 'fcc',
      segmentationMode: 'axial',
      baseSegments: [
        {
          id: 'seg-1',
          name: 'Copper',
          symbol: 'Cu',
          length_nm: 2.5,
          mass: 63.546,
          lattice_a_nm: 0.3615,
          type_id: 1,
          color: '#c27847',
        },
        {
          id: 'seg-2',
          name: 'Nickel',
          symbol: 'Ni',
          length_nm: 3.0,
          mass: 58.693,
          lattice_a_nm: 0.3524,
          type_id: 2,
          color: '#8a9ea7',
        },
        {
          id: 'seg-3',
          name: 'Iron',
          symbol: 'Fe',
          length_nm: 2.5,
          mass: 55.845,
          lattice_a_nm: 0.3580,
          type_id: 3,
          color: '#5c6b73',
        },
      ],
      gradedMaterial: {
        name: 'Gold',
        symbol: 'Au',
        mass: 196.967,
        lattice_a_nm: 0.4078,
        type_id: 4,
        color: '#eab308',
      },
      direction: 'axial',
      gradingKind: 'power',
      p: 1.5,
      customFormula: '',
      bins: 12,
      fractionMode: 'atom',
      seed: 42,
      vacuum_xy: 5.0,
      vacuum_z: 0.0,
    },
  },
  {
    id: 'cu-ni-al-radial',
    name: 'Radial Core-Shell Cu-Ni Base + Al Graded',
    description: 'Bimetallic core-shell base (Cu core 1.0 nm, Ni shell 1.0 nm) with radially graded Aluminum (Al) moving towards the surface.',
    config: {
      shape: 'cylindrical',
      radius_nm: 2.0,
      xdim_nm: 2.0,
      ydim_nm: 2.0,
      lattice: 'fcc',
      segmentationMode: 'radial',
      baseSegments: [
        {
          id: 'seg-1',
          name: 'Copper Core',
          symbol: 'Cu',
          length_nm: 1.0, // inner radius
          mass: 63.546,
          lattice_a_nm: 0.3615,
          type_id: 1,
          color: '#c27847',
        },
        {
          id: 'seg-2',
          name: 'Nickel Shell',
          symbol: 'Ni',
          length_nm: 1.0, // shell thickness
          mass: 58.693,
          lattice_a_nm: 0.3524,
          type_id: 2,
          color: '#8a9ea7',
        },
      ],
      gradedMaterial: {
        name: 'Aluminum',
        symbol: 'Al',
        mass: 26.982,
        lattice_a_nm: 0.4049,
        type_id: 3,
        color: '#38bdf8',
      },
      direction: 'radial',
      gradingKind: 'sigmoid',
      p: 2.0,
      customFormula: '',
      bins: 10,
      fractionMode: 'mass',
      seed: 123,
      vacuum_xy: 4.0,
      vacuum_z: 0.0,
    },
  },
  {
    id: 'cuboid-ti-al-pt',
    name: 'Cuboid Ti-Al Dual Base + Pt Graded (E-FGM)',
    description: 'Cuboid nanobar with segmented Ti (3.0 nm) and Al (4.0 nm) base, with exponential grading (E-FGM) of catalytic Platinum.',
    config: {
      shape: 'cuboid',
      radius_nm: 1.5,
      xdim_nm: 2.2,
      ydim_nm: 2.2,
      lattice: 'fcc',
      segmentationMode: 'axial',
      baseSegments: [
        {
          id: 'seg-1',
          name: 'Titanium',
          symbol: 'Ti',
          length_nm: 3.0,
          mass: 47.867,
          lattice_a_nm: 0.365,
          type_id: 1,
          color: '#718096',
        },
        {
          id: 'seg-2',
          name: 'Aluminum',
          symbol: 'Al',
          length_nm: 4.0,
          mass: 26.982,
          lattice_a_nm: 0.4049,
          type_id: 2,
          color: '#93c5fd',
        },
      ],
      gradedMaterial: {
        name: 'Platinum',
        symbol: 'Pt',
        mass: 195.084,
        lattice_a_nm: 0.3924,
        type_id: 3,
        color: '#ec4899',
      },
      direction: 'axial',
      gradingKind: 'exp',
      p: 1.2,
      customFormula: '',
      bins: 14,
      fractionMode: 'atom',
      seed: 777,
      vacuum_xy: 6.0,
      vacuum_z: 0.0,
    },
  },
];
