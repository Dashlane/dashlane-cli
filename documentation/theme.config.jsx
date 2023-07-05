import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

export default {
    logo: <strong>Dashlane CLI</strong>,
    project: {
        link: 'https://github.com/Dashlane/dashlane-cli'
    },
    docsRepositoryBase: 'https://github.com/Dashlane/dashlane-cli/blob/master/documentation',
    banner: {
        key: '2.0-release',
        text: (
            <a href="https://github.com/Dashlane/dashlane-cli/releases" target="_blank">
                📂 Download Dashlane CLI builds for Macos, Windows and Linux here →
            </a>
        )
    },
    footer: { text: (<span>Apache ${new Date().getFullYear()} © Dashlane, Inc.</span>) },
    useNextSeoProps() {
        const { asPath } = useRouter();
        if (asPath !== '/') {
            return {
                titleTemplate: '%s - Dashlane CLI',
            };
        }
    },
    head: () => {
        const { asPath, defaultLocale, locale } = useRouter();
        const { frontMatter } = useConfig();
        const url =
            'https://dashlane.github.io/dashlane-cli' +
            (defaultLocale === locale ? asPath : `/${locale}${asPath}`);

        return (
            <>
                <meta property="og:url" content={url} />
                <meta property="og:title" content={frontMatter.title || 'Dashlane CLI'} />
                <meta
                    property="og:description"
                    content={frontMatter.description || 'Learn how to access your Dashlane vault and API endpoints from the command line.'}
                />
            </>
        );
    }
};