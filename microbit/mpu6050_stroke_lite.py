from microbit import i2c, uart, sleep, running_time, display, Image, button_a, button_b
import math


G0 = 9.80665


def _clamp(v, lo, hi):
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def _deadzone(v, dz):
    if v > dz:
        return v - dz
    if v < -dz:
        return v + dz
    return 0.0


class LowPass:
    def __init__(self, alpha=0.2):
        self.alpha = alpha
        self.v = 0.0
        self.inited = False

    def update(self, x):
        if not self.inited:
            self.v = x
            self.inited = True
            return x
        self.v = self.v + self.alpha * (x - self.v)
        return self.v


class MPU6050:
    def __init__(self, addr=0x68):
        self.addr = addr

    def _w(self, reg, val):
        i2c.write(self.addr, bytes([reg, val]))

    def _r(self, reg, n):
        i2c.write(self.addr, bytes([reg]), repeat=True)
        return i2c.read(self.addr, n)

    def init(self, dlpf=3, smplrt_div=4):
        self._w(0x6B, 0x00)
        sleep(10)
        self._w(0x1A, dlpf & 0x07)
        self._w(0x19, int(smplrt_div) & 0xFF)
        self._w(0x1B, 0x00)
        self._w(0x1C, 0x00)

    def read(self):
        b = self._r(0x3B, 14)
        ax = (b[0] << 8) | b[1]
        ay = (b[2] << 8) | b[3]
        az = (b[4] << 8) | b[5]
        gx = (b[8] << 8) | b[9]
        gy = (b[10] << 8) | b[11]
        gz = (b[12] << 8) | b[13]
        if ax & 0x8000:
            ax -= 65536
        if ay & 0x8000:
            ay -= 65536
        if az & 0x8000:
            az -= 65536
        if gx & 0x8000:
            gx -= 65536
        if gy & 0x8000:
            gy -= 65536
        if gz & 0x8000:
            gz -= 65536
        return ax, ay, az, gx, gy, gz


class StrokeIMULite:
    def __init__(self):
        self.map_m = (0.0, -1.0, 0.0,
                      -1.0, 0.0, 0.0,
                      0.0, 0.0, -1.0)
        self.acc_bias = [0.0, 0.0, 0.0]
        self.gyro_bias = [0.0, 0.0, 0.0]

        self.alpha = 0.98
        self.deadzone_deg = 3.0
        self.zupt_acc_ms2 = 0.35
        self.zupt_gyro_dps = 2.0
        self.stationary_hold_ms = 120

        self.dist_thr_mm = 2.0
        self.time_thr_ms = 20

        self.roll0 = 0.0
        self.pitch0 = 0.0
        self.roll = 0.0
        self.pitch = 0.0

        self.lp_lax = LowPass(0.25)
        self.lp_lay = LowPass(0.25)
        self.lp_vx = LowPass(0.15)
        self.lp_vy = LowPass(0.15)

        self.vx = 0.0
        self.vy = 0.0
        self.px = 0.0
        self.py = 0.0

        self.last_ms = running_time()
        self.last_k_ms = self.last_ms
        self.last_kx = 0.0
        self.last_ky = 0.0
        self.stationary_ms = 0
        self.moving = False
        self.seq = 0

        self.stream = True
        self.mode = "JSON"

    def _apply_map(self, x, y, z):
        m = self.map_m
        return (
            m[0] * x + m[1] * y + m[2] * z,
            m[3] * x + m[4] * y + m[5] * z,
            m[6] * x + m[7] * y + m[8] * z,
        )

    def set_map(self, m9):
        if len(m9) != 9:
            return False
        self.map_m = tuple(float(x) for x in m9)
        return True

    def reset_state(self, now_ms=None):
        if now_ms is None:
            now_ms = running_time()
        self.vx = 0.0
        self.vy = 0.0
        self.px = 0.0
        self.py = 0.0
        self.last_kx = 0.0
        self.last_ky = 0.0
        self.last_k_ms = now_ms
        self.last_ms = now_ms
        self.stationary_ms = 0
        self.moving = False

    def auto_calibrate(self, read_raw, duration_ms=5000):
        t0 = running_time()
        n = 0
        sax = say = saz = 0.0
        sgx = sgy = sgz = 0.0
        while running_time() - t0 < duration_ms:
            ax, ay, az, gx, gy, gz = read_raw()
            ax, ay, az = self._apply_map(ax, ay, az)
            gx, gy, gz = self._apply_map(gx, gy, gz)
            sax += ax
            say += ay
            saz += az
            sgx += gx
            sgy += gy
            sgz += gz
            n += 1
            sleep(5)
        if n <= 0:
            return False

        mx = sax / n
        my = say / n
        mz = saz / n
        mg = math.sqrt(mx * mx + my * my + mz * mz)
        if mg == 0.0:
            return False
        ux = mx / mg
        uy = my / mg
        uz = mz / mg

        self.acc_bias = [mx - ux * 16384.0, my - uy * 16384.0, mz - uz * 16384.0]
        self.gyro_bias = [sgx / n, sgy / n, sgz / n]

        ax_ms2 = (mx - self.acc_bias[0]) / 16384.0 * G0
        ay_ms2 = (my - self.acc_bias[1]) / 16384.0 * G0
        az_ms2 = (mz - self.acc_bias[2]) / 16384.0 * G0
        self.roll0 = math.degrees(math.atan2(ay_ms2, az_ms2))
        self.pitch0 = math.degrees(math.atan2(-ax_ms2, math.sqrt(ay_ms2 * ay_ms2 + az_ms2 * az_ms2)))
        self.roll = self.roll0
        self.pitch = self.pitch0

        self.reset_state(running_time())
        return True

    def update(self, ax_raw, ay_raw, az_raw, gx_raw, gy_raw, gz_raw, now_ms):
        dt = (now_ms - self.last_ms) / 1000.0
        if dt <= 0.0:
            dt = 0.001
        if dt > 0.2:
            dt = 0.2
        self.last_ms = now_ms

        ax_m, ay_m, az_m = self._apply_map(ax_raw, ay_raw, az_raw)
        gx_m, gy_m, gz_m = self._apply_map(gx_raw, gy_raw, gz_raw)

        ax_m -= self.acc_bias[0]
        ay_m -= self.acc_bias[1]
        az_m -= self.acc_bias[2]
        gx_m -= self.gyro_bias[0]
        gy_m -= self.gyro_bias[1]
        gz_m -= self.gyro_bias[2]

        ax_ms2 = (ax_m / 16384.0) * G0
        ay_ms2 = (ay_m / 16384.0) * G0
        az_ms2 = (az_m / 16384.0) * G0
        gx_dps = gx_m / 131.0
        gy_dps = gy_m / 131.0
        gz_dps = gz_m / 131.0

        roll_acc = math.degrees(math.atan2(ay_ms2, az_ms2))
        pitch_acc = math.degrees(math.atan2(-ax_ms2, math.sqrt(ay_ms2 * ay_ms2 + az_ms2 * az_ms2)))

        self.roll = self.alpha * (self.roll + gx_dps * dt) + (1.0 - self.alpha) * roll_acc
        self.pitch = self.alpha * (self.pitch + gy_dps * dt) + (1.0 - self.alpha) * pitch_acc

        roll_use = self.roll0 + _deadzone(self.roll - self.roll0, self.deadzone_deg)
        pitch_use = self.pitch0 + _deadzone(self.pitch - self.pitch0, self.deadzone_deg)

        sr = math.sin(math.radians(roll_use))
        cr = math.cos(math.radians(roll_use))
        sp = math.sin(math.radians(pitch_use))
        cp = math.cos(math.radians(pitch_use))

        gxg = -G0 * sp
        gyg = G0 * sr * cp
        gzg = G0 * cr * cp

        lax = ax_ms2 - gxg
        lay = ay_ms2 - gyg
        laz = az_ms2 - gzg

        lax = self.lp_lax.update(lax)
        lay = self.lp_lay.update(lay)

        gyro_mag = math.sqrt(gx_dps * gx_dps + gy_dps * gy_dps + gz_dps * gz_dps)
        lin_mag = math.sqrt(lax * lax + lay * lay + laz * laz)
        stationary_now = (gyro_mag <= self.zupt_gyro_dps) and (lin_mag <= self.zupt_acc_ms2)

        if stationary_now:
            self.stationary_ms += int(dt * 1000.0)
        else:
            self.stationary_ms = 0

        if self.stationary_ms >= self.stationary_hold_ms:
            self.vx = 0.0
            self.vy = 0.0
            self.moving = False
        else:
            self.moving = True

        self.vx += lax * dt
        self.vy += lay * dt
        self.vx = self.lp_vx.update(self.vx)
        self.vy = self.lp_vy.update(self.vy)
        self.px += self.vx * dt
        self.py += self.vy * dt

        dx = self.px - self.last_kx
        dy = self.py - self.last_ky
        dist_mm = math.sqrt(dx * dx + dy * dy) * 1000.0
        dt_k = now_ms - self.last_k_ms
        should_emit = (dist_mm >= self.dist_thr_mm) or (dt_k >= self.time_thr_ms)

        if should_emit:
            self.last_kx = self.px
            self.last_ky = self.py
            self.last_k_ms = now_ms
            self.seq += 1
            return {
                "t": now_ms,
                "seq": self.seq,
                "x": self.px * 1000.0,
                "y": self.py * 1000.0,
                "vx": self.vx * 1000.0,
                "vy": self.vy * 1000.0,
                "roll": self.roll,
                "pitch": self.pitch,
                "moving": self.moving,
            }
        return None


def _parse_floats_csv(s):
    parts = [p.strip() for p in s.split(",") if p.strip()]
    out = []
    for p in parts:
        try:
            out.append(float(p))
        except Exception:
            return None
    return out


def _json_line(d):
    def f(x):
        if isinstance(x, bool):
            return "true" if x else "false"
        if isinstance(x, int):
            return str(x)
        if isinstance(x, float):
            if math.isnan(x) or math.isinf(x):
                return "0"
            return "{:.4f}".format(x)
        return '"' + str(x).replace('"', '\\"') + '"'

    keys = ["t", "seq", "x", "y", "vx", "vy", "roll", "pitch", "moving"]
    items = []
    for k in keys:
        items.append('"' + k + '":' + f(d.get(k)))
    return "{" + ",".join(items) + "}\n"


def main():
    uart.init(115200)
    display.show(Image.DIAMOND_SMALL)

    mpu = MPU6050(0x68)
    imu = StrokeIMULite()

    try:
        mpu.init()
    except Exception:
        display.show(Image.NO)
        while True:
            sleep(1000)

    display.show(Image.ARROW_N)
    ok = imu.auto_calibrate(lambda: mpu.read())
    display.show(Image.YES if ok else Image.NO)
    sleep(400)
    display.clear()

    while True:
        now_ms = running_time()

        if uart.any():
            line = uart.readline()
            if line:
                try:
                    cmd = line.decode("utf-8").strip()
                except Exception:
                    cmd = ""
                if cmd:
                    u = cmd.upper()
                    if u == "HELP":
                        uart.write("OK HELP CAL|ZERO|STREAM 0/1|MODE JSON/CSV|DIST mm|TIME ms|DZ deg|MAP a,b,c,d,e,f,g,h,i|STATUS\n")
                    elif u == "PING":
                        uart.write("PONG\n")
                    elif u.startswith("STREAM"):
                        parts = u.split()
                        if len(parts) >= 2 and parts[1] in ("0", "1"):
                            imu.stream = (parts[1] == "1")
                            uart.write("OK\n")
                        else:
                            uart.write("ERR\n")
                    elif u.startswith("MODE"):
                        parts = u.split()
                        if len(parts) >= 2 and parts[1] in ("JSON", "CSV"):
                            imu.mode = parts[1]
                            uart.write("OK\n")
                        else:
                            uart.write("ERR\n")
                    elif u.startswith("DIST"):
                        parts = u.split()
                        if len(parts) >= 2:
                            try:
                                imu.dist_thr_mm = float(parts[1])
                                uart.write("OK\n")
                            except Exception:
                                uart.write("ERR\n")
                        else:
                            uart.write("ERR\n")
                    elif u.startswith("TIME"):
                        parts = u.split()
                        if len(parts) >= 2:
                            try:
                                imu.time_thr_ms = int(float(parts[1]))
                                uart.write("OK\n")
                            except Exception:
                                uart.write("ERR\n")
                        else:
                            uart.write("ERR\n")
                    elif u.startswith("DZ"):
                        parts = u.split()
                        if len(parts) >= 2:
                            try:
                                imu.deadzone_deg = float(parts[1])
                                uart.write("OK\n")
                            except Exception:
                                uart.write("ERR\n")
                        else:
                            uart.write("ERR\n")
                    elif u == "ZERO":
                        imu.reset_state(now_ms)
                        uart.write("OK\n")
                    elif u == "CAL":
                        display.show(Image.TARGET)
                        ok2 = imu.auto_calibrate(lambda: mpu.read())
                        display.show(Image.YES if ok2 else Image.NO)
                        sleep(400)
                        display.clear()
                        uart.write("OK\n" if ok2 else "ERR\n")
                    elif u.startswith("MAP"):
                        rest = cmd[3:].strip()
                        if rest.startswith(":"):
                            rest = rest[1:].strip()
                        values = _parse_floats_csv(rest)
                        if values and len(values) == 9 and imu.set_map(values):
                            uart.write("OK\n")
                        else:
                            uart.write("ERR\n")
                    elif u == "STATUS":
                        uart.write(_json_line({
                            "t": now_ms,
                            "seq": imu.seq,
                            "x": imu.px * 1000.0,
                            "y": imu.py * 1000.0,
                            "vx": imu.vx * 1000.0,
                            "vy": imu.vy * 1000.0,
                            "roll": imu.roll,
                            "pitch": imu.pitch,
                            "moving": imu.moving,
                        }))
                    else:
                        uart.write("ERR\n")

        ax, ay, az, gx, gy, gz = mpu.read()
        out = imu.update(ax, ay, az, gx, gy, gz, now_ms)

        if imu.stream and out is not None:
            if imu.mode == "CSV":
                uart.write("{:.3f},{:.3f}\n".format(out["x"], out["y"]))
            else:
                uart.write(_json_line(out))

        if button_a.was_pressed():
            imu.reset_state(now_ms)
        if button_b.was_pressed():
            imu.stream = not imu.stream
            display.show(Image.HAPPY if imu.stream else Image.SAD)
            sleep(200)
            display.clear()

        sleep(10)


main()

