// 主进程
const electron = require('electron')
const {app, BrowserWindow, dialog, ipcMain} = electron

var mainWindow = null
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    })
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    mainWindow.on('closed', () => mainWindow = null)
}

var openingDocument = {
    HTMLPath: null,
    info: {
        title: '',
        meta: '',
        tags: []
    }
}
app.getOpeningDocument = () => openingDocument

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
ipcMain.on('save-dialog', function (event) {
    const options = {
        title: '保存文件',
        filters: [{name: 'HTML', extensions: ['html', 'htm']}]
    }
    dialog.showSaveDialog(options, function (filename) {
        event.sender.send('saved-file', filename)
    })
})

