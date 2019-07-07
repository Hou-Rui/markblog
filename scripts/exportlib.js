/// <reference path="typings/index.d.ts" />
'use strict'

/**
 * 包装文档的HTML代码，加入文档信息。
 * @param {String} title 文档标题
 * @param {String} meta 文档附加信息
 * @param {String} content HTML代码
 * @return {String} 包装后的HTML代码
 */
exports.exportHtml = (title, meta, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
</head>
<body>
<h1 style="font-weight: normal">${title}</h1>
<small style="color: grey">${meta}</small>
<div style="line-height: 28px; height: 28px; font-size: 16px;">
${content}
</div>
</body>
</html>
`