# 更新後的 micro:bit 代碼（添加藍牙發送）

# === 在程序開始時添加 ===
bluetooth.start_uart_service()
basic.show_icon(IconNames.HEART)

# === 修改每個識別事件，添加藍牙發送 ===

def on_on_start():
    basic.show_icon(IconNames.DUCK)
    bluetooth.uart_write_line("TI")  # 添加這行
ml.on_start(ml.event.提, on_on_start)

def on_on_start2():
    basic.show_icon(IconNames.STICK_FIGURE)
    bluetooth.uart_write_line("NA")  # 添加這行
ml.on_start(ml.event.捺, on_on_start2)

def on_on_start3():
    basic.show_icon(IconNames.TORTOISE)
    bluetooth.uart_write_line("DIAN")  # 添加這行
ml.on_start(ml.event.點, on_on_start3)

def on_on_start4():
    basic.show_icon(IconNames.COW)
    bluetooth.uart_write_line("HENGSHUGOU")  # 添加這行
ml.on_start(ml.event.橫豎鉤, on_on_start4)

def on_on_start5():
    basic.show_icon(IconNames.UMBRELLA)
    bluetooth.uart_write_line("HENGPIE")  # 添加這行
ml.on_start(ml.event.橫撇, on_on_start5)

def on_on_start6():
    basic.show_icon(IconNames.GHOST)
    bluetooth.uart_write_line("SHU")  # 添加這行
ml.on_start(ml.event.豎, on_on_start6)

def on_on_start7():
    basic.show_icon(IconNames.HOUSE)
    bluetooth.uart_write_line("HENG")  # 添加這行
ml.on_start(ml.event.橫, on_on_start7)

def on_on_start8():
    basic.show_icon(IconNames.GIRAFFE)
    bluetooth.uart_write_line("SHUGOU")  # 添加這行
ml.on_start(ml.event.豎鉤, on_on_start8)

# === 完整代碼（復制粘貼版本）===
"""
完整步驟：
1. 打開你的 micro:bit MakeCode 項目
2. 切換到 Python 模式
3. 在代碼最開始添加：
   bluetooth.start_uart_service()
   basic.show_icon(IconNames.HEART)

4. 在每個 ml.on_start 函數內部添加 bluetooth.uart_write_line()
   
5. 下載並燒錄到 micro:bit
"""
