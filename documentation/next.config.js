import nextra from 'nextra';

const withNextra = nextra({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx'
});

let assetPrefix = '';
let basePath = '';

export default withNextra({
    images: {
        unoptimized: true,
    },
    assetPrefix: assetPrefix,
    basePath: basePath,
    output: 'export'
});