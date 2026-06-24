import math


G0 = 9.80665


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
    return 0.0


class KalmanAngle:
    def __init__(self, q_angle=0.001, q_bias=0.003, r_measure=0.03):
        self.q_angle = q_angle
        self.q_bias = q_bias
        self.r_measure = r_measure
        self.angle = 0.0
        self.bias = 0.0
        self.p00 = 0.0
        self.p01 = 0.0
        self.p10 = 0.0
        self.p11 = 0.0

    def set_angle(self, angle):
        self.angle = float(angle)

    def update(self, new_angle, new_rate, dt):
        rate = new_rate - self.bias
        self.angle += dt * rate

        self.p00 += dt * (dt * self.p11 - self.p01 - self.p10 + self.q_angle)
        self.p01 -= dt * self.p11
        self.p10 -= dt * self.p11
        self.p11 += self.q_bias * dt

        s = self.p00 + self.r_measure
        if s == 0.0:
            return self.angle
        k0 = self.p00 / s
        k1 = self.p10 / s

        y = new_angle - self.angle
        self.angle += k0 * y
        self.bias += k1 * y

        p00 = self.p00
        p01 = self.p01
        self.p00 -= k0 * p00
        self.p01 -= k0 * p01
        self.p10 -= k1 * p00
        self.p11 -= k1 * p01
        return self.angle


class LowPass:
    def __init__(self, alpha=0.2):
        self.alpha = alpha
        self.v = 0.0
        self.inited = False

    def reset(self, v=0.0):
        self.v = float(v)
        self.inited = True

    def update(self, x):
        x = float(x)
        if not self.inited:
            self.v = x
            self.inited = True
            return x
        self.v = self.v + self.alpha * (x - self.v)
        return self.v


class StrokePipeline:
    def __init__(self):
        self.map_m = (0.0, -1.0, 0.0,
                      -1.0, 0.0, 0.0,
                      0.0, 0.0, -1.0)
        self.acc_bias = [0.0, 0.0, 0.0]
        self.gyro_bias = [0.0, 0.0, 0.0]
        self.roll0 = 0.0
        self.pitch0 = 0.0
        self.alpha = 0.98
        self.deadzone_deg = 3.0
        self.zupt_acc_ms2 = 0.35
        self.zupt_gyro_dps = 2.0
        self.stationary_hold_ms = 120
        self.dist_thr_mm = 2.0
        self.time_thr_ms = 20

        self.roll = 0.0
        self.pitch = 0.0
        self.k_roll = KalmanAngle()
        self.k_pitch = KalmanAngle()
        self.lp_ax = LowPass(0.25)
        self.lp_ay = LowPass(0.25)
        self.lp_vx = LowPass(0.15)
        self.lp_vy = LowPass(0.15)

        self.vx = 0.0
        self.vy = 0.0
        self.px = 0.0
        self.py = 0.0
        self.last_kx = 0.0
        self.last_ky = 0.0
        self.last_k_ms = 0
        self.last_ms = 0
        self.stationary_ms = 0
        self.moving = False
        self.seq = 0

    def set_map(self, m9):
        if len(m9) != 9:
            raise ValueError("map must have 9 elements")
        self.map_m = tuple(float(x) for x in m9)

    def reset(self, now_ms=0):
        self.vx = 0.0
        self.vy = 0.0
        self.px = 0.0
        self.py = 0.0
        self.last_kx = 0.0
        self.last_ky = 0.0
        self.last_k_ms = int(now_ms)
        self.last_ms = int(now_ms)
        self.stationary_ms = 0
        self.moving = False
        self.seq = 0

    def apply_map(self, x, y, z):
        m = self.map_m
        return (
            m[0] * x + m[1] * y + m[2] * z,
            m[3] * x + m[4] * y + m[5] * z,
            m[6] * x + m[7] * y + m[8] * z,
        )

    def auto_calibrate_from_samples(self, samples, now_ms=0):
        n = 0
        sax = say = saz = 0.0
        sgx = sgy = sgz = 0.0
        for ax, ay, az, gx, gy, gz in samples:
            ax, ay, az = self.apply_map(ax, ay, az)
            gx, gy, gz = self.apply_map(gx, gy, gz)
            sax += ax
            say += ay
            saz += az
            sgx += gx
            sgy += gy
            sgz += gz
            n += 1
        if n <= 0:
            raise ValueError("no samples")
        mx = sax / n
        my = say / n
        mz = saz / n
        mg = math.sqrt(mx * mx + my * my + mz * mz)
        if mg == 0.0:
            raise ValueError("invalid gravity")
        ux = mx / mg
        uy = my / mg
        uz = mz / mg
        self.acc_bias = [mx - ux * 16384.0, my - uy * 16384.0, mz - uz * 16384.0]
        self.gyro_bias = [sgx / n, sgy / n, sgz / n]

        ax_ms2 = (mx - self.acc_bias[0]) / 16384.0 * G0
        ay_ms2 = (my - self.acc_bias[1]) / 16384.0 * G0
        az_ms2 = (mz - self.acc_bias[2]) / 16384.0 * G0
        roll_acc = math.degrees(math.atan2(ay_ms2, az_ms2))
        pitch_acc = math.degrees(math.atan2(-ax_ms2, math.sqrt(ay_ms2 * ay_ms2 + az_ms2 * az_ms2)))
        self.roll0 = roll_acc
        self.pitch0 = pitch_acc
        self.roll = roll_acc
        self.pitch = pitch_acc
        self.k_roll.set_angle(roll_acc)
        self.k_pitch.set_angle(pitch_acc)
        self.reset(now_ms)

    def update(self, ax_raw, ay_raw, az_raw, gx_raw, gy_raw, gz_raw, now_ms):
        dt = (now_ms - self.last_ms) / 1000.0
        if dt <= 0.0:
            dt = 0.001
        if dt > 0.2:
            dt = 0.2
        self.last_ms = now_ms

        ax_m, ay_m, az_m = self.apply_map(ax_raw, ay_raw, az_raw)
        gx_m, gy_m, gz_m = self.apply_map(gx_raw, gy_raw, gz_raw)
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

        roll_k = self.k_roll.update(self.roll, gx_dps, dt)
        pitch_k = self.k_pitch.update(self.pitch, gy_dps, dt)

        roll_use = self.roll0 + deadzone(roll_k - self.roll0, self.deadzone_deg)
        pitch_use = self.pitch0 + deadzone(pitch_k - self.pitch0, self.deadzone_deg)

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

        lax = self.lp_ax.update(lax)
        lay = self.lp_ay.update(lay)

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
                "ax": lax,
                "ay": lay,
                "roll": roll_k,
                "pitch": pitch_k,
                "moving": self.moving,
            }
        return None


def dtw_distance(a, b):
    if not a or not b:
        return float("inf")
    na = len(a)
    nb = len(b)
    prev = [float("inf")] * (nb + 1)
    cur = [float("inf")] * (nb + 1)
    prev[0] = 0.0
    for i in range(1, na + 1):
        cur[0] = float("inf")
        ax, ay = a[i - 1]
        for j in range(1, nb + 1):
            bx, by = b[j - 1]
            d = math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
            cur[j] = d + min(cur[j - 1], prev[j], prev[j - 1])
        prev, cur = cur, prev
    return prev[nb]


def resample_path(path, n=64):
    if not path:
        return []
    if len(path) == 1:
        return [path[0]] * n
    dists = [0.0]
    for i in range(1, len(path)):
        x0, y0 = path[i - 1]
        x1, y1 = path[i]
        dists.append(dists[-1] + math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2))
    total = dists[-1]
    if total == 0.0:
        return [path[0]] * n
    out = []
    step = total / (n - 1)
    j = 1
    for k in range(n):
        target = k * step
        while j < len(dists) and dists[j] < target:
            j += 1
        if j >= len(dists):
            out.append(path[-1])
            continue
        d0 = dists[j - 1]
        d1 = dists[j]
        if d1 == d0:
            out.append(path[j])
            continue
        t = (target - d0) / (d1 - d0)
        x0, y0 = path[j - 1]
        x1, y1 = path[j]
        out.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    return out


def normalized_dtw_percent(a, b, n=64):
    ra = resample_path(a, n=n)
    rb = resample_path(b, n=n)
    d = dtw_distance(ra, rb)
    scale = 0.0
    for i in range(1, len(ra)):
        x0, y0 = ra[i - 1]
        x1, y1 = ra[i]
        scale += math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
    if scale == 0.0:
        return 0.0
    return (d / scale) * 100.0
