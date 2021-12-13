module.exports = {
    env: {
        es2021: true,
        node: true,
        'jest/globals': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'plugin:github/recommended',
        'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
    },
    // settings: {
    //     'import/resolver': {
    //         node: {
    //             extensions: ['.js', '.ts'],
    //             paths: ['node_modules', 'src'],
    //             moduleDirectory: ['node_modules', 'src'],
    //         },
    //     },
    // },
    globals: {
        NodeJS: true,
    },
    plugins: ['@typescript-eslint', 'simple-import-sort', 'import', 'jest', 'github'],
    rules: {
        'import/no-unresolved': [
            'error',
            {
                ignore: ['@octokit/openapi-types'],
            },
        ],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'import/no-namespace': 'off',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                ts: 'never',
            },
        ],
        'sort-imports': 'off',
        'i18n-text/no-en': 'off',

        'linebreak-style': ['error', 'unix'],

        camelcase: 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'filenames/match-regex': 'off',
        'prettier/prettier': [
            'error',
            {
                arrowParens: 'avoid',
                bracketSpacing: true,
                endOfLine: 'lf',
                jsxSingleQuote: false,
                printWidth: 100,
                proseWrap: 'preserve',
                quoteProps: 'as-needed',
                semi: true,
                singleQuote: true,
                tabWidth: 4,
                trailingComma: 'all',
                useTabs: false,
            },
        ],
        quotes: ['off', 'single'],
        semi: ['off', 'always'],
        indent: ['off', 4],
    },
};
