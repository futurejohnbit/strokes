import json
import math
import os
import random

import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from tools.imu_pipeline import G0


MAP = (
    0.0, -1.0, 0.0,
    -1.0, 0.0, 0.0,
    0.0, 0.0, -1.0,
)


def map_apply(m, v):
    x, y, z = v
    return (
        m[0] * x + m[1] * y + m[2] * z,
        m[3] * x + m[4] * y + m[5] * z,
        m[6] * x + m[7] * y + m[8] * z,
    )


def rot_from_roll_pitch(roll_deg, pitch_deg):
    r = math.radians(roll_deg)
    p = math.radians(pitch_deg)
    sr, cr = math.sin(r), math.cos(r)
    sp, cp = math.sin(p), math.cos(p)
    rx = (
        1.0, 0.0, 0.0,
        0.0, cr, -sr,
        0.0, sr, cr,
    )
    ry = (
        cp, 0.0, sp,
        0.0, 1.0, 0.0,
        -sp, 0.0, cp,
    )
    def mul(a, b):
        return (
            a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
            a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
            a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
            a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
            a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
            a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
            a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
        )
    return mul(ry, rx)


def rot_apply(r, v):
    x, y, z = v
    return (
        r[0] * x + r[1] * y + r[2] * z,
        r[3] * x + r[4] * y + r[5] * z,
        r[6] * x + r[7] * y + r[8] * z,
    )


def make_profile(total_ms, speed_scale):
    t = 0
    dt = 5
    pts = []
    x = 0.0
    y = 0.0
    vx = 0.0
    vy = 0.0
    while t <= total_ms:
        u = t / total_ms
        ax = 0.0
        if u < 0.15:
            ax = 2.5 * speed_scale
        elif u < 0.85:
            ax = 0.0
        else:
            ax = -2.5 * speed_scale
        vx += ax * (dt / 1000.0)
        x += vx * (dt / 1000.0)
        pts.append((t, x, y, vx, vy, ax, 0.0))
        t += dt
    return pts


def gen_dataset(path, tilt_deg, speed_name, speed_scale, seed=0):
    random.seed(seed)
    roll = tilt_deg
    pitch = tilt_deg / 2.0
    r = rot_from_roll_pitch(roll, pitch)

    dt = 5
    t = 0
    samples = []

    for _ in range(int(1000 / dt)):
        ax_w, ay_w, az_w = 0.0, 0.0, 0.0
        g_w = (0.0, 0.0, G0)
        a_w = (ax_w, ay_w, az_w)
        a_plus_g = (a_w[0] + g_w[0], a_w[1] + g_w[1], a_w[2] + g_w[2])
        a_b = rot_apply(r, a_plus_g)
        a_raw = map_apply(MAP, a_b)
        ax_c = a_b[0] + random.gauss(0.0, 0.03)
        ay_c = a_b[1] + random.gauss(0.0, 0.03)
        az_c = a_b[2] + random.gauss(0.0, 0.03)
        ax_c, ay_c, az_c = a_raw[0] + random.gauss(0.0, 0.03), a_raw[1] + random.gauss(0.0, 0.03), a_raw[2] + random.gauss(0.0, 0.03)
        ax = int((ax_c / G0) * 16384.0)
        ay = int((ay_c / G0) * 16384.0)
        az = int((az_c / G0) * 16384.0)
        samples.append({
            "t": t,
            "ax": ax,
            "ay": ay,
            "az": az,
            "gx": 0,
            "gy": 0,
            "gz": 0,
            "gt_x": 0.0,
            "gt_y": 0.0,
            "phase": "cal",
        })
        t += dt

    profile = make_profile(600, speed_scale)
    for tt, x, y, vx, vy, ax_w, ay_w in profile:
        g_w = (0.0, 0.0, G0)
        a_w = (ax_w, ay_w, 0.0)
        a_plus_g = (a_w[0] + g_w[0], a_w[1] + g_w[1], a_w[2] + g_w[2])
        a_b = rot_apply(r, a_plus_g)
        a_raw = map_apply(MAP, a_b)
        ax_c = a_raw[0] + random.gauss(0.0, 0.05)
        ay_c = a_raw[1] + random.gauss(0.0, 0.05)
        az_c = a_raw[2] + random.gauss(0.0, 0.05)
        ax = int((ax_c / G0) * 16384.0)
        ay = int((ay_c / G0) * 16384.0)
        az = int((az_c / G0) * 16384.0)
        samples.append({
            "t": t,
            "ax": ax,
            "ay": ay,
            "az": az,
            "gx": 0,
            "gy": 0,
            "gz": 0,
            "gt_x": x * 1000.0,
            "gt_y": y * 1000.0,
            "phase": "stroke",
        })
        t += dt

    meta = {
        "tilt_deg": tilt_deg,
        "roll_deg": roll,
        "pitch_deg": pitch,
        "speed": speed_name,
        "dt_ms": dt,
        "notes": "simulated",
    }
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps({"meta": meta}) + "\n")
        for s in samples:
            f.write(json.dumps(s) + "\n")


def main():
    base = os.path.join(os.path.dirname(__file__), "datasets")
    os.makedirs(base, exist_ok=True)
    tilts = [0, 15, 30]
    speeds = [("slow", 0.6), ("mid", 1.0), ("fast", 1.6)]
    seed = 0
    for tilt in tilts:
        for name, scale in speeds:
            seed += 1
            fn = f"sim_tilt{tilt}_{name}.jsonl"
            gen_dataset(os.path.join(base, fn), tilt, name, scale, seed=seed)
    print("OK", base)


if __name__ == "__main__":
    main()
