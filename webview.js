const vscode = require('vscode');

class WorkCountdownViewProvider {
  constructor(countdownManager) {
    this.countdownManager = countdownManager;
    this.view = null;
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true
    };

    webviewView.webview.html = this._getHtmlContent();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'ready') {
        this._sendTimerData();
      } else if (message.command === 'setStartTime') {
        vscode.commands.executeCommand('workcountdown.setStartTime');
      } else if (message.command === 'togglePause') {
        vscode.commands.executeCommand('workcountdown.togglePause');
      }
    });

    this.broadcast();
  }

  broadcast() {
    if (this.view) {
      this.view.webview.postMessage(this._getTimerData());
    }
  }

  _sendTimerData() {
    this.broadcast();
  }

  _getTimerData() {
    const cm = this.countdownManager;
    return {
      command: 'update',
      startTime: cm.getStartTime(),
      endTime: cm.getEndTime(),
      pausedDuration: cm.getPausedDuration(),
      pauseStartTime: cm.getPauseStartTime()
    };
  }

  _getHtmlContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--vscode-sideBar-background);
      color: var(--vscode-editor-foreground);
      padding: 8px 10px;
      user-select: none;
    }
    .grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      align-items: center;
    }
    .left-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .right-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .clock-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid var(--vscode-input-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.5s;
    }
    .clock-circle.urgent { border-color: #f44747; }
    .clock-circle.warning { border-color: #cca700; }
    .clock-circle.paused { border-color: #3794ff; }
    .clock-circle.done { border-color: #89d185; }
    .time-display {
      font-size: 16px;
      font-weight: bold;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .time-label {
      font-size: 8px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1;
    }
    .badge {
      font-size: 9px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 3px;
      white-space: nowrap;
      text-align: center;
    }
    .badge-working { background: #1a7a2e33; color: #89d185; }
    .badge-warning { background: #cca70033; color: #cca700; }
    .badge-urgent  { background: #f4474733; color: #f44747; }
    .badge-paused  { background: #3794ff33; color: #3794ff; }
    .badge-done    { background: #89d18533; color: #89d185; }
    .badge-default { background: var(--vscode-input-background); color: var(--vscode-descriptionForeground); }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .info-key { color: var(--vscode-descriptionForeground); white-space: nowrap; }
    .info-val { color: var(--vscode-editor-foreground); font-weight: 500; font-variant-numeric: tabular-nums; }
    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--vscode-input-background);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3794ff, #89d185);
      border-radius: 2px;
      transition: width 1s linear;
    }
    .btn-row {
      display: flex;
      gap: 4px;
    }
    .btn { flex: 1; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px; white-space: nowrap; text-align: center; line-height: 1.4; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-pause { background: #3794ff33; color: #3794ff; border: 1px solid #3794ff55; }
    .btn-pause:hover { background: #3794ff55; }
    .btn-resume { background: #3794ff55; color: #3794ff; border: 1px solid #3794ff; }
    .btn-resume:hover { background: #3794ff77; }
    .btn-reset { background: #d1861633; color: #d18616; border: 1px solid #d1861655; }
    .btn-reset:hover { background: #d1861655; }
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
    }
    .placeholder-icon { font-size: 24px; opacity: 0.5; }
    .placeholder-text { font-size: 11px; color: var(--vscode-descriptionForeground); text-align: center; }
  </style>
</head>
<body>
  <div id="placeholder" class="placeholder">
    <div class="placeholder-icon">🕐</div>
    <div class="placeholder-text">Timer not set</div>
    <button class="btn btn-primary" onclick="setStartTime()" title="Set your start time">Set Start Time</button>
  </div>

  <div id="timer" class="grid" style="display:none;">
    <div class="left-col">
      <div class="clock-circle" id="clockCircle">
        <div class="time-display" id="timeDisplay">--:--:--</div>
        <div class="time-label" id="timeLabel">LEFT</div>
      </div>
      <div class="badge badge-default" id="statusBadge">Working</div>
    </div>

    <div class="right-col">
      <div class="info-row">
        <span class="info-key">Start</span>
        <span class="info-val" id="infoStart">--:--</span>
      </div>
      <div class="info-row">
        <span class="info-key">End</span>
        <span class="info-val" id="infoEnd">--:--</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width:0%"></div>
      </div>
      <div class="btn-row">
        <button class="btn btn-pause" onclick="togglePause()" id="btnPause" title="Pause timer">⏯️</button>
        <button class="btn btn-reset" onclick="setStartTime()" title="Reset start time">🔄</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let timerData = { startTime: null, endTime: null, pausedDuration: 0, pauseStartTime: null };
    vscode.postMessage({ command: 'ready' });
    const WORK_MS = 9 * 60 * 60 * 1000;

    function fmtTime(ts) {
      if (!ts) return '--:--';
      const d = new Date(ts);
      return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }
    function fmtRem(ms) {
      if (ms === null || ms === undefined || ms < 0) return '00:00:00';
      const s = Math.floor(ms / 1000);
      return String(Math.floor(s/3600)).padStart(2,'0') + ':' +
             String(Math.floor((s%3600)/60)).padStart(2,'0') + ':' +
             String(s%60).padStart(2,'0');
    }
    function getRem() {
      if (!timerData.endTime) return null;
      let r = timerData.endTime - Date.now();
      if (timerData.pauseStartTime) r -= (Date.now() - timerData.pauseStartTime);
      r += timerData.pausedDuration;
      return Math.max(0, r);
    }

    function tick() {
      const rem = getRem();
      if (rem === null) return;
      const isPaused = !!timerData.pauseStartTime;
      const hasStart = !!timerData.startTime;

      if (!hasStart) { document.getElementById('placeholder').style.display='flex'; document.getElementById('timer').style.display='none'; return; }
      document.getElementById('placeholder').style.display='none';
      document.getElementById('timer').style.display='grid';

      document.getElementById('timeDisplay').textContent = fmtRem(rem);
      const actualEnd = timerData.endTime ? new Date(timerData.endTime + timerData.pausedDuration) : null;
      document.getElementById('infoStart').textContent = fmtTime(timerData.startTime);
      document.getElementById('infoEnd').textContent = fmtTime(actualEnd ? actualEnd.getTime() : null);
      document.getElementById('progressFill').style.width = Math.min(((WORK_MS - rem) / WORK_MS) * 100, 100) + '%';

      const circle = document.getElementById('clockCircle');
      const badge = document.getElementById('statusBadge');
      const label = document.getElementById('timeLabel');
      const btnPause = document.getElementById('btnPause');

      circle.className = 'clock-circle'; badge.className = 'badge badge-working'; badge.textContent = 'Working'; label.textContent = 'LEFT';
      btnPause.style.display = ''; btnPause.textContent = '⏯️'; btnPause.className = 'btn btn-pause'; btnPause.title = 'Pause timer'; btnPause.title = 'Pause timer';

      if (rem <= 0) {
        circle.classList.add('done'); badge.className = 'badge badge-done'; badge.textContent = 'Done!';
        label.textContent = 'HOME'; btnPause.style.display = 'none';
      } else if (isPaused) {
        circle.classList.add('paused'); badge.className = 'badge badge-paused'; badge.textContent = 'Break';
        label.textContent = 'PAUSE'; btnPause.textContent = '▶️'; btnPause.className = 'btn btn-resume'; btnPause.title = 'Resume timer';
      } else if (rem < 15 * 60 * 1000) {
        circle.classList.add('urgent'); badge.className = 'badge badge-urgent'; badge.textContent = 'Almost!';
      } else if (rem < 60 * 60 * 1000) {
        circle.classList.add('warning'); badge.className = 'badge badge-warning'; badge.textContent = 'Last hour';
      }
    }

    window.addEventListener('message', (e) => { if (e.data.command === 'update') { timerData = e.data; tick(); } });
    setInterval(tick, 1000);
    function setStartTime() { vscode.postMessage({ command: 'setStartTime' }); }
    function togglePause() { vscode.postMessage({ command: 'togglePause' }); }
  </script>
</body>
</html>`;
  }
}

module.exports = { WorkCountdownViewProvider };