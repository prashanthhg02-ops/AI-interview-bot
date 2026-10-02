from pathlib import Path
from threading import RLock
import time
from uuid import uuid4

import aiml
from flask import Flask, jsonify, render_template, request


ROOT = Path(__file__).resolve().parent
app = Flask(__name__)
if not hasattr(time, "clock"):
    time.clock = time.perf_counter
kernel = aiml.Kernel()
kernel.learn(str(ROOT / "aiml" / "interview.aiml"))
kernel_lock = RLock()


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/start")
def start_interview():
    session_id = uuid4().hex
    with kernel_lock:
        reply = kernel.respond("START INTERVIEW", sessionID=session_id)
        stage = kernel.getPredicate("stage", sessionID=session_id)
    return jsonify(sessionId=session_id, reply=reply, stage=stage)


@app.post("/api/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("sessionId", ""))
    message = str(payload.get("message", "")).strip()

    if not session_id or len(session_id) > 80:
        return jsonify(error="Start an interview before sending an answer."), 400
    if not message:
        return jsonify(error="Write an answer before sending it."), 400
    if len(message) > 1000:
        return jsonify(error="Please keep each answer under 1,000 characters."), 400

    with kernel_lock:
        reply = kernel.respond(message, sessionID=session_id)
        stage = kernel.getPredicate("stage", sessionID=session_id)
    return jsonify(reply=reply, stage=stage)


if __name__ == "__main__":
    app.run(debug=True)