const baseConfig = require('../../eslint.config.cjs');

module.exports = [
    ...baseConfig,
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        // Add custom rules for dashboard here
        rules: {},
    },
];
