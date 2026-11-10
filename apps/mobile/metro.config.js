const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.resolve(projectRoot, '../../packages/shared')]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '../../packages/shared/node_modules'),
]

module.exports = config
