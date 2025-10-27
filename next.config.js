/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['cytoscape', 'cytoscape-cose-bilkent', 'd3-sankey', 'endent', 'dedent'],
  
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      // point the problematic deep import to the actual file to bypass package exports restriction
      'cytoscape/dist/cytoscape.umd.js': require.resolve('cytoscape/dist/cytoscape.umd.js'),
      'dlv': 'lodash.get',
      'camelcase-css': 'camelcase-css/index-es5.js',
    },
  },
  
  // Keep webpack config for backwards compatibility when using --webpack flag
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'cytoscape/dist/cytoscape.umd.js': require.resolve('cytoscape/dist/cytoscape.umd.js'),
      'dlv': 'lodash.get',
      'camelcase-css': 'camelcase-css/index-es5.js',
    };
    return config;
  },
};

module.exports = nextConfig;
