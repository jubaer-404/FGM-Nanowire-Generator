import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGradingFraction, calculateGradedCount } from './grading';
import { buildFGMStructure } from './generator';
import { generateLAMMPSData } from './lammps';
import { FGMConfig } from './types';

test('Grading math: power law produces expected bounds and values', () => {
  assert.equal(calculateGradingFraction(0, 'power', 1.0), 0);
  assert.equal(calculateGradingFraction(1, 'power', 1.0), 1);
  assert.equal(calculateGradingFraction(0.5, 'power', 2.0), 0.25);
  assert.equal(calculateGradingFraction(0.5, 'linear', 1.0), 0.5);
});

test('Grading math: sigmoid function is symmetric around 0.5 for p=1', () => {
  const atZero = calculateGradingFraction(0, 'sigmoid', 1.0);
  const atMid = calculateGradingFraction(0.5, 'sigmoid', 1.0);
  const atOne = calculateGradingFraction(1, 'sigmoid', 1.0);
  assert.equal(atZero, 0);
  assert.equal(atMid, 0.5);
  assert.equal(atOne, 1.0);
});

test('Grading math: custom formula evaluation works safely', () => {
  const val = calculateGradingFraction(0.5, 'custom', 1.0, 'x^2');
  assert.equal(val, 0.25);

  const fallback = calculateGradingFraction(0.5, 'custom', 1.0, 'syntax error !@#');
  assert.ok(fallback >= 0 && fallback <= 1);
});

test('Graded count calculation for atom and mass fraction', () => {
  // 100 atoms, 20% atom fraction -> 20 atoms
  const countAtom = calculateGradedCount(0.2, 100, 60, 60, 'atom');
  assert.equal(countAtom, 20);

  // 100 atoms, 0% -> 0 atoms
  assert.equal(calculateGradedCount(0, 100, 60, 196, 'mass'), 0);
  // 100 atoms, 100% -> 100 atoms
  assert.equal(calculateGradedCount(1.0, 100, 60, 196, 'mass'), 100);
});

test('Multi-Material Base FGM Generator: generates multi-material base (Cu, Ni, Fe) with graded Au', () => {
  const config: FGMConfig = {
    shape: 'cylindrical',
    radius_nm: 1.0,
    xdim_nm: 1.5,
    ydim_nm: 1.5,
    lattice: 'fcc',
    segmentationMode: 'axial',
    baseSegments: [
      {
        id: 'seg-1',
        name: 'Copper',
        symbol: 'Cu',
        length_nm: 1.0,
        mass: 63.546,
        lattice_a_nm: 0.3615,
        type_id: 1,
        color: '#c27847',
      },
      {
        id: 'seg-2',
        name: 'Nickel',
        symbol: 'Ni',
        length_nm: 1.0,
        mass: 58.693,
        lattice_a_nm: 0.3524,
        type_id: 2,
        color: '#8a9ea7',
      },
      {
        id: 'seg-3',
        name: 'Iron',
        symbol: 'Fe',
        length_nm: 1.0,
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
    p: 1.0,
    customFormula: '',
    bins: 6,
    fractionMode: 'atom',
    seed: 42,
    vacuum_xy: 2.0,
    vacuum_z: 0.0,
  };

  const result = buildFGMStructure(config);

  // 1. Check atoms count
  assert.ok(result.atoms.length > 50, `Expected > 50 atoms, got ${result.atoms.length}`);

  // 2. Check all base segments are represented in the structure
  const cuAtoms = result.atoms.filter((a) => a.baseSegmentId === 'seg-1');
  const niAtoms = result.atoms.filter((a) => a.baseSegmentId === 'seg-2');
  const feAtoms = result.atoms.filter((a) => a.baseSegmentId === 'seg-3');

  assert.ok(cuAtoms.length > 0, 'Copper base segment has atoms');
  assert.ok(niAtoms.length > 0, 'Nickel base segment has atoms');
  assert.ok(feAtoms.length > 0, 'Iron base segment has atoms');

  // 3. Check graded material substitution
  const gradedAtoms = result.atoms.filter((a) => a.isGraded && a.type === 4);
  assert.ok(gradedAtoms.length > 0, 'Graded Au atoms were successfully introduced');

  // 4. Check axial distribution trend (bin 1 has fewer graded atoms than last bin for p=1 power)
  const firstBinGraded = result.bins[0].gradedAtoms / Math.max(1, result.bins[0].totalAtoms);
  const lastBinGraded = result.bins[result.bins.length - 1].gradedAtoms / Math.max(1, result.bins[result.bins.length - 1].totalAtoms);
  assert.ok(lastBinGraded >= firstBinGraded, `Grading trend: last bin (${lastBinGraded}) >= first bin (${firstBinGraded})`);

  // 5. Check validations all pass
  assert.ok(result.validations.every((v) => v.passed), 'All structural validation tests passed');
});

test('Single Base Material FGM: Cu base is type 1 and Ni graded is type 2 (2 atom types strictly for OVITO)', () => {
  // Intentionally pass an arbitrary/stale type_id (e.g. type_id: 4) to ensure generator normalizes it to 2!
  const config: FGMConfig = {
    shape: 'cylindrical',
    radius_nm: 1.2,
    xdim_nm: 2.0,
    ydim_nm: 2.0,
    lattice: 'fcc',
    segmentationMode: 'axial',
    baseSegments: [
      {
        id: 'seg-cu',
        name: 'Copper',
        symbol: 'Cu',
        length_nm: 3.0,
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
      type_id: 4, // Intentionally dirty type_id from previous preset
      color: '#8a9ea7',
    },
    direction: 'axial',
    gradingKind: 'power',
    p: 1.0,
    customFormula: '',
    bins: 8,
    fractionMode: 'atom',
    seed: 123,
    vacuum_xy: 3.0,
    vacuum_z: 0.0,
  };

  const result = buildFGMStructure(config);

  // Must have exactly 2 atom types configured
  assert.equal(result.config.baseSegments.length, 1);
  assert.equal(result.config.baseSegments[0].type_id, 1, 'Cu base must be type 1');
  assert.equal(result.config.gradedMaterial.type_id, 2, 'Ni graded must be type 2 (NOT 4!)');

  // Verify atom records: ALL atoms must have type 1 (Cu) or type 2 (Ni)
  for (const atom of result.atoms) {
    assert.ok(atom.type === 1 || atom.type === 2, `Atom ${atom.id} has invalid type ${atom.type}. Expected 1 or 2.`);
    if (atom.isGraded) {
      assert.equal(atom.type, 2, 'Graded atom must be type 2');
      assert.equal(atom.symbol, 'Ni');
    } else {
      assert.equal(atom.type, 1, 'Base atom must be type 1');
      assert.equal(atom.symbol, 'Cu');
    }
  }

  // Generate LAMMPS data text and verify syntax
  const lammpsText = generateLAMMPSData(result);
  assert.match(lammpsText, /2 atom types/, 'LAMMPS file must specify 2 atom types');
  assert.match(lammpsText, /1\s+63\.546000\s+#\s+Cu/, 'Masses must define type 1 as Cu');
  assert.match(lammpsText, /2\s+58\.693000\s+#\s+Ni/, 'Masses must define type 2 as Ni');
  assert.doesNotMatch(lammpsText, /^\s*4\s+58\.693000/m, 'Masses must NOT have type 4');
  assert.doesNotMatch(lammpsText, /^\d+\s+4\s+[-0-9.]+/m, 'Atoms must NOT contain type 4 in second column');
});

test('LAMMPS simulation box bounds: xlo, ylo, and zlo start strictly from 0.00000000', () => {
  const config: FGMConfig = {
    shape: 'cylindrical',
    radius_nm: 2.0,
    xdim_nm: 2.0,
    ydim_nm: 2.0,
    lattice: 'fcc',
    segmentationMode: 'axial',
    baseSegments: [
      {
        id: 'seg-1',
        name: 'Copper',
        symbol: 'Cu',
        length_nm: 5.0,
        mass: 63.546,
        lattice_a_nm: 0.3615,
        type_id: 1,
        color: '#c27847',
      },
      {
        id: 'seg-2',
        name: 'Nickel',
        symbol: 'Ni',
        length_nm: 5.0,
        mass: 58.693,
        lattice_a_nm: 0.3524,
        type_id: 2,
        color: '#8a9ea7',
      },
    ],
    gradedMaterial: {
      name: 'Iron',
      symbol: 'Fe',
      mass: 55.845,
      lattice_a_nm: 0.3580,
      type_id: 3,
      color: '#5c6b73',
    },
    direction: 'axial',
    gradingKind: 'power',
    p: 1.5,
    customFormula: '',
    bins: 8,
    fractionMode: 'atom',
    seed: 999,
    vacuum_xy: 5.0, // User specifically mentioned -5.000 before
    vacuum_z: 0.0,
  };

  const result = buildFGMStructure(config);

  // Box bounds must start strictly at 0.00000000
  assert.equal(result.box.x[0], 0, 'box.x[0] (xlo) must start at 0.0');
  assert.equal(result.box.y[0], 0, 'box.y[0] (ylo) must start at 0.0');
  assert.equal(result.box.z[0], 0, 'box.z[0] (zlo) must start at 0.0');

  // Verify all atom coordinates are strictly non-negative and within box bounds
  for (const a of result.atoms) {
    assert.ok(a.x >= result.box.x[0] && a.x <= result.box.x[1], `Atom x (${a.x}) must be within [xlo, xhi]`);
    assert.ok(a.y >= result.box.y[0] && a.y <= result.box.y[1], `Atom y (${a.y}) must be within [ylo, yhi]`);
    assert.ok(a.z >= result.box.z[0] && a.z <= result.box.z[1], `Atom z (${a.z}) must be within [zlo, zhi]`);
  }

  // Check formatted LAMMPS data string
  const lammpsText = generateLAMMPSData(result);
  assert.match(lammpsText, /0\.00000000\s+\d+\.\d+\s+xlo\s+xhi/, 'xlo must be 0.00000000');
  assert.match(lammpsText, /0\.00000000\s+\d+\.\d+\s+ylo\s+yhi/, 'ylo must be 0.00000000');
  assert.match(lammpsText, /0\.00000000\s+\d+\.\d+\s+zlo\s+zhi/, 'zlo must be 0.00000000');
});


