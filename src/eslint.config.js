import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import react from "eslint-plugin-react"

export default [
  {
    ignores: ["dist", "build", "node_modules", "coverage", "reports"],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },

    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      "react-hooks/rules-of-hooks": "error",
      "react/jsx-no-undef": "error",

      "no-undef": "warn",
      "no-use-before-define": "warn",
      "react/no-unescaped-entities": "warn",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      "react-hooks/exhaustive-deps": "warn",

      /* React 19 migration rules — keep off until Sprint 7 */
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off"
    }
  }
]
