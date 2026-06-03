/**
 * Desmos Graphing Calculator embed config (SAT-style full feature set).
 * @see https://www.desmos.com/api/v1.12/docs/index.html
 *
 * Note: The desmos.com "Untitled Graph" / Save / login bar is NOT part of the
 * public API — it is cloud UI on desmos.com only. We replicate that bar in
 * DesmosCalculatorPanel (local save via getState/setState).
 */

export const DESMOS_API_VERSION = "v1.12";

/** Public demo key; replace via NEXT_PUBLIC_DESMOS_API_KEY for production. */
export const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY?.trim() ||
  "dcb31709b452b1cf9dc26972add0fda6";

export function getDesmosScriptUrl(): string {
  return `https://www.desmos.com/api/${DESMOS_API_VERSION}/calculator.js?apiKey=${encodeURIComponent(DESMOS_API_KEY)}`;
}

/** Minimum width so expressions list stays beside graph (Desmos breakpoint ~450px). */
export const DESMOS_MIN_W = 460;
export const DESMOS_MIN_H = 320;
export const DESMOS_MAX_W = 960;
export const DESMOS_MAX_H = 720;
export const DESMOS_DEFAULT_W = 520;
export const DESMOS_DEFAULT_H = 480;

/**
 * Full graphing calculator options for SAT Math practice.
 * Explicitly enables features that default to true but may be limited by API key / layout.
 */
export const DESMOS_GRAPHING_OPTIONS: Record<string, boolean | string> = {
  keypad: true,
  graphpaper: true,
  expressions: true,
  settingsMenu: true,
  zoomButtons: true,
  expressionsTopbar: true,
  expressionsCollapsed: false,
  pointsOfInterest: true,
  trace: true,
  sliders: true,
  folders: true,
  notes: true,
  images: true,
  links: true,
  qwertyKeyboard: true,
  distributions: true,
  plotInequalities: true,
  plotSingleVariableImplicitEquations: true,
  restrictedFunctions: false,
  forceEnableGeometryFunctions: true,
  pasteTableData: true,
  pasteGraphLink: false,
  zoomFit: true,
  /** Table row sidebar: plot style + regression menu + zoom-to-fit icon */
  regressionTemplates: true,
  border: true,
  lockViewport: false,
  capExpressionSize: false,
  autosize: true,
  calculus: true,
  clearIntoDegreeMode: false,
  brailleControls: true,
  administerSecretFolders: false,
  authorFeatures: false,
};
