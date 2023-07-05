const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
});

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
    const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '');

    assetPrefix = `/${repo}/`;
    basePath = `/${repo}`;
}

module.exports = {
    ...withNextra(),
    images: {
        unoptimized: true,
    },
    assetPrefix: assetPrefix,
    basePath: basePath,
};