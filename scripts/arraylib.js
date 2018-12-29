/// <reference path="typings/index.d.ts" />
'use strict'

exports.union = (a, b) => a.concat(b.filter(v => !a.includes(v)))
exports.intersect = (a, b) => a.filter(v => b.includes(v))
exports.containsArray = (large, small) => {
    for (var index in small) {
        if (small[index] === '') {
            continue
        }
        if (!large.includes(small[index])) {
            return false
        }
    }
    return true
}


