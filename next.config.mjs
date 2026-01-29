/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSS optimization - prevent CSS from being lost
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
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
      } else {
        // Optimize chunk loading for production
        config.optimization = {
          ...config.optimization,
          moduleIds: "deterministic",
          runtimeChunk: "single",
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              default: false,
              vendors: false,
              vendor: {
                name: "vendor",
                chunks: "all",
                test: /[\\/]node_modules[\\/]/,
                priority: 20,
              },
              // CSS chunk - prevent CSS from being lost
              styles: {
                name: "styles",
                test: /\.(css|scss|sass)$/,
                chunks: "all",
                enforce: true,
                priority: 30,
              },
            },
          },
        };
      }
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
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
    // Base64 rasmlar bilan POST uchun body limit (413 yechimi)
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },

  // CSS reload fix - prevent CSS from being lost during hot reload
  reactStrictMode: true,
  swcMinify: true,

  // Ensure CSS is properly loaded
  poweredByHeader: false,
};

export default nextConfig;
