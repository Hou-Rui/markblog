/// <reference path="typings/index.d.ts" />
'use strict'

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