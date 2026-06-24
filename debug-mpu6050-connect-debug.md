[OPEN] mpu6050-connect-debug

# 调试会话
- 会话ID: `mpu6050-connect-debug`
- 日期: `2026-06-15`
- 症状: mpu6050 已连接，但调试页面无法通过蓝牙或 USB 正确连接设备
- 当前状态: 收集上下文与提出可证伪假设

# 初始假设
1. 调试页使用的连接协议或设备筛选条件与当前 micro:bit / 串口设备不匹配，导致蓝牙和 USB 都在发现阶段失败。
2. 前端连接逻辑依赖浏览器能力（Web Serial / Web Bluetooth / HTTPS / Chrome 权限），但当前环境不满足，页面没有正确处理能力检测或权限报错。
3. USB/蓝牙连接入口实际调用了错误的后端接口、错误端口或过时脚本，导致“看起来能点连接，但握手失败”。
4. mpu6050 采集程序正常运行，但没有按调试页预期的串口格式输出数据，连接建立后被页面判定为无效设备。
5. 代码仓库中存在多个版本文件，当前打开/运行的页面与实际修改的 Python 或前端脚本不是同一套，导致排查对象错位。

# 待收集证据
- 项目结构与实际调试页入口文件
- 蓝牙与 USB 连接实现代码
- Python 端串口/蓝牙输出格式
- 浏览器或运行时错误信息

# 当前证据
- 调试页入口为 `claude_ver/stroke test/src/StrokeTest.jsx`，页面路径是 `/debug`。
- `StrokeTest.jsx` 的蓝牙数据解析只支持 `x,y`、`x,y,z`、JSON 行、`G,1/0`，未处理单字节 `1-8`。
- `StrokeTest.jsx` 的 USB 路线实际使用 `navigator.serial`（Web Serial），不是 WebUSB。
- 当前打开的 `microbit-updated-code.py` 只调用 `bluetooth.uart_write_string("1"..."8")`，没有任何 USB 串口输出逻辑。
- 正式页面 `GeminiApp.jsx` 已内置 `1-8 -> 笔画 token` 的映射，而调试页没有这层兼容。

# 初步结论
1. 若设备烧录的是 `microbit-updated-code.py` 这一类 CreateAI/BLE 单字节方案，则蓝牙能建立物理连接，但 `/debug` 调试页不会正确识别数据。
2. 同一固件下 USB 调试失败是预期现象，因为该文件没有输出 Web Serial 需要的串口数据。
3. 若用户目标是调试 MPU6050 连续轨迹，应改用 `microbit/mpu6050_stroke.py`、`microbit/mpu6050_stroke_lite.py` 或 `microbit/mpu6050_ble_csv_makecode.py` 对应的协议。

# 用户补充
- 当前烧录代码类型：`CreateAI 单字节`
- 当前浏览器环境：`Chrome/Edge 桌面`

# 假设判定
- 假设 1（设备筛选条件不匹配）：暂未证实，当前更强证据指向协议不匹配而非扫描失败。
- 假设 2（浏览器能力/权限问题）：基本排除，用户在支持环境中操作。
- 假设 3（连接入口调用错误链路）：部分成立，用户进入的是连续轨迹调试页，但固件输出的是离散笔画码。
- 假设 4（串口输出格式不符合预期）：成立。
- 假设 5（运行的不是同一套代码）：成立，主页面支持 `1-8`，调试页不支持。
