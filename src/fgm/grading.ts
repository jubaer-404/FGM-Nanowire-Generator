import { GradingKind } from './types';

/**
 * Calculates grading fraction x in [0, 1] for normalized position b in [0, 1]
 */
export function calculateGradingFraction(
  b: number,
  kind: GradingKind,
  p: number,
  customFormula = ''
): number {
  const normB = Math.max(0, Math.min(1, b));

  let x = 0;
  switch (kind) {
    case 'power':
      x = Math.pow(normB, p);
      break;

    case 'exp':
      x = 1.0 - Math.exp(-Math.pow(normB, p));
      break;

    case 'sigmoid':
      if (normB <= 0.5) {
        x = 0.5 * Math.pow(2 * normB, p);
      } else {
        x = 1.0 - 0.5 * Math.pow(2 * (1.0 - normB), p);
      }
      break;

    case 'linear':
      x = normB;
      break;

    case 'custom':
      if (!customFormula.trim()) {
        x = normB;
      } else {
        try {
          // Normalize expression: replace ^ with **
          let expr = customFormula
            .replace(/\.\^/g, '**')
            .replace(/\^/g, '**')
            .replace(/\.\*/g, '*')
            .replace(/\.\//g, '/');

          // Allowed mathematical function replacements
          expr = expr
            .replace(/\bsin\b/g, 'Math.sin')
            .replace(/\bcos\b/g, 'Math.cos')
            .replace(/\btan\b/g, 'Math.tan')
            .replace(/\bexp\b/g, 'Math.exp')
            .replace(/\blog\b/g, 'Math.log')
            .replace(/\bsqrt\b/g, 'Math.sqrt')
            .replace(/\babs\b/g, 'Math.abs')
            .replace(/\bpi\b/gi, 'Math.PI');

          // Safely evaluate f(x) where x = normB
          const fn = new Function('x', 'b', `return (${expr});`);
          const val = fn(normB, normB);
          x = typeof val === 'number' && !isNaN(val) ? val : 0;
        } catch {
          x = normB;
        }
      }
      break;

    default:
      x = normB;
  }

  if (isNaN(x) || !isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

/**
 * Converts mass or atom fraction x into count of graded atoms among nAtoms
 */
export function calculateGradedCount(
  targetFraction: number,
  nAtoms: number,
  avgBaseMass: number,
  gradedMass: number,
  mode: 'mass' | 'atom'
): number {
  if (nAtoms <= 0) return 0;
  if (targetFraction <= 0) return 0;
  if (targetFraction >= 1) return nAtoms;

  let atomRatio = targetFraction;
  if (mode === 'mass') {
    const term1 = targetFraction / gradedMass;
    const term2 = (1.0 - targetFraction) / Math.max(1e-4, avgBaseMass);
    atomRatio = term1 / (term1 + term2);
  }

  // Round half up (as MATLAB/nanoHUB round)
  const count = Math.floor(atomRatio * nAtoms + 0.5);
  return Math.max(0, Math.min(nAtoms, count));
}

/**
 * Generate theoretical curve points for plotting
 */
export function generateTheoreticalCurve(
  kind: GradingKind,
  p: number,
  customFormula: string,
  samples = 100
): { b: number; fraction: number }[] {
  const points: { b: number; fraction: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const b = i / samples;
    points.push({
      b,
      fraction: calculateGradingFraction(b, kind, p, customFormula),
    });
  }
  return points;
}
