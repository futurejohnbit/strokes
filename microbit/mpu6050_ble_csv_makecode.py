MPU_ADDR = 0x68
G0 = 9.80665

map_m = [
    0, -1, 0,
    -1, 0, 0,
    0, 0, -1
]

acc_bias = [0, 0, 0]
gyro_bias = [0, 0, 0]

alpha = 0.98
deadzone_deg = 3
zupt_acc_ms2 = 0.35
zupt_gyro_dps = 2
stationary_hold_ms = 120

dist_thr_mm = 2
time_thr_ms = 20

roll0 = 0
pitch0 = 0
roll = 0
pitch = 0

lax_lp = 0
lay_lp = 0
vx_lp = 0
vy_lp = 0
lax_inited = False
lay_inited = False
vx_inited = False
vy_inited = False

vx = 0
vy = 0
px = 0
py = 0

last_ms = 0
stationary_ms = 0

last_emit_ms = 0
last_emit_x = 0
last_emit_y = 0
seq = 0

stream = True
gate_mode = True
gate_prev = False
ab_prev = False


def clamp(v, lo, hi):
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def deadzone(v, dz):
    if v > dz:
        return v - dz
    if v < -dz:
        return v + dz
    return 0


def lp_update(x, alpha_lp, val, inited):
    if not inited:
        return x, True
    return val + alpha_lp * (x - val), True


def i2c_write_reg(reg, val):
    pins.i2c_write_number(MPU_ADDR, (reg << 8) | (val & 0xFF), NumberFormat.UInt16BE, False)


def i2c_read14(reg):
    pins.i2c_write_number(MPU_ADDR, reg & 0xFF, NumberFormat.UInt8BE, True)
    return pins.i2c_read_buffer(MPU_ADDR, 14, False)


def s16(hi, lo):
    v = (hi << 8) | lo
    if v & 0x8000:
        v = v - 65536
    return v


def apply_map(x, y, z):
    mx = map_m[0] * x + map_m[1] * y + map_m[2] * z
    my = map_m[3] * x + map_m[4] * y + map_m[5] * z
    mz = map_m[6] * x + map_m[7] * y + map_m[8] * z
    return [mx, my, mz]


def read_raw():
    b = i2c_read14(0x3B)
    ax = s16(b[0], b[1])
    ay = s16(b[2], b[3])
    az = s16(b[4], b[5])
    gx = s16(b[8], b[9])
    gy = s16(b[10], b[11])
    gz = s16(b[12], b[13])
    return [ax, ay, az, gx, gy, gz]


def init_mpu():
    i2c_write_reg(0x6B, 0x00)
    basic.pause(10)
    i2c_write_reg(0x1A, 0x03)
    i2c_write_reg(0x19, 0x04)
    i2c_write_reg(0x1B, 0x00)
    i2c_write_reg(0x1C, 0x00)


def reset_state(now_ms):
    global vx, vy, px, py, last_ms, stationary_ms, last_emit_ms, last_emit_x, last_emit_y, seq
    vx = 0
    vy = 0
    px = 0
    py = 0
    last_ms = now_ms
    stationary_ms = 0
    last_emit_ms = now_ms
    last_emit_x = 0
    last_emit_y = 0
    seq = 0


def calibrate(duration_ms):
    global acc_bias, gyro_bias, roll0, pitch0, roll, pitch
    t0 = input.running_time()
    n = 0
    sax = 0
    say = 0
    saz = 0
    sgx = 0
    sgy = 0
    sgz = 0
    while input.running_time() - t0 < duration_ms:
        r = read_raw()
        a = apply_map(r[0], r[1], r[2])
        g = apply_map(r[3], r[4], r[5])
        sax += a[0]
        say += a[1]
        saz += a[2]
        sgx += g[0]
        sgy += g[1]
        sgz += g[2]
        n += 1
        basic.pause(5)

    if n <= 0:
        return False

    mx = sax / n
    my = say / n
    mz = saz / n
    mg = Math.sqrt(mx * mx + my * my + mz * mz)
    if mg == 0:
        return False

    ux = mx / mg
    uy = my / mg
    uz = mz / mg

    acc_bias = [mx - ux * 16384, my - uy * 16384, mz - uz * 16384]
    gyro_bias = [sgx / n, sgy / n, sgz / n]

    ax_ms2 = (mx - acc_bias[0]) / 16384 * G0
    ay_ms2 = (my - acc_bias[1]) / 16384 * G0
    az_ms2 = (mz - acc_bias[2]) / 16384 * G0

    roll0 = Math.atan2(ay_ms2, az_ms2) * 180 / Math.PI
    pitch0 = Math.atan2(-ax_ms2, Math.sqrt(ay_ms2 * ay_ms2 + az_ms2 * az_ms2)) * 180 / Math.PI
    roll = roll0
    pitch = pitch0
    return True


def send_xy(x_mm, y_mm):
    bluetooth.uart_write_line("" + convert_to_text(x_mm) + "," + convert_to_text(y_mm))

def send_gate(on):
    bluetooth.uart_write_line("G," + ("1" if on else "0"))

def send_gate_mode(on):
    bluetooth.uart_write_line("GM," + ("1" if on else "0"))


def on_start():
    global last_ms, last_emit_ms
    bluetooth.start_uart_service()
    basic.show_icon(IconNames.HEART)
    init_mpu()
    basic.show_icon(IconNames.SMALL_DIAMOND)
    ok = calibrate(5000)
    basic.show_icon(IconNames.YES if ok else IconNames.NO)
    basic.pause(400)
    basic.clear_screen()
    now = input.running_time()
    last_ms = now
    last_emit_ms = now


on_start()

def on_button_pressed_b():
    global gate_mode
    gate_mode = not gate_mode
    send_gate_mode(gate_mode)
    basic.show_icon(IconNames.TARGET if gate_mode else IconNames.SQUARE)
    basic.pause(200)
    basic.clear_screen()
input.on_button_pressed(Button.B, on_button_pressed_b)


def forever():
    global roll, pitch, lax_lp, lay_lp, vx_lp, vy_lp, lax_inited, lay_inited, vx_inited, vy_inited
    global vx, vy, px, py, last_ms, stationary_ms, last_emit_ms, last_emit_x, last_emit_y, seq, stream, gate_mode, gate_prev, ab_prev

    now_ms = input.running_time()
    dt = (now_ms - last_ms) / 1000
    if dt <= 0:
        dt = 0.001
    if dt > 0.2:
        dt = 0.2
    last_ms = now_ms

    ab = input.button_is_pressed(Button.AB)
    if ab and not ab_prev:
        reset_state(now_ms)
    ab_prev = ab

    gate = input.button_is_pressed(Button.A)
    if gate != gate_prev:
        send_gate(gate)
        reset_state(now_ms)
        gate_prev = gate

    if gate_mode and not gate:
        basic.pause(10)
        return

    r = read_raw()
    a = apply_map(r[0], r[1], r[2])
    g = apply_map(r[3], r[4], r[5])

    ax_m = a[0] - acc_bias[0]
    ay_m = a[1] - acc_bias[1]
    az_m = a[2] - acc_bias[2]
    gx_m = g[0] - gyro_bias[0]
    gy_m = g[1] - gyro_bias[1]
    gz_m = g[2] - gyro_bias[2]

    ax_ms2 = (ax_m / 16384) * G0
    ay_ms2 = (ay_m / 16384) * G0
    az_ms2 = (az_m / 16384) * G0
    gx_dps = gx_m / 131
    gy_dps = gy_m / 131
    gz_dps = gz_m / 131

    roll_acc = Math.atan2(ay_ms2, az_ms2) * 180 / Math.PI
    pitch_acc = Math.atan2(-ax_ms2, Math.sqrt(ay_ms2 * ay_ms2 + az_ms2 * az_ms2)) * 180 / Math.PI

    roll = alpha * (roll + gx_dps * dt) + (1 - alpha) * roll_acc
    pitch = alpha * (pitch + gy_dps * dt) + (1 - alpha) * pitch_acc

    roll_use = roll0 + deadzone(roll - roll0, deadzone_deg)
    pitch_use = pitch0 + deadzone(pitch - pitch0, deadzone_deg)

    sr = Math.sin(roll_use * Math.PI / 180)
    cr = Math.cos(roll_use * Math.PI / 180)
    sp = Math.sin(pitch_use * Math.PI / 180)
    cp = Math.cos(pitch_use * Math.PI / 180)

    gxg = -G0 * sp
    gyg = G0 * sr * cp
    gzg = G0 * cr * cp

    lax = ax_ms2 - gxg
    lay = ay_ms2 - gyg
    laz = az_ms2 - gzg

    lax_lp, lax_inited = lp_update(lax, 0.25, lax_lp, lax_inited)
    lay_lp, lay_inited = lp_update(lay, 0.25, lay_lp, lay_inited)

    gyro_mag = Math.sqrt(gx_dps * gx_dps + gy_dps * gy_dps + gz_dps * gz_dps)
    lin_mag = Math.sqrt(lax_lp * lax_lp + lay_lp * lay_lp + laz * laz)
    stationary_now = (gyro_mag <= zupt_gyro_dps) and (lin_mag <= zupt_acc_ms2)

    if stationary_now:
        stationary_ms += dt * 1000
    else:
        stationary_ms = 0

    if stationary_ms >= stationary_hold_ms:
        vx = 0
        vy = 0

    vx = vx + lax_lp * dt
    vy = vy + lay_lp * dt
    vx_lp, vx_inited = lp_update(vx, 0.15, vx_lp, vx_inited)
    vy_lp, vy_inited = lp_update(vy, 0.15, vy_lp, vy_inited)
    vx = vx_lp
    vy = vy_lp

    px = px + vx * dt
    py = py + vy * dt

    x_mm = px * 1000
    y_mm = py * 1000

    dx = x_mm - last_emit_x
    dy = y_mm - last_emit_y
    dist_mm = Math.sqrt(dx * dx + dy * dy)
    dt_emit = now_ms - last_emit_ms

    if stream and ((dist_mm >= dist_thr_mm) or (dt_emit >= time_thr_ms)):
        last_emit_x = x_mm
        last_emit_y = y_mm
        last_emit_ms = now_ms
        seq += 1
        send_xy(Math.round(x_mm), Math.round(y_mm))

    basic.pause(10)


basic.forever(forever)
