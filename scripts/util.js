/// <reference path="typings/index.d.ts" />
'use strict'
const fs = require('fs')
const path = require('path')

exports.rotatingHash = function (key) {
    key = key instanceof Buffer ? key : Buffer.from(key)
    for (var hash = key.length, i = 0; i < key.length; ++i) {
        hash = (hash << 4) ^ (hash >> 28) ^ key[i]
    }
    return hash
}

exports.SDBMHash = function (key) {
    key = key instanceof Buffer ? key : Buffer.from(key)
    for (var hash = 0, i = 0; i < key.length; i++) {
        hash = 65599 * hash + key[i] & 0x7FFFFFFF
    }
    return hash
}

exports.isEmptyString = (str) => str.replace(/(^s*)|(s*$)/g, "").length == 0

exports.rmdir = function (dir) {
    var files = []
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir)
        files.forEach((file) => {
            var curPath = path.join(dir, file)
            if (fs.statSync(curPath).isDirectory()) {
                exports.rmdir(curPath)
            }
            else {
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(dir)
    }
}