/* global SimpleMDE */
/* eslint-disable no-unused-vars */
/* eslint-disable-next-line multiline-comment-style */
/// <reference path="typings/index.d.ts" />
/// <reference path="../node_modules/simplemde/src/js/simplemde.js" />

'use strict'

const fs = require('fs')
const path = require('path')
const util = require('./scripts/util.js')
const arraylib = require('./scripts/arraylib.js')
const exportlib = require("./scripts/exportlib.js")
const electron = require('electron')
const {remote} = electron

var documentPath = remote.app.getPath('userData') + '/documents'

var editor = new SimpleMDE({
    autofocus: true,
    autoDownloadFontAwesome: false,
    status: false,
    spellChecker: false,
    toolbar: [
        'bold', 'italic', 'heading', '|', 'quote', 'image', 'link', '|',
        {
            name: 'save',
            action: _ => saveDocument(),
            className: 'fa fa-save',
            title: '保存'
        },
        {
            name: 'edit-document-info',
            action: _ => showModifyArticleInfoModal(),
            className: 'fa fa-pencil',
            title: '修改文档信息'
        }
    ]
})

/**
 * @typedef DocumentInfo
 * @type {Object}
 * @property {String} hash 哈希值
 * @property {String} title 文档标题
 * @property {String} meta 文档描述
 * @property {Array<String>} tags 标签
 */

/**
 * 按经哈希处理的目录名获取文档信息。
 * @param {String} docname 经哈希处理的目录名
 * @return {DocumentInfo} 文档信息
 */
function getDocumentInfo(docname) {
    if (!fs.existsSync(`${docname}/content.md`)) {
        return null
    }
    try {
        var data = fs.readFileSync(`${docname}/info.json`, 'utf-8')
        return JSON.parse(data)
    }
    catch (error) {
        console.log(error)
        return null
    }
}

/**
 * 创建点击项目时触发的处理器。项目在侧栏的“文档”或“搜索结果”中。
 * @param {DocumentInfo} info 文档信息
 * @return {Function} 生成的处理器
 */
function createItemClickHandler(info) {
    return () => {
        $('#mb-article-title').text(info.title)
        $('#mb-article-meta').text(info.meta)
        $('#mb-tags-area').html('')
        for (var count in info.tags) {
            addTag(info.tags[count])
        }
        var data = fs.readFileSync(`${documentPath}/doc-${info.hash}/content.md`, 'utf-8')
        editor.value(data)
        $.UIkit.offcanvas.hide()
    }
}

/**
 * 搜索操作。点击“开始搜索”触发。
 * @return {void}
 */
function searchDocumentNames() {
    var tagsRequired = $('#mb-search-tags-required').val().split(' ')
    var tagsOptional = $('#mb-search-tags-optional').val().split(' ')
    var searchTitle = $('#mb-search-title').val()
    var searchResults = []
    var files = fs.readdirSync(documentPath)
    for (var fileIndex in files) {
        var docname = files[fileIndex]
        var info = getDocumentInfo(`${documentPath}/${docname}`)
        if (info !== null) {
            var searchTitleRegex = new RegExp(searchTitle, 'i')
            if (searchTitleRegex.test(info.title) && arraylib.containsArray(info.tags, tagsRequired)) {
                searchResults.push(info)
            }
        }
    }
    var intersectCount = (x) => arraylib.intersect(x.tags, tagsOptional).length
    searchResults.sort((a, b) => intersectCount(b) - intersectCount(a))
    for (var index in searchResults) {
        var result = searchResults[index]
        var resultName = 'doc-' + result.hash
        var element = `<li><a id="mb-result-${resultName}" href="javascript:void(0);">
            ${result.title}&nbsp;&nbsp;
        </a></li>`
        $('#mb-results-list').append(element)
        for (var tagIndex in result.tags) {
            addTag(result.tags[tagIndex], `#mb-result-${resultName}`)
        }
        $(`#mb-result-${resultName}`).click(createItemClickHandler(result))
    }
    if (searchResults.length === 0) {
        element = '<li><p style="text-align:center;line-height:40px;">无搜索结果</p></li>'
        $('#mb-results-list').append(element)
    }
}

/**
 * 加载全部侧栏文档项目。在侧栏显示时触发。
 * @return {void}
 */
function loadDocumentNames() {
    $('#mb-documents-list').html('')
    $('#mb-results-list').html('')
    var files = fs.readdirSync(documentPath)
    for (var fileIndex in files) {
        var docname = files[fileIndex]
        var info = getDocumentInfo(`${documentPath}/${docname}`)
        if (info !== null) {
            var element = `<li><a id="mb-item-${docname}" name="${docname}" class="mb-list-item" href="javascript:void(0);">
                ${info.title}&nbsp;&nbsp;
            </a></li>`
            $('#mb-documents-list').append(element)
            for (var tagIndex in info.tags) {
                addTag(info.tags[tagIndex], `#mb-item-${docname}`)
            }
            $(`#mb-item-${docname}`).click(createItemClickHandler(info))
        }
    }
}

/**
 * 导出文档。
 * @return {void}
 */
function exportDocument() {
    const options = {
        title: '导出文档',
        defaultPath: `${$('#mb-article-title').text()}`,
        message: '导出为：HTML文档 或 MarkDown文档',
        filters: [
            {name: 'HTML文档', extensions: ['html']},
            {name: 'MarkDown文档', extensions: ['md']}
        ]
    }
    remote.dialog.showSaveDialog(options, (filename) => {
        console.log(filename)
        var extname = path.extname(filename)
        if (extname === '.html') {
            var title = $('#mb-article-title').text()
            var meta = $('#mb-article-meta').text()
            var htmlCode = exportlib.exportHtml(title, meta, editor.markdown(editor.value()))
            fs.writeFileSync(filename, '\ufeff' + htmlCode, 'utf-8')
        }
        else if (extname === '.md') {
            fs.writeFileSync(filename, '\ufeff' + editor.value(), 'utf-8')
        }
    })
}

/**
 * 显示修改文档信息对话框。在点击“修改信息”按钮时触发。
 * @return {void}
 */
function showModifyArticleInfoModal() {
    var modal = UIkit.modal('#mb-modify-article-info-modal')
    $('#mb-title-empty-msg').hide()
    $('#mb-article-title-input').val($('#mb-article-title').text())
    $('#mb-article-meta-input').val($('#mb-article-meta').text())
    $('#mb-tags-input').val($('#mb-tags-area').text())
    modal.show()
}

function modifyArticleInfo() {
    var modal = UIkit.modal('#mb-modify-article-info-modal')
    var newName = $('#mb-article-title-input').val()
    var newMeta = $('#mb-article-meta-input').val()
    var newTags = $('#mb-tags-input').val()
    if (newName === '') {
        $('#mb-title-empty-msg').show()
        return
    }
    $('#mb-article-title').text(newName)
    $('#mb-article-meta').text(newMeta)
    $('#mb-tags-area').html('')
    var tags = newTags.split('#')
    for (var index in tags) {
        if (!util.isEmptyString(tags[index])) {
            addTag(tags[index])
        }
    }
    modal.hide()
}

function addTag(tagName, target = '#mb-tags-area') {
    var tag = `<div class="uk-badge mb-tag-class">#${tagName.trim()}</div>&nbsp;`
    $(target).append(tag)
}

/**
 * 将用‘#’分隔的标签转为JSON格式。
 * @return {void}
 */
function stringifyTags() {
    var tags = $('#mb-tags-area').text().split('#')
    var result = ''
    var needComma = false
    for (var index in tags) {
        if (!util.isEmptyString(tags[index])) {
            result += `${needComma ? ',' : ''}"${tags[index].trim()}"`
            needComma = true
        }
    }
    return result
}

/**
 * 删除文档。
 * @param {String} docname 文档目录名
 * @return {void}
 */
function deleteDocument(docname) {
    util.rmdir(`${documentPath}/${docname}`)
}

/**
 * 保存文档。
 * @return {void}
 */
function saveDocument() {
    var title = $('#mb-article-title').text()
    var meta = $('#mb-article-meta').text()
    var hash = util.SDBMHash(title)
    var documentName = `${documentPath}/doc-${hash}`
    var infoData = `
{
    "hash": "${hash}",
    "title": "${title}",
    "meta": "${meta}",
    "tags": [${stringifyTags()}]
}
    `
    var callback = (error) => {
        if (error) {
            console.log(error)
            UIkit.modal.alert('文档保存失败！')
        }
    }
    if (!fs.existsSync(documentName)) {
        fs.mkdirSync(documentName, callback)
    }
    fs.writeFile(documentName + '/info.json', infoData, callback)
    fs.writeFile(documentName + '/content.md', editor.value(), callback)
}

function autoAdjustEditorSize() {
    $('.CodeMirror').css('height', `${$(document).height() - 300}px`)
}

function initContextMenu() {
    $.contextMenu({
        selector: '.mb-list-item',
        callback: (key, option) => {
            if (key === 'delete') {
                var sender = option.$trigger
                deleteDocument(sender.attr('name'))
                sender.remove()
            }
        },
        items: {
            'delete': {name: '删除', icon: 'fa-trash'}
        }
    })
}

function checkDocumentPath() {
    if (!fs.existsSync(documentPath)) {
        fs.mkdirSync(documentPath)
    }
}

/**
 * 初始化窗口。
 * @return {void}
 */
function initWindow() {
    checkDocumentPath()
    initContextMenu()
    autoAdjustEditorSize()
    $(window).resize(autoAdjustEditorSize)
}

function createDocument() {
    $('#mb-article-title').text('标题')
    $('#mb-article-meta').text('其他信息')
    $('#mb-tags-area').text('')
    editor.value('')
    $.UIkit.offcanvas.hide()
}


$(() => {
    // 初始化文档
    initWindow()
    loadDocumentNames()
    // 按钮处理
    $('#mb-sidebar-toggle').click(loadDocumentNames)
    $('#mb-save-document').click(saveDocument)
    $('#mb-show-modify-article-info-modal').click(showModifyArticleInfoModal)
    $('#mb-modify-article-info-okbutton').click(modifyArticleInfo)
    $('#mb-new-document-link').click(createDocument)
    $('#mb-export-link').click(exportDocument)
    $('#mb-search-button').click(searchDocumentNames)
})