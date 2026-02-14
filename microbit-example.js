/**
 * micro:bit 笔划识别蓝牙发送器
 * 
 * 使用说明：
 * 1. 打开 https://makecode.microbit.org/
 * 2. 点击 "导入" → "导入文件"
 * 3. 选择这个文件
 * 4. 将此代码整合到你的 Create AI 项目中
 */

// === 初始化蓝牙 ===
bluetooth.startUartService()
basic.showIcon(IconNames.Heart)

// === 主循环 - 集成到你的 AI 识别代码中 ===
basic.forever(function () {
    // 这里是你的 AI 识别代码
    // 假设识别结果存储在变量 recognizedStroke 中
    
    // 示例：当按下 A 键测试横
    if (input.buttonIsPressed(Button.A)) {
        bluetooth.uartWriteLine("HENG")
        basic.showString("一")
        basic.pause(500)
    }
    
    // 示例：当按下 B 键测试竖
    if (input.buttonIsPressed(Button.B)) {
        bluetooth.uartWriteLine("SHU")
        basic.showString("丨")
        basic.pause(500)
    }
})

// === 实际使用时的代码模板 ===
// 在你的 AI 模型识别完成后，添加类似以下的代码：

/*
function sendStrokeToGame(strokeType: string) {
    if (strokeType == "横") {
        bluetooth.uartWriteLine("HENG")
        basic.showString("一")
    } else if (strokeType == "竖") {
        bluetooth.uartWriteLine("SHU")
        basic.showString("丨")
    } else if (strokeType == "撇") {
        bluetooth.uartWriteLine("PIE")
        basic.showString("丿")
    } else if (strokeType == "捺") {
        bluetooth.uartWriteLine("NA")
        basic.showString("丶")
    } else if (strokeType == "点") {
        bluetooth.uartWriteLine("DIAN")
        basic.showString("、")
    } else if (strokeType == "勾") {
        bluetooth.uartWriteLine("GOU")
        basic.showString("亅")
    } else if (strokeType == "横折") {
        bluetooth.uartWriteLine("HENGZHE")
        basic.showString("乛")
    } else if (strokeType == "横折勾") {
        bluetooth.uartWriteLine("HENGZHEGOU")
        basic.showString("⺄")
    }
    
    // 短暂延迟避免重复发送
    basic.pause(300)
}

// 当你的 AI 识别完成后调用：
// sendStrokeToGame(你的识别结果变量)
*/

// === 蓝牙连接指示 ===
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Yes)
    basic.pause(1000)
    basic.showIcon(IconNames.Heart)
})

bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.No)
    basic.pause(1000)
    basic.showIcon(IconNames.Heart)
})

// === 调试功能：通过串口同时发送 ===
// 如果你想同时通过 USB 串口测试，取消下面的注释：

/*
function sendStrokeDebug(strokeType: string) {
    serial.writeLine(strokeType)  // 串口发送
    bluetooth.uartWriteLine(strokeType)  // 蓝牙发送
}
*/
