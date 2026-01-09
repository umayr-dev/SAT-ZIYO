/** @type {import('next').NextConfig} */
const nextConfig = {
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

      // Optimize chunk loading
      if (!dev) {
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
  },
};

export default nextConfig;
