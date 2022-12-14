module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'google',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['tsconfig.json', 'tsconfig.dev.json'],
        sourceType: 'module',
    },
    ignorePatterns: [
        '/dist/**/*', // Ignore built files.
    ],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        indent: ['error', 4],
        quotes: ['error', 'single'],
        'quote-props': ['error', 'as-needed'],
        'import/no-unresolved': 0,
        'object-curly-spacing': ['error', 'always'],
        'max-len': 0,
        'require-jsdoc': 0,
        'no-console': 'error',
        '@typescript-eslint/no-unused-vars': 0,
    },
};
