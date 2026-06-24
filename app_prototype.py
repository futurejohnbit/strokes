# 行行出狀元手機 App 原型 (MIT App Inventor 參考代碼)
# 這是 Python 偽代碼，用於說明 App 的邏輯結構

import random
import time

class StrokeHeroApp:
    def __init__(self):
        # 遊戲狀態
        self.current_level = 1
        self.score = 0
        self.character_progress = []
        self.game_state = "menu"  # menu, playing, paused, completed
        
        # 當前關卡數據
        self.current_character = None
        self.required_strokes = []
        self.completed_strokes = []
        self.player_position = (0, 0)
        self.enemy_position = (10, 10)
        
        # 字庫數據（簡化版）
        self.character_database = {
            1: {  # 第一關
                "character": "人",
                "strokes": ["left_fall", "right_fall"],
                "maze_layout": self.generate_person_maze(),
                "story": "小明被困在「人」字迷宮中，快用正確的筆劃順序幫他逃脫！"
            },
            2: {  # 第二關
                "character": "大",
                "strokes": ["horizontal", "left_fall", "right_fall"],
                "maze_layout": self.generate_big_maze(),
                "story": "這次迷宮更大了！記住「大」字的筆順：一、丿、丶"
            },
            3: {  # 第三關
                "character": "木",
                "strokes": ["horizontal", "vertical", "left_fall", "right_fall"],
                "maze_layout": self.generate_wood_maze(),
                "story": "森林迷宮！用「木」字的筆劃找到出路。"
            }
        }
        
        # 藍牙連接
        self.bluetooth_connected = False
        self.microbit_data = ""
    
    def generate_person_maze(self):
        """生成「人」字形迷宮佈局"""
        # 簡化的迷宮表示：0=牆壁, 1=通道, 2=起點, 3=終點, 4=傳送點
        return [
            [0, 0, 2, 0, 0],  # 起點在中間上方
            [0, 1, 1, 1, 0],  # 撇劃通道
            [1, 1, 4, 1, 1],  # 中間傳送點
            [1, 0, 1, 0, 1],  # 捺劃通道
            [3, 0, 1, 0, 3]   # 兩個出口
        ]
    
    def generate_big_maze(self):
        """生成「大」字形迷宮佈局"""
        return [
            [0, 0, 2, 0, 0],  # 起點
            [1, 1, 1, 1, 1],  # 橫劃
            [0, 1, 4, 1, 0],  # 傳送點
            [1, 1, 1, 1, 1],  # 撇捺交叉
            [3, 0, 1, 0, 3]   # 出口
        ]
    
    def generate_wood_maze(self):
        """生成「木」字形迷宮佈局"""
        return [
            [0, 1, 2, 1, 0],  # 起點
            [0, 1, 1, 1, 0],  # 豎劃
            [1, 1, 4, 1, 1],  # 橫劃+傳送點
            [0, 1, 1, 1, 0],  # 豎劃延續
            [3, 1, 1, 1, 3]   # 撇捺+出口
        ]
    
    def start_game(self):
        """開始遊戲"""
        self.game_state = "playing"
        self.load_level(self.current_level)
        self.send_to_microbit("connected")
        print(f"遊戲開始！當前關卡：{self.current_level}")
        print(f"故事：{self.current_character['story']}")
    
    def load_level(self, level):
        """載入關卡"""
        if level in self.character_database:
            self.current_character = self.character_database[level]
            self.required_strokes = self.current_character["strokes"].copy()
            self.completed_strokes = []
            self.player_position = self.find_start_position()
            print(f"載入關卡 {level}：{self.current_character['character']}")
            print(f"需要的筆劃順序：{self.required_strokes}")
    
    def find_start_position(self):
        """找到迷宮起點"""
        maze = self.current_character["maze_layout"]
        for y in range(len(maze)):
            for x in range(len(maze[y])):
                if maze[y][x] == 2:  # 起點
                    return (x, y)
        return (0, 0)
    
    def process_microbit_input(self, stroke_data):
        """處理 micro:bit 傳來的筆劃數據"""
        if ":" in stroke_data:
            stroke_type, count = stroke_data.split(":")
            print(f"收到筆劃：{stroke_type} (第{count}次)")
            
            # 檢查是否為正確的下一個筆劃
            if self.required_strokes and stroke_type == self.required_strokes[0]:
                self.execute_correct_stroke(stroke_type)
            else:
                self.execute_wrong_stroke(stroke_type)
    
    def execute_correct_stroke(self, stroke_type):
        """執行正確的筆劃"""
        # 移除已完成的筆劃
        completed_stroke = self.required_strokes.pop(0)
        self.completed_strokes.append(completed_stroke)
        
        # 移動玩家角色
        self.move_player_by_stroke(stroke_type)
        
        # 給予正面回饋
        self.send_to_microbit("success")
        self.score += 10
        
        print(f"正確！完成筆劃：{stroke_type}")
        print(f"剩餘筆劃：{self.required_strokes}")
        
        # 檢查是否完成關卡
        if not self.required_strokes:
            self.complete_level()
    
    def execute_wrong_stroke(self, stroke_type):
        """執行錯誤的筆劃"""
        self.send_to_microbit("wrong")
        self.score = max(0, self.score - 5)  # 扣分但不低於0
        
        print(f"錯誤！期望筆劃：{self.required_strokes[0] if self.required_strokes else '無'}，收到：{stroke_type}")
        
        # 顯示提示
        if self.required_strokes:
            expected = self.required_strokes[0]
            hint_map = {
                "horizontal": "請向右揮動 micro:bit（橫劃）",
                "vertical": "請向下揮動 micro:bit（豎劃）", 
                "left_fall": "請從右上向左下揮動（撇劃）",
                "right_fall": "請從左上向右下揮動（捺劃）",
                "dot": "請快速向下點擊（點劃）"
            }
            print(f"提示：{hint_map.get(expected, '未知筆劃')}")
    
    def move_player_by_stroke(self, stroke_type):
        """根據筆劃類型移動玩家"""
        x, y = self.player_position
        
        # 根據筆劃類型決定移動方向
        move_map = {
            "horizontal": (1, 0),   # 向右
            "vertical": (0, 1),     # 向下
            "left_fall": (-1, 1),   # 左下
            "right_fall": (1, 1),   # 右下
            "dot": (0, 0)           # 原地（特殊動作）
        }
        
        if stroke_type in move_map:
            dx, dy = move_map[stroke_type]
            new_x, new_y = x + dx, y + dy
            
            # 檢查邊界和牆壁
            maze = self.current_character["maze_layout"]
            if (0 <= new_x < len(maze[0]) and 
                0 <= new_y < len(maze) and 
                maze[new_y][new_x] != 0):  # 不是牆壁
                
                self.player_position = (new_x, new_y)
                print(f"玩家移動到：{self.player_position}")
                
                # 檢查是否到達傳送點
                if maze[new_y][new_x] == 4:
                    self.handle_teleport()
    
    def handle_teleport(self):
        """處理傳送點邏輯"""
        print("到達傳送點！準備傳送到下一筆劃起點...")
        # 這裡可以添加傳送動畫和音效
        time.sleep(1)
        
        # 找到下一個合適的位置（簡化處理）
        maze = self.current_character["maze_layout"]
        for y in range(len(maze)):
            for x in range(len(maze[y])):
                if maze[y][x] == 1 and (x, y) != self.player_position:
                    self.player_position = (x, y)
                    print(f"傳送到：{self.player_position}")
                    return
    
    def complete_level(self):
        """完成關卡"""
        self.send_to_microbit("level_complete")
        self.score += 50  # 完成關卡獎勵
        
        print(f"恭喜！完成「{self.current_character['character']}」字關卡！")
        print(f"當前分數：{self.score}")
        
        # 進入下一關
        self.current_level += 1
        if self.current_level <= len(self.character_database):
            print("準備下一關...")
            time.sleep(2)
            self.load_level(self.current_level)
        else:
            self.complete_game()
    
    def complete_game(self):
        """完成整個遊戲"""
        self.game_state = "completed"
        print("🎉 恭喜完成所有關卡！🎉")
        print(f"最終分數：{self.score}")
        print("你已經掌握了基本的中文筆劃順序！")
        
        # 顯示學習成果
        print("\n學習成果總結：")
        for level, data in self.character_database.items():
            if level <= self.current_level - 1:
                print(f"✅ {data['character']} - 筆劃：{', '.join(data['strokes'])}")
    
    def send_to_microbit(self, message):
        """發送訊息給 micro:bit"""
        if self.bluetooth_connected:
            print(f"發送給 micro:bit：{message}")
            # 實際的藍牙發送邏輯會在這裡
        else:
            print(f"模擬發送：{message}")
    
    def reset_game(self):
        """重置遊戲"""
        self.current_level = 1
        self.score = 0
        self.character_progress = []
        self.game_state = "menu"
        print("遊戲已重置")
    
    def show_help(self):
        """顯示幫助信息"""
        help_text = """
        🎮 行行出狀元 - 遊戲說明
        
        🎯 目標：用正確的筆劃順序幫助角色逃出字形迷宮
        
        🕹️ 操作方式：
        • 橫劃（一）：向右揮動 micro:bit
        • 豎劃（丨）：向下揮動 micro:bit  
        • 撇劃（丿）：右上到左下揮動
        • 捺劃（丶）：左上到右下揮動
        • 點劃（·）：快速向下點擊
        
        📱 micro:bit 按鈕：
        • A 鍵：重置當前關卡
        • B 鍵：顯示筆劃提示
        • A+B：退出遊戲
        
        🏆 計分規則：
        • 正確筆劃：+10 分
        • 錯誤筆劃：-5 分
        • 完成關卡：+50 分
        """
        print(help_text)

# 示範如何使用這個 App 類別
def demo_game():
    """遊戲示範"""
    print("=== 行行出狀元 App 示範 ===")
    
    # 創建遊戲實例
    game = StrokeHeroApp()
    
    # 顯示幫助
    game.show_help()
    
    # 開始遊戲
    game.start_game()
    
    # 模擬 micro:bit 輸入
    print("\n=== 模擬遊戲過程 ===")
    
    # 第一關：「人」字 - 需要撇、捺
    print("\n第一關開始...")
    game.process_microbit_input("left_fall:1")   # 正確：撇
    game.process_microbit_input("right_fall:2")  # 正確：捺
    
    # 第二關：「大」字 - 需要橫、撇、捺  
    print("\n第二關開始...")
    game.process_microbit_input("horizontal:3")  # 正確：橫
    game.process_microbit_input("vertical:4")    # 錯誤：應該是撇
    game.process_microbit_input("left_fall:5")   # 正確：撇
    game.process_microbit_input("right_fall:6")  # 正確：捺
    
    print(f"\n遊戲示範結束，最終分數：{game.score}")

if __name__ == "__main__":
    demo_game()