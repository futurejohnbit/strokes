# 筆劃俠客遊戲 - micro:bit 集成版

## 🎮 项目介绍
结合 micro:bit 陀螺仪动作识别和中文笔划学习的创新教育游戏。

## 🔗 在线演示 (Demo)
👉 **[点击这里体验游戏](https://strokesyyt1-qmi12nz4m-john-tyys-projects.vercel.app)**
*(需使用支持 Web Bluetooth 的浏览器，如 Chrome 或 Edge)*

## 📦 部署到 Vercel

### 方法 1：通过 GitHub（推荐）

1. **创建 GitHub 仓库**
   ```bash
   # 在本地创建项目文件夹
   mkdir stroke-hero-game
   cd stroke-hero-game
   
   # 复制以下文件到文件夹：
   # - index.html
   # - vercel.json
   ```

2. **上传到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/stroke-hero-game.git
   git push -u origin main
   ```

3. **在 Vercel 部署**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 点击 "Deploy"
   - 完成！🎉

### 方法 2：直接上传（更快）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New..." → "Project"
3. 选择 "Deploy from template" 或直接拖拽文件夹
4. 确保项目根目录包含 `index.html` 和 `vercel.json`
5. 点击 "Deploy"

## 🔧 micro:bit 设置

### Step 1: 修改你的 Create AI 项目

在你训练好的 micro:bit 项目中添加蓝牙发送代码：

```javascript
// 在 MakeCode 编辑器中
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Heart)
})

bluetooth.startUartService()

// 当你的 AI 模型识别到笔划后，发送对应代码
// 假设识别结果存在 result 变量中

if (result == "横") {
    bluetooth.uartWriteLine("HENG")
} else if (result == "竖") {
    bluetooth.uartWriteLine("SHU")
} else if (result == "撇") {
    bluetooth.uartWriteLine("PIE")
} else if (result == "捺") {
    bluetooth.uartWriteLine("NA")
} else if (result == "点") {
    bluetooth.uartWriteLine("DIAN")
} else if (result == "勾") {
    bluetooth.uartWriteLine("GOU")
} else if (result == "横折") {
    bluetooth.uartWriteLine("HENGZHE")
} else if (result == "横折勾") {
    bluetooth.uartWriteLine("HENGZHEGOU")
}
```

### Step 2: 烧录程序

1. 连接 micro:bit 到电脑
2. 下载 .hex 文件
3. 复制到 MICROBIT 驱动器
4. 等待黄灯停止闪烁

### Step 3: 配对蓝牙（首次使用）

1. 同时按住 micro:bit 的 A+B 键
2. 按下背面的 RESET 按钮（同时保持按住 A+B）
3. LED 显示配对图案
4. 松开所有按钮
5. 在游戏网页中点击"连接 micro:bit"

## 🎯 使用说明

### 在电脑上测试

1. 打开 Chrome 或 Edge 浏览器（必须支持 Web Bluetooth）
2. 访问你的 Vercel 网址（https://你的项目名.vercel.app）
3. 点击"🔌 连接 micro:bit"按钮
4. 选择你的 micro:bit 设备
5. 开始玩游戏！

### 展示当天

**设备清单：**
- ✅ micro:bit（已烧录程序）
- ✅ 电池盒或 USB 线
- ✅ 笔记本电脑（Chrome/Edge 浏览器）
- ✅ 投影仪/大屏幕（可选）

**备用方案：**
1. 准备演示视频
2. 准备键盘操作版本（按钮仍然可用）
3. 准备截图展示

## 🐛 故障排除

### 无法连接 micro:bit？

1. **检查浏览器**
   - 必须使用 Chrome 或 Edge
   - 不支持：Safari、Firefox（手机版）

2. **检查蓝牙**
   - 确保电脑蓝牙已开启
   - micro:bit 已开机且 LED 显示正常

3. **重新配对**
   - 断开所有已连接的蓝牙设备
   - 重启 micro:bit
   - 再次尝试配对

### micro:bit 没有反应？

1. 检查电池是否有电
2. 确认程序已正确烧录
3. 查看 LED 是否显示心形（已连接）
4. 按 F12 打开控制台查看错误信息

### 识别不准确？

1. 重新训练 Create AI 模型
2. 增加训练样本数量
3. 调整识别阈值

## 📱 手机版本（进阶）

如果需要手机版本：

1. 使用 **Web Bluetooth API**（Android Chrome 支持）
2. iOS 不支持 Web Bluetooth，需要开发原生 app

## 🎓 教学建议

### 演示流程（5分钟）

1. **介绍背景**（30秒）
   - 读写障碍学生的挑战
   - 传统 app 的不足

2. **展示创新**（1分钟）
   - micro:bit 动作识别演示
   - 真实笔划动作 vs 手指滑动

3. **现场试玩**（2分钟）
   - 邀请评审试玩
   - 展示不同汉字关卡

4. **技术说明**（1分钟）
   - AI 训练过程
   - Web Bluetooth 整合

5. **教育价值**（30秒）
   - 多感官学习
   - 游戏化激励

## 📊 技术栈

- **前端**：HTML5 + Canvas + Web Bluetooth API
- **数据源**：Make Me a Hanzi（真实笔划数据）
- **硬件**：micro:bit v2 + 陀螺仪
- **AI**：micro:bit Create AI（机器学习）
- **部署**：Vercel（全球 CDN）

## 🔗 有用链接

- [Vercel 文档](https://vercel.com/docs)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [micro:bit MakeCode](https://makecode.microbit.org/)
- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)

## 📧 问题反馈

如有问题，检查浏览器控制台（F12）查看错误信息。

祝展示顺利！🎉
