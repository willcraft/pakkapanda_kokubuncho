// モノレポ対応: リポジトリ直下の shared/ を Metro の監視対象に加える
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '..', 'shared')];

module.exports = config;
