import { useRouter } from 'next/router';

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
                titleTemplate: '%s - Dashlane CLI'
            };
        }
    }
};