export type DesmosGraphState = Record<string, unknown>;

type Viewport = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

function makeState(
  latexList: string[],
  viewport: Viewport = { xmin: -10, ymin: -10, xmax: 10, ymax: 10 },
): DesmosGraphState {
  return {
    version: 11,
    randomSeed: `example-${latexList.join("-").slice(0, 12)}`,
    graph: { viewport },
    expressions: {
      list: latexList.map((latex, i) => ({
        type: "expression",
        id: `ex${i + 1}`,
        latex,
      })),
    },
  };
}

export type DesmosExampleGraph = {
  id: string;
  title: string;
  subtitle: string;
  /** Tailwind gradient for card preview */
  previewClass: string;
  state: DesmosGraphState;
};

/** SAT-style starter graphs (API state, not desmos.com cloud). */
export const DESMOS_EXAMPLE_GRAPHS: DesmosExampleGraph[] = [
  {
    id: "line-slope",
    title: "Lines: Slope Intercept",
    subtitle: "Linear functions",
    previewClass: "from-blue-100 to-blue-200",
    state: makeState(["y=2x+3", "y=-0.5x+1"], {
      xmin: -5,
      ymin: -2,
      xmax: 8,
      ymax: 10,
    }),
  },
  {
    id: "parabola-standard",
    title: "Parabolas: Standard Form",
    subtitle: "Quadratic functions",
    previewClass: "from-green-100 to-green-200",
    state: makeState(["y=x^2", "y=-x^2+4"], {
      xmin: -5,
      ymin: -2,
      xmax: 5,
      ymax: 8,
    }),
  },
  {
    id: "parabola-vertex",
    title: "Parabolas: Vertex Form",
    subtitle: "Vertex form",
    previewClass: "from-purple-100 to-purple-200",
    state: makeState(["y=(x-2)^2-1", "y=-2(x+1)^2+5"], {
      xmin: -4,
      ymin: -4,
      xmax: 6,
      ymax: 8,
    }),
  },
  {
    id: "circle",
    title: "Circles",
    subtitle: "Conic sections",
    previewClass: "from-orange-100 to-orange-200",
    state: makeState(["x^2+y^2=25"], {
      xmin: -8,
      ymin: -8,
      xmax: 8,
      ymax: 8,
    }),
  },
  {
    id: "absolute-value",
    title: "Absolute Value",
    subtitle: "Piecewise linear",
    previewClass: "from-cyan-100 to-cyan-200",
    state: makeState(["y=|x|", "y=|x-3|+2"], {
      xmin: -6,
      ymin: -1,
      xmax: 8,
      ymax: 8,
    }),
  },
  {
    id: "systems",
    title: "Systems of Equations",
    subtitle: "Two lines",
    previewClass: "from-rose-100 to-rose-200",
    state: makeState(["y=2x+1", "y=-x+4"], {
      xmin: -3,
      ymin: -2,
      xmax: 6,
      ymax: 8,
    }),
  },
  {
    id: "table-points",
    title: "Table & Points",
    subtitle: "Zoom-to-fit sidebar demo",
    previewClass: "from-indigo-100 to-indigo-200",
    state: {
      version: 11,
      randomSeed: "example-table-points",
      graph: { viewport: { xmin: -2, ymin: -2, xmax: 10, ymax: 12 } },
      expressions: {
        list: [
          {
            type: "table",
            id: "tbl1",
            columns: [
              {
                latex: "x_1",
                values: ["1", "2", "3", "4"],
              },
              {
                latex: "y_1",
                values: ["2", "5", "8", "11"],
              },
            ],
          },
        ],
      },
    },
  },
];
