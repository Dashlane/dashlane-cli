import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    {
        ignores: ['**/documentation', '**/scripts'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                project: true,
            },
        },

        rules: {
            'no-return-await': 'error',

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-interface': 'off',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '[iI]gnored',
                    argsIgnorePattern: '^_',
                },
            ],

            'object-shorthand': ['error', 'always'],
        },
    }
);
