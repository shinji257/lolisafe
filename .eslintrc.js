module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 9 // 2018
  },
  env: {
    node: true
  },
  extends: [
    'standard'
  ],
  rules: {
    curly: [
      'error',
      'multi',
      'consistent'
    ],
    'no-throw-literal': 0,
    'object-shorthand': [
      'error',
      'always'
    ],
    'standard/no-callback-literal': 0
  }
}
