// FROM UPKEEP TEMPLATE
// Jest will look for a babel config in the
// same directory as the jest.config.js
// module.exports = {
//   ...require('../../babel.config')
// }
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: '12' } }],
    '@babel/preset-typescript'
  ],
 plugins: ["@babel/plugin-transform-runtime"]
}
// plugins: [
//   ['@babel/proposal-decorators', { legacy: true }],
//   '@babel/proposal-class-properties',
//   '@babel/proposal-object-rest-spread'
// ]
