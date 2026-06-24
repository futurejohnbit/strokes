import glob
import json
import math
import os

import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from tools.imu_pipeline import StrokePipeline, normalized_dtw_percent


def load_dataset(path):
    meta = None
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if "meta" in obj:
                meta = obj["meta"]
            else:
                rows.append(obj)
    return meta or {}, rows


def run_one(path):
    meta, rows = load_dataset(path)
    cal = [r for r in rows if r.get("phase") == "cal"]
    stroke = [r for r in rows if r.get("phase") == "stroke"]
    if not cal or not stroke:
        return None

    p = StrokePipeline()
    p.dist_thr_mm = 2.0
    p.time_thr_ms = 20
    p.deadzone_deg = 3.0

    cal_samples = []
    for r in cal:
        cal_samples.append((r["ax"], r["ay"], r["az"], r["gx"], r["gy"], r["gz"]))
    p.auto_calibrate_from_samples(cal_samples, now_ms=0)

    pred = []
    for r in stroke:
        o = p.update(r["ax"], r["ay"], r["az"], r["gx"], r["gy"], r["gz"], now_ms=r["t"])
        if o:
            pred.append((o["x"], o["y"]))
    gt = [(r["gt_x"], r["gt_y"]) for r in stroke]
    if not pred:
        pred = [(0.0, 0.0)]

    end_gt = gt[-1]
    end_pred = pred[-1]
    end_err = math.sqrt((end_pred[0] - end_gt[0]) ** 2 + (end_pred[1] - end_gt[1]) ** 2)
    dtw_pct = normalized_dtw_percent(pred, gt)

    return {
        "file": os.path.basename(path),
        "meta": meta,
        "end_err_mm": end_err,
        "dtw_pct": dtw_pct,
        "pred": pred,
        "gt": gt,
    }


def make_html(results):
    payload = []
    for r in results:
        payload.append({
            "file": r["file"],
            "meta": r["meta"],
            "end_err_mm": r["end_err_mm"],
            "dtw_pct": r["dtw_pct"],
            "pred": r["pred"],
            "gt": r["gt"],
        })
    data = json.dumps(payload)
    tpl = """<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IMU Stroke 報告</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}
    .card{background:#111827;border:1px solid #334155;border-radius:12px;padding:12px}
    canvas{background:#0b1220;border:1px solid #334155;border-radius:10px;width:100%;height:320px}
    .k{color:#94a3b8;font-size:12px}
    .v{font-weight:700}
  </style>
</head>
<body>
  <h1 style="margin:0 0 12px 0;font-size:18px">IMU 筆畫重建：離線報告</h1>
  <div id="root" class="grid"></div>
  <script>
    const results = __DATA__;
    const root = document.getElementById('root');
    function bounds(path){
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for (const [x,y] of path){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      if (!isFinite(minX)) return {minX:0,minY:0,maxX:1,maxY:1};
      const pad = 10;
      return {minX:minX-pad,minY:minY-pad,maxX:maxX+pad,maxY:maxY+pad};
    }
    function draw(canvas, gt, pred){
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.clientWidth * devicePixelRatio;
      const h = canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.clearRect(0,0,w,h);
      const b = bounds(gt.concat(pred));
      const sx = w / (b.maxX - b.minX || 1);
      const sy = h / (b.maxY - b.minY || 1);
      const s = Math.min(sx, sy);
      const ox = (w - (b.maxX - b.minX)*s)/2 - b.minX*s;
      const oy = (h - (b.maxY - b.minY)*s)/2 - b.minY*s;
      function map([x,y]){return [x*s+ox, h-(y*s+oy)];}
      function stroke(path, color){
        if (!path.length) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2*devicePixelRatio;
        ctx.beginPath();
        const [x0,y0] = map(path[0]);
        ctx.moveTo(x0,y0);
        for (let i=1;i<path.length;i++){
          const [x,y] = map(path[i]);
          ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      stroke(gt,'rgba(34,197,94,0.9)');
      stroke(pred,'rgba(59,130,246,0.9)');
    }
    for (const r of results){
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('div');
      title.innerHTML = '<div class="v">'+r.file+'</div>'+
        '<div class="k">tilt='+r.meta.tilt_deg+'° speed='+r.meta.speed+' | end_err='+r.end_err_mm.toFixed(2)+'mm | dtw='+r.dtw_pct.toFixed(2)+'%</div>';
      const canvas = document.createElement('canvas');
      card.appendChild(title);
      card.appendChild(canvas);
      root.appendChild(card);
      draw(canvas, r.gt, r.pred);
    }
  </script>
</body>
</html>"""
    return tpl.replace("__DATA__", data)


def main():
    base = os.path.join(os.path.dirname(__file__), "datasets")
    out_dir = os.path.join(os.path.dirname(__file__), "out")
    os.makedirs(out_dir, exist_ok=True)

    paths = sorted(glob.glob(os.path.join(base, "*.jsonl")))
    results = []
    for p in paths:
        r = run_one(p)
        if r:
            results.append(r)

    md_lines = ["# IMU 筆畫離線性能報告", ""]
    md_lines.append("| dataset | tilt | speed | end_err_mm | dtw_% |")
    md_lines.append("|---|---:|---|---:|---:|")
    for r in results:
        md_lines.append(
            f"| {r['file']} | {r['meta'].get('tilt_deg','')} | {r['meta'].get('speed','')} | {r['end_err_mm']:.2f} | {r['dtw_pct']:.2f} |"
        )
    md_lines.append("")
    md_path = os.path.join(out_dir, "report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    html_path = os.path.join(out_dir, "report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(make_html(results))

    print("OK", md_path, html_path)


if __name__ == "__main__":
    main()
