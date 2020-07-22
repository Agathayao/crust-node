const _ = require('lodash')
const path = require('path')
const shell = require('shelljs')
const { createDir, writeConfig, } = require('../utils')
const { getSharedChainConfig } = require('./chain-config.gen')

async function genKarstConfig(config, outputCfg) {
  const { baseDir } = outputCfg
  const outputDir = path.join(baseDir, 'karst')
  await createDir(outputDir)

  const outputFile = path.join(outputDir, 'karst_config.json')
  const karstConfig = {
    ...config.karst,
    base_url: `http://0.0.0.0:${config.karst.port}/api/v0`,
    crust: getSharedChainConfig(config),
    fastdfs: {
      max_conns: 100,
      tracker_addrs: config.karst.tracker_addrs,
    },
    log_level: 'debug',
    tee_base_url: `http://127.0.0.1:${config.tee.port}/api/v0`,
  }
  await writeConfig(outputFile, karstConfig)
  const basePaths = _.isEmpty(config.karst.base_path) ? [] : [{
    required: true,
    path: config.karst.base_path,
  }]
  return {
    file: outputFile,
    paths: [...basePaths],
  }
}

async function genKarstComposeConfig(config) {
  const basePath = _.isEmpty(config.karst.base_path) ? '/home/crust/crust/karst' : config.karst.base_path
  const baseVolume = _.isEmpty(config.karst.base_path) ? [] : [ `${basePath}:${basePath}` ]

  return {
    image: 'crustio/crust-tee:0.5.0',
    network_mode: 'host',
    devices: [
      '/dev/isgx:/dev/isgx'
    ],
    volumes: [
      ...baseVolume,
      './karst:/config'
    ],
    environment: {
      KARST_PATH: basePath,
      INIT_ARGS: '-c /config/karst_config.json'
    },
    container_name: 'karst-0.2.0',
    restart: 'always',
  }
}

module.exports = {
  genKarstConfig,
  genKarstComposeConfig,
}
