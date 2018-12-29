// 主进程
const path = require('path')
const electron = require('electron')
const {app, BrowserWindow, dialog} = electron

var mainWindow = null
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    })
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    mainWindow.on('closed', () => mainWindow = null)
}

// 应用加载完毕
app.on('ready', createWindow)

// 关闭窗口动作
app.on('window-all-closed', () => {
    // Mac 应用窗口关闭后不退出
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // Mac 应用进入活跃状态时重新创建窗口
    if (mainWindow === null) {
        createWindow()
    }
})

// 响应渲染进程消息
var openingDocument = {
    HTMLPath: null,
    info: {
        title: '',
        meta: '',
        tags: []
    }
}

function exportDocument() {
    const options = {
        title: '导出文档',
        filters: [{name: 'HTML', extensions: ['html', 'htm', 'md']}]
    }
    var exportingDocument = {
        name: '',
        type: ''
    }
    dialog.showSaveDialog(options, (filename) => {
        var extname = path.extname(filename)
        exportingDocument.name = filename
        if (extname === 'html' || extname === 'htm') {
            exportingDocument.type = 'html'
        }
        else if (extname === 'md') {
            exportingDocument.type = 'md'
        }
    })
    return exportingDocument
}

app.getOpeningDocument = () => openingDocument
app.getExportingDocument = exportDocument

