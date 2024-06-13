const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
});

let assetPrefix = '';
let basePath = '';

module.exports = {
    ...withNextra(),
    images: {
        unoptimized: true,
    },
    assetPrefix: assetPrefix,
    basePath: basePath,
    output: 'export'
};