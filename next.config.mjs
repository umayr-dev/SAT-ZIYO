/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSS optimization - prevent CSS from being lost
  compiler: {
    // Keep console.error and console.warn in production. Stripping ALL console
    // output meant that during the failed mock test there was literally no
    // client-side diagnostic left — every "failed to save answer" and every
    // caught exception was compiled away, so neither the students nor anyone
    // debugging afterwards could see what was breaking.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Suppress punycode deprecation warning
  webpack: (config, { isServer, dev }) => {
    // Fix webpack runtime errors
    if (!isServer) {
      // Ignore punycode deprecation warnings
      config.ignoreWarnings = [
        { module: /node_modules/ },
        { message: /punycode/ },
      ];

      // Fix module resolution issues
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
        },
      };

      // CSS hot reload fix
      if (dev) {
        config.optimization = {
          ...config.optimization,
          moduleIds: "named",
          chunkIds: "named",
        };
      }
      // PERF: do NOT override production chunking. The previous `else` branch
      // set `default: false` + `vendors: false`, which disabled Next.js 14's
      // tuned cache groups (framework / per-package lib-* / commons / shared)
      // and replaced them with one `vendor` group swallowing all of
      // node_modules. Result: a single 1.96MB (569kB gzip) chunk downloaded by
      // every route — the landing page was fetching recharts, katex and the
      // whole remark/rehype chain to render marketing copy, blocking first
      // paint for ~2.5s. Measured with Next's own splitting restored:
      // shared JS 569.4kB gz -> 87.7kB gz.
      // The `styles` group is gone for the same reason: it merged every CSS
      // import into one 105kB render-blocking stylesheet containing KaTeX's
      // font CSS on routes that render no math.
    }
    return config;
  },

  // Suppress build warnings for missing pages (App Router doesn't need _document)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Suppress _document warnings (App Router doesn't use it)
  experimental: {
    // Barrel-import optimization: rewrites `import { X } from "pkg"` into deep
    // imports so tree shaking can drop the rest of the package.
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-query",
      "recharts",
      "react-markdown",
      "katex",
      "react-katex",
      "@radix-ui/react-dialog",
    ],
    // Base64 rasmlar bilan POST uchun body limit (413 yechimi)
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // CSS reload fix - prevent CSS from being lost during hot reload
  reactStrictMode: true,
  swcMinify: true,

  // Ensure CSS is properly loaded
  poweredByHeader: false,

  // GCS (Google Cloud Storage) rasmlari uchun next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
