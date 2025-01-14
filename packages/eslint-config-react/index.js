'use strict';

module.exports = {
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: [
    '@labkey/eslint-config-base',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'import/no-unassigned-import': ['warn', { 'allow': ['**/*.css'] } ],
    'jsx-quotes': ['error', 'prefer-double'],

    // React rules
    // https://github.com/yannickcr/eslint-plugin-react#recommended
    'react/boolean-prop-naming': 'off',
    'react/button-has-type': 'error',
    'react/default-props-match-prop-types': 'error',
    'react/destructuring-assignment': 'off',
    'react/display-name': 'off',
    'react/forbid-component-props': 'off',
    'react/forbid-dom-props': 'off',
    'react/forbid-elements': 'off',
    'react/forbid-prop-types': 'off',
    'react/forbid-foreign-prop-types': 'error',
    'react/no-access-state-in-setstate': 'error',
    'react/no-array-index-key': 'error',
    'react/no-danger': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-deprecated': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-multi-comp': 'off',
    'react/no-redundant-should-component-update': 'error',
    // We use typically the pattern below which is triggers 'react/no-render-return-value' flag
    //   $(() => ReactDOM.render(<MyComponent />));
    'react/no-render-return-value': 'off',
    'react/no-set-state': 'off',
    'react/no-string-refs': 'error',
    'react/no-this-in-sfc': 'error',
    'react/no-typos': 'error',
    'react/no-unescaped-entities': ['error', {'forbid': ['>', '}']}],
    'react/no-unknown-property': 'error',
    'react/no-unsafe': 'error',
    // NK: react/no-unused-prop-types is faulty in that it reports many props as unused when they are used
    'react/no-unused-prop-types': 'off',
    'react/no-unused-state': 'error',
    'react/no-will-update-set-state': 'error',
    'react/prefer-es6-class': 'error',
    'react/prefer-stateless-function': [
      'error',
      { ignorePureComponents: true }
    ],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'error',
    'react/require-default-props': 'off',
    'react/require-optimization': 'off',
    'react/require-render-return': 'error',
    'react/sort-comp': 'error',
    'react/sort-prop-types': 'off',
    'react/style-prop-object': 'error',
    'react/void-dom-elements-no-children': 'error',

    'react/jsx-boolean-value': 'off',
    'react/jsx-curly-brace-presence': 'error',
    'react/jsx-filename-extension': 'off',
    'react/jsx-handler-names': 'off',
    //'react/jsx-indent': ['error', 2],
    //'react/jsx-indent-props': ['error', 2],
    'react/jsx-key': 'error',
    'react/jsx-max-depth': 'off',
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
    'react/jsx-no-literals': 'off',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': ['error', { allowAllCaps: true }],
    'react/jsx-sort-default-props': 'off',
    'react/jsx-sort-props': 'off',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    // The rules below conflict with prettier
    //'react/self-closing-comp': 'error',
    //'react/jsx-child-element-spacing': 'error',
    //'react/jsx-closing-bracket-location': 'error',
    //'react/jsx-closing-tag-location': 'error',
    //'react/jsx-curly-spacing': 'error',
    //'react/jsx-equals-spacing': 'error',
    //'react/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
    //'react/jsx-one-expression-per-line': ['error', { allow: 'single-child' }],
    //'react/jsx-max-props-per-line': [
    //  'error',
    //  { maximum: 1, when: 'multiline' }
    //],
    //'react/jsx-props-no-multi-spaces': 'error',
    //'react/jsx-wrap-multilines': 'error'
  }
};
