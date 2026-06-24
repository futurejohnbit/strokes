import unittest

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from tools.imu_pipeline import deadzone, dtw_distance, normalized_dtw_percent, resample_path, StrokePipeline, G0


class TestIMUPipeline(unittest.TestCase):
    def test_deadzone(self):
        self.assertEqual(deadzone(2.0, 3.0), 0.0)
        self.assertAlmostEqual(deadzone(4.0, 3.0), 1.0)
        self.assertAlmostEqual(deadzone(-4.5, 3.0), -1.5)

    def test_resample_path(self):
        p = [(0.0, 0.0), (10.0, 0.0)]
        r = resample_path(p, n=6)
        self.assertEqual(len(r), 6)
        self.assertAlmostEqual(r[0][0], 0.0)
        self.assertAlmostEqual(r[-1][0], 10.0)
        self.assertAlmostEqual(r[3][0], 6.0, places=6)

    def test_dtw(self):
        a = [(0.0, 0.0), (1.0, 0.0), (2.0, 0.0)]
        b = [(0.0, 0.0), (1.0, 0.0), (2.0, 0.0)]
        self.assertAlmostEqual(dtw_distance(a, b), 0.0)
        self.assertAlmostEqual(normalized_dtw_percent(a, b), 0.0)

    def test_pipeline_downsample(self):
        p = StrokePipeline()
        p.dist_thr_mm = 2.0
        p.time_thr_ms = 20
        p.deadzone_deg = 3.0
        p.reset(0)

        samples = []
        for _ in range(200):
            samples.append((0.0, 0.0, 16384.0, 0.0, 0.0, 0.0))
        p.auto_calibrate_from_samples(samples, now_ms=0)

        out = []
        t = 0
        ax_counts = int((0.8 / G0) * 16384.0)
        for i in range(200):
            t += 5
            if 20 <= i <= 60:
                ax = ax_counts
            else:
                ax = 0
            r = p.update(ax, 0.0, 16384.0, 0.0, 0.0, 0.0, now_ms=t)
            if r is not None:
                out.append(r)
        self.assertGreater(len(out), 0)
        self.assertLess(len(out), 200)


if __name__ == "__main__":
    unittest.main()
