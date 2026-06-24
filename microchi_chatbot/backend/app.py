from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import uuid
import logging
from logging.handlers import RotatingFileHandler
from .services.query_service import QueryService
from .repository import Repository

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), "static"))
CORS(app)

repo = Repository(os.environ.get("MONGO_URI"))
service = QueryService(repo)

# runtime paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.environ.get("DATA_DIR") or os.path.join(BASE_DIR, "runtime")
LOG_DIR = os.path.join(DATA_DIR, "logs")
TMP_DIR = os.path.join(DATA_DIR, "tmp")
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

# logging
handler = RotatingFileHandler(os.path.join(LOG_DIR, "app.log"), maxBytes=1_000_000, backupCount=3, encoding="utf-8")
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
handler.setFormatter(formatter)
app.logger.addHandler(handler)


@app.route("/", methods=["GET"]) 
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


@app.route("/api/query", methods=["POST"]) 
def query():
    data = request.get_json(force=True)
    q = (data or {}).get("q", "").strip()
    mode = (data or {}).get("mode", "definition")
    session_id = request.headers.get("X-Session-Id") or request.cookies.get("session_id") or repo.ensure_session()
    if not q:
        return jsonify({"error": "缺少查詢關鍵字"}), 400
    result = service.query(q, mode=mode, session_id=session_id)
    try:
        fname = os.path.join(TMP_DIR, f"{uuid.uuid4().hex}.json")
        with open(fname, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
    except Exception:
        app.logger.warning("寫入臨時檔案失敗")
    app.logger.info("query q=%s mode=%s approved=%s", q, mode, result.get("approved"))
    return jsonify({"session_id": session_id, **result})


@app.route("/api/history", methods=["GET"]) 
def history():
    session_id = request.headers.get("X-Session-Id") or request.cookies.get("session_id")
    if not session_id:
        return jsonify({"items": []})
    items = repo.get_history(session_id)
    return jsonify({"items": items})


@app.route("/api/favorites", methods=["GET", "POST", "DELETE"]) 
def favorites():
    session_id = request.headers.get("X-Session-Id") or request.cookies.get("session_id")
    if request.method == "GET":
        return jsonify({"items": repo.get_favorites(session_id)})
    data = request.get_json(force=True) or {}
    item = data.get("item")
    if request.method == "POST":
        ok = repo.add_favorite(session_id, item)
        return jsonify({"ok": ok})
    if request.method == "DELETE":
        ok = repo.remove_favorite(session_id, item)
        return jsonify({"ok": ok})
    return jsonify({"error": "不支援的方法"}), 405


def create_app():
    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)