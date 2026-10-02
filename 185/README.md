# Practice Room

A local mock-interview chat app powered by AIML pattern matching. It guides a candidate through five prompts and ends with a practical answer framework. It does not use a hosted LLM or send conversation data to a remote service.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000. If PowerShell blocks environment activation, install dependencies with `.venv\Scripts\python.exe -m pip install -r requirements.txt` and start with `.venv\Scripts\python.exe app.py`.

Interview replies are defined in `aiml/interview.aiml`. The AIML engine stores each practice round in its own in-memory session; restarting the server clears those sessions.