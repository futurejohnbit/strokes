# 更新後的 micro:bit 代碼：
# 1. 保留原本 CreateAI 事件與單字節筆畫碼
# 2. 額外用 MPU6050 送出 imuAssist JSON
# 3. 第一版只用來補強「撇 / left-down」判斷
# 4. 按住 A 持續取樣，放開 A 才結算 imuAssist
# 5. 按 B 重新校正 6050 零偏
#
# 筆畫代碼對照表：
# 1 = 橫
# 2 = 豎
# 3 = 提
# 4 = 捺
# 5 = 點
# 6 = 橫撇
# 7 = 豎鉤
# 8 = 橫豎鉤

MPU_ADDR = 0x68
GYRO_SCALE = 131
PIE_NEG_GX_THRESHOLD = 120
PIE_POS_GY_THRESHOLD = 70
PIE_CONFIRM_THRESHOLD = 0.72
ASSIST_SAMPLE_DELAY_MS = 20

gyro_bias_x = 0
gyro_bias_y = 0
gyro_bias_z = 0
mpu_ready = False
a_hold_was_pressed = False
a_hold_emitted = False


def clamp(v, lo, hi):
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def s16(hi, lo):
    value = (hi << 8) | lo
    if value & 0x8000:
        value = value - 65536
    return value


def i2c_write_reg(reg, val):
    pins.i2c_write_number(MPU_ADDR, (reg << 8) | (val & 0xFF), NumberFormat.UInt16BE, False)


def i2c_read14(reg):
    pins.i2c_write_number(MPU_ADDR, reg & 0xFF, NumberFormat.UInt8BE, True)
    return pins.i2c_read_buffer(MPU_ADDR, 14, False)


def init_mpu():
    global mpu_ready
    i2c_write_reg(0x6B, 0x00)
    basic.pause(10)
    i2c_write_reg(0x1A, 0x03)
    i2c_write_reg(0x19, 0x04)
    i2c_write_reg(0x1B, 0x00)
    i2c_write_reg(0x1C, 0x00)
    mpu_ready = True


def read_mapped_gyro():
    raw = i2c_read14(0x3B)
    raw_gx = s16(raw[8], raw[9])
    raw_gy = s16(raw[10], raw[11])
    raw_gz = s16(raw[12], raw[13])

    # 沿用既有 6050 研究的軸向重映射：
    # 書寫座標 x = -raw y
    # 書寫座標 y = -raw x
    mapped_gx = -raw_gy
    mapped_gy = -raw_gx
    mapped_gz = -raw_gz
    return [mapped_gx, mapped_gy, mapped_gz]


def calibrate_gyro_bias():
    global gyro_bias_x, gyro_bias_y, gyro_bias_z
    sum_x = 0
    sum_y = 0
    sum_z = 0
    count = 40

    for _index in range(count):
        sample = read_mapped_gyro()
        sum_x += sample[0]
        sum_y += sample[1]
        sum_z += sample[2]
        basic.pause(5)

    gyro_bias_x = sum_x / count
    gyro_bias_y = sum_y / count
    gyro_bias_z = sum_z / count


def compute_pie_score(sum_gx_dps, sum_gy_dps):
    gx_support = clamp((-sum_gx_dps) / PIE_NEG_GX_THRESHOLD, 0, 1)
    gy_support = clamp(sum_gy_dps / PIE_POS_GY_THRESHOLD, 0, 1)
    return Math.round(((gx_support * 0.6) + (gy_support * 0.4)) * 100) / 100


def collect_imu_assist_while_pressed(for_code):
    sum_gx = 0
    sum_gy = 0
    sample_count = 0

    if not mpu_ready:
        return '{"kind":"imuAssist","forCode":"' + for_code + '","imuDir":"unknown","pieScore":0,"sampleCount":0}'

    while input.button_is_pressed(Button.A):
        sample = read_mapped_gyro()
        gx_dps = (sample[0] - gyro_bias_x) / GYRO_SCALE
        gy_dps = (sample[1] - gyro_bias_y) / GYRO_SCALE

        sum_gx += gx_dps
        sum_gy += gy_dps
        sample_count += 1
        basic.pause(ASSIST_SAMPLE_DELAY_MS)

    pie_score = compute_pie_score(sum_gx, sum_gy)

    imu_dir = "unknown"
    if sample_count >= 6 and pie_score >= PIE_CONFIRM_THRESHOLD:
        imu_dir = "left-down"
    elif sum_gx >= PIE_NEG_GX_THRESHOLD and sum_gy >= PIE_POS_GY_THRESHOLD:
        imu_dir = "right-down"

    return '{"kind":"imuAssist","forCode":"' + for_code + '","imuDir":"' + imu_dir + '","pieScore":' + convert_to_text(pie_score) + ',"sumGX":' + convert_to_text(Math.round(sum_gx)) + ',"sumGY":' + convert_to_text(Math.round(sum_gy)) + ',"sampleCount":' + convert_to_text(sample_count) + '}'


def emit_stroke_signal(icon_name, stroke_code):
    global a_hold_emitted
    if not input.button_is_pressed(Button.A):
        return

    a_hold_emitted = True
    basic.show_icon(icon_name)
    bluetooth.uart_write_line(stroke_code)
    basic.pause(20)
    bluetooth.uart_write_line(collect_imu_assist_while_pressed(stroke_code))


def emit_blank_signal():
    bluetooth.uart_write_line("0")


bluetooth.start_uart_service()
basic.show_icon(IconNames.HEART)
init_mpu()
basic.show_icon(IconNames.SMALL_DIAMOND)
calibrate_gyro_bias()
basic.show_icon(IconNames.YES)
basic.pause(300)
basic.clear_screen()


def on_on_start():
    emit_stroke_signal(IconNames.DUCK, "3")  # 提
ml.on_start(ml.event.提, on_on_start)


def on_on_start2():
    emit_stroke_signal(IconNames.STICK_FIGURE, "4")  # 捺
ml.on_start(ml.event.捺, on_on_start2)


def on_on_start3():
    emit_stroke_signal(IconNames.TORTOISE, "5")  # 點
ml.on_start(ml.event.點, on_on_start3)


def on_on_start4():
    emit_stroke_signal(IconNames.COW, "8")  # 橫豎鉤
ml.on_start(ml.event.橫豎鉤, on_on_start4)


def on_on_start5():
    emit_stroke_signal(IconNames.UMBRELLA, "6")  # 橫撇
ml.on_start(ml.event.橫撇, on_on_start5)


def on_on_start6():
    emit_stroke_signal(IconNames.GHOST, "2")  # 豎
ml.on_start(ml.event.豎, on_on_start6)


def on_on_start7():
    emit_stroke_signal(IconNames.HOUSE, "1")  # 橫
ml.on_start(ml.event.橫, on_on_start7)


def on_on_start8():
    emit_stroke_signal(IconNames.GIRAFFE, "7")  # 豎鉤
ml.on_start(ml.event.豎鉤, on_on_start8)


def on_on_start9():
    emit_stroke_signal(IconNames.TRIANGLE, "9")
ml.on_start(ml.event.撇, on_on_start9)


def on_button_pressed_a():
    bluetooth.uart_write_line("BTN_A")
input.on_button_pressed(Button.A, on_button_pressed_a)


def on_button_pressed_b():
    bluetooth.uart_write_line("BTN_B")
input.on_button_pressed(Button.B, on_button_pressed_b)


def on_button_pressed_ab():
    bluetooth.uart_write_line("BTN_AB")
input.on_button_pressed(Button.AB, on_button_pressed_ab)


def on_forever():
    global a_hold_was_pressed, a_hold_emitted
    pressed = input.button_is_pressed(Button.A)
    if pressed and not a_hold_was_pressed:
        a_hold_emitted = False
    if (not pressed) and a_hold_was_pressed:
        if not a_hold_emitted:
            emit_blank_signal()
    a_hold_was_pressed = pressed
    basic.pause(20)
basic.forever(on_forever)
