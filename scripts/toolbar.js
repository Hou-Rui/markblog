/* global SimpleMDE, selectImage, saveDocument, showModifyArticleInfoModal */
/* eslint-disable no-unused-vars */
/* eslint-disable-next-line multiline-comment-style */
/// <reference path="markblog.js" />
/// <reference path="typings/index.d.ts" />
/// <reference path="../node_modules/simplemde/src/js/simplemde.js" />

'use strict'

exports.toolbar = [
    {
        name: 'mb-bold',
        action: editor => SimpleMDE.toggleBold(editor),
        className: 'fa fa-bold',
        title: '切换粗体'
    },
    {
        name: 'mb-italic',
        action: editor => SimpleMDE.toggleItalic(editor),
        className: 'fa fa-italic',
        title: '切换斜体'
    },
    {
        name: 'mb-heading',
        action: editor => SimpleMDE.toggleHeadingSmaller(editor),
        className: 'fa fa-header',
        title: '切换标题级别'
    },
    '|',
    {
        name: 'mb-quote',
        action: editor => SimpleMDE.toggleBlockquote(editor),
        className: 'fa fa-quote-left',
        title: '插入引用'
    },
    {
        name: 'mb-image',
        action: _ => selectImage(),
        className: 'fa fa-picture-o',
        title: '插入图片'
    },
    {
        name: 'mb-link',
        action: editor => SimpleMDE.drawLink(editor),
        className: 'fa fa-link',
        title: '插入链接'
    },
    '|',
    {
        name: 'mb-save',
        action: _ => saveDocument(),
        className: 'fa fa-save',
        title: '保存'
    },
    {
        name: 'mb-edit-document-info',
        action: _ => showModifyArticleInfoModal(),
        className: 'fa fa-pencil',
        title: '修改文档信息'
    }
]