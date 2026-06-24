# 行行出狀元 (Stroke Champs) - micro:bit 動作感測程式
# 專門識別中文筆劃動作並透過藍牙傳送給手機 app

from microbit import *
import radio
import music

# 初始化藍牙通訊
radio.on()
radio.config(channel=7)  # 設定通訊頻道

# 動作識別參數
THRESHOLD = 500  # 動作識別閾值
last_gesture = ""
gesture_count = 0

# 筆劃類型
STROKES = {
    "horizontal": "橫",  # 一
    "vertical": "豎",    # 丨  
    "left_fall": "撇",   # 丿
    "right_fall": "捺",  # 丶
    "dot": "點"          # 丶
}

def detect_stroke():
    """檢測筆劃動作"""
    global last_gesture, gesture_count
    
    # 讀取加速度計數據
    x = accelerometer.get_x()
    y = accelerometer.get_y() 
    z = accelerometer.get_z()
    
    detected_stroke = None
    
    # 橫劃檢測：向右快速移動
    if x > THRESHOLD and abs(y) < THRESHOLD/2:
        detected_stroke = "horizontal"
        display.show("一")
        
    # 豎劃檢測：向下快速移動  
    elif y > THRESHOLD and abs(x) < THRESHOLD/2:
        detected_stroke = "vertical"
        display.show("丨")
        
    # 撇劃檢測：左上到右下
    elif x < -THRESHOLD/2 and y > THRESHOLD/2:
        detected_stroke = "left_fall"
        display.show("丿")
        
    # 捺劃檢測：右上到左下
    elif x > THRESHOLD/2 and y > THRESHOLD/2:
        detected_stroke = "right_fall" 
        display.show("丶")
        
    # 點劃檢測：快速向下點擊
    elif abs(z) > THRESHOLD*1.5:
        detected_stroke = "dot"
        display.show("·")
    
    # 如果檢測到新動作
    if detected_stroke and detected_stroke != last_gesture:
        last_gesture = detected_stroke
        gesture_count += 1
        
        # 播放確認音效
        music.pitch(800, 200)
        
        # 透過藍牙發送動作數據給手機
        message = f"{detected_stroke}:{gesture_count}"
        radio.send(message)
        
        # 顯示動作確認
        sleep(500)
        display.show(Image.HAPPY)
        sleep(300)
        display.clear()
        
        return detected_stroke
    
    return None

def show_startup_animation():
    """開機動畫"""
    display.scroll("行行出狀元", delay=100)
    display.show(Image.SWORD)
    sleep(1000)
    display.scroll("準備好了嗎？", delay=100)
    
    # 顯示操作說明
    for stroke_name, stroke_char in STROKES.items():
        display.scroll(f"{stroke_char}", delay=150)
        sleep(500)

def calibrate_sensor():
    """感測器校準"""
    display.scroll("校準中...", delay=100)
    
    # 讓用戶保持靜止 3 秒進行校準
    for i in range(3):
        display.show(str(3-i))
        sleep(1000)
    
    display.show(Image.YES)
    music.play(music.BA_DING)
    sleep(500)

def show_connection_status():
    """顯示連接狀態"""
    display.scroll("等待連接手機...", delay=100)
    
    # 等待手機 app 連接確認
    while True:
        incoming = radio.receive()
        if incoming == "connected":
            display.show(Image.HEART)
            music.play(music.POWER_UP)
            sleep(1000)
            break
        elif button_a.was_pressed():
            # 手動跳過連接等待
            display.show(Image.YES)
            break
        sleep(100)

# 主程式
def main():
    global gesture_count
    
    # 開機流程
    show_startup_animation()
    calibrate_sensor()
    show_connection_status()
    
    display.scroll("遊戲開始！", delay=100)
    gesture_count = 0
    
    # 主遊戲循環
    while True:
        # 檢測筆劃動作
        stroke = detect_stroke()
        
        # 按鈕功能
        if button_a.was_pressed():
            # A 鍵：重置計數
            gesture_count = 0
            display.scroll("重置", delay=100)
            radio.send("reset")
            
        elif button_b.was_pressed():
            # B 鍵：顯示幫助
            display.scroll("橫豎撇捺點", delay=100)
            
        elif button_a.is_pressed() and button_b.is_pressed():
            # A+B 鍵：退出遊戲
            display.scroll("再見！", delay=100)
            break
            
        # 接收手機 app 的指令
        incoming = radio.receive()
        if incoming:
            if incoming == "success":
                # 筆劃正確
                display.show(Image.HAPPY)
                music.play(music.BA_DING)
                sleep(1000)
                
            elif incoming == "wrong":
                # 筆劃錯誤
                display.show(Image.SAD)
                music.play(music.WAWAWAWAA)
                sleep(1000)
                
            elif incoming == "level_complete":
                # 關卡完成
                display.show(Image.HEART)
                music.play(music.POWER_UP)
                sleep(2000)
                
            elif incoming.startswith("show:"):
                # 顯示特定字符
                char = incoming.split(":")[1]
                display.scroll(char, delay=200)
        
        sleep(50)  # 短暫延遲避免過度檢測

# 錯誤處理
try:
    main()
except Exception as e:
    display.scroll("錯誤", delay=100)
    display.show(Image.SKULL)

# 程式結束
display.clear()