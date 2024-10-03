module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-prettier"
  ],
  env: {
    "vue/setup-compiler-macros": true
  },
  rules: {
    "no-unused-vars": "error", // Ensure this rule is set to 'error'
    "prettier/prettier": [
      "error",
      {
        singleQuote: true,
        semi: false,
        tabWidth: 2,
        useTabs: false,
      },
    ],
  },
}