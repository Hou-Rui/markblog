/* global SimpleMDE */
// eslint-disable-next-line multiline-comment-style
/// <reference path="typings/index.d.ts" />
/// <reference path="../node_modules/simplemde/src/js/simplemde.js" />

'use strict'

const fs = require('fs')
const hashlib = require('./scripts/hashlib.js')
const arraylib = require('./scripts/arraylib.js')
const electron = require('electron')
const {remote} = electron

var editor = new SimpleMDE({
    autoDownloadFontAwesome: false,
    status: false,
    spellChecker: false,
    toolbar: [
        'bold', 'italic', 'heading', '|', 'quote', '|',
        {
            name: 'save',
            action: _ => saveDocument(),
            className: 'fa fa-save',
            title: '保存'
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
    if (!fs.existsSync(`${docname}/content.html`)) {
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
        var data = fs.readFileSync(`./documents/doc-${info.hash}/content.html`, 'utf-8')
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
    var files = fs.readdirSync('./documents')
    for (var fileIndex in files) {
        var docname = files[fileIndex]
        var info = getDocumentInfo(`./documents/${docname}`)
        if (info !== null) {
            var searchTitleRegex = new RegExp(searchTitle, 'i')
            if (searchTitleRegex.test(info.title) && arraylib.containsArray(info.tags, tagsRequired)) {
                searchResults.push(info)
            }
        }
    }
    var unionCount = (x) => arraylib.union(x.tags, tagsOptional).length
    searchResults.sort((a, b) => unionCount(b) - unionCount(a))
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
}

/**
 * 加载全部侧栏文档项目。在侧栏显示时触发。
 * @return {void}
 */
function loadDocumentNames() {
    $('#mb-documents-list').html('')
    var files = fs.readdirSync('./documents')
    for (var fileIndex in files) {
        var docname = files[fileIndex]
        var info = getDocumentInfo(`./documents/${docname}`)
        if (info !== null) {
            var element = `<li><a id="mb-item-${docname}" href="javascript:void(0);">
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
 * 显示修改文档信息对话框。在点击“修改信息”按钮时触发。
 * @return {void}
 */
function showModifyArticleInfoModal() {
    var modal = UIkit.modal('#mb-modify-article-info-modal')
    $('#mb-title-empty-msg').hide()
    modal.show()
}

function modifyArticleInfo() {
    var modal = UIkit.modal('#mb-modify-article-info-modal')
    var newName = $('#mb-article-title-input').val()
    var newMeta = $('#mb-article-meta-input').val()
    if (newName === '') {
        $('#mb-title-empty-msg').show()
        return
    }
    $('#mb-article-title').text(newName)
    $('#mb-article-meta').text(newMeta)
    modal.hide()
}

function addTag(tagName, target = '#mb-tags-area') {
    var tag = `<div class="uk-badge mb-tag-class">#${tagName}</div>`
    $(target).append(tag)
}

function showAddTagDialog() {
    UIkit.modal.prompt('新建标签：', '', (tagName) => addTag(tagName))
}

/**
 * 将用‘#’分隔的标签转为JSON格式。
 * @return {void}
 */
function stringifyTags() {
    var tags = $('#mb-tags-area').text().split('#')
    var result = ''
    for (var index in tags) {
        var needComma = false
        if (tags[index] !== '') {
            result += `${needComma ? ',' : ''}"${tags[index]}"`
            needComma = true
        }
    }
    return result
}

/**
 * 保存文档。
 * @return {void}
 */
function saveDocument() {
    var title = $('#mb-article-title').text()
    var meta = $('#mb-article-meta').text()
    var hash = hashlib.SDBMHash(title)
    var documentName = './documents/doc-' + hash
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
    fs.writeFile(documentName + '/content.html', editor.value(), callback)
}

/**
 * 初始化文档。
 * @return {void}
 */
function initDocument() {
    var openingDocument = remote.app.getOpeningDocument()
    if (openingDocument.HTMLPath !== null) {
        fs.readFile(openingDocument.HTMLPath, 'utf-8', (error, data) => {
            if (error) {
                console.log(error)
            }
            else {
                $('#mb-article-title').text(openingDocument.info.title)
                $('#mb-article-meta').text(openingDocument.info.meta)
                for (var index in openingDocument.info.tags) {
                    addTag(openingDocument.info.tags[index])
                }
                editor.value(data)
            }
        })
    }
}

$(() => {
    // 初始化文档
    initDocument()
    loadDocumentNames()
    // 按钮处理
    $('#mb-sidebar-toggle').click(loadDocumentNames)
    $('#mb-save-document').click(saveDocument)
    $('#mb-show-modify-article-info-modal').click(showModifyArticleInfoModal)
    $('#mb-modify-article-info-okbutton').click(modifyArticleInfo)
    $('#mb-add-tag-button').click(showAddTagDialog)
    $('#mb-search-button').click(searchDocumentNames)
})