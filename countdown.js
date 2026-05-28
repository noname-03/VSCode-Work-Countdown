const vscode = require('vscode');

class CountdownManager {
  constructor(context) {
    this.context = context;
    this.timer = null;
    this.statusBarItem = null;
    this.onTick = null;
  }

  getStartTime() {
    return this.context.globalState.get('countdown.startTime');
  }

  getEndTime() {
    return this.context.globalState.get('countdown.endTime');
  }

  getPausedDuration() {
    return this.context.globalState.get('countdown.pausedDuration', 0);
  }

  getPauseStartTime() {
    return this.context.globalState.get('countdown.pauseStartTime');
  }

  isActive() {
    const startTime = this.getStartTime();
    if (!startTime) return false;
    const elapsed = Date.now() - startTime;
    const workDuration = this.getWorkDurationMs();
    return elapsed < workDuration;
  }

  getWorkDurationMs() {
    const hours = vscode.workspace.getConfiguration('workcountdown').get('workDuration', 9);
    return hours * 60 * 60 * 1000;
  }

  async setStartTime(hour, minute) {
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    const endTime = startTime.getTime() + this.getWorkDurationMs();

    await this.context.globalState.update('countdown.startTime', startTime.getTime());
    await this.context.globalState.update('countdown.endTime', endTime);
    await this.context.globalState.update('countdown.pausedDuration', 0);
    await this.context.globalState.update('countdown.pauseStartTime', null);
    await this.context.globalState.update('countdown.date', now.toDateString());

    if (this.onTick) this.onTick();
    this.startTimer();
  }

  async resetTimer() {
    await this.context.globalState.update('countdown.startTime', null);
    await this.context.globalState.update('countdown.endTime', null);
    await this.context.globalState.update('countdown.pausedDuration', 0);
    await this.context.globalState.update('countdown.pauseStartTime', null);
    await this.context.globalState.update('countdown.date', null);
    this.stopTimer();
    if (this.onTick) this.onTick();
  }

  togglePause() {
    if (this.getPauseStartTime()) {
      const pauseDuration = Date.now() - this.getPauseStartTime();
      const totalPaused = this.getPausedDuration() + pauseDuration;
      this.context.globalState.update('countdown.pausedDuration', totalPaused);
      this.context.globalState.update('countdown.pauseStartTime', null);
      vscode.window.showInformationMessage('Break ended, timer resumed!');
    } else {
      this.context.globalState.update('countdown.pauseStartTime', Date.now());
      vscode.window.showInformationMessage('Timer paused for break.');
    }
    if (this.onTick) this.onTick();
  }

  getRemainingTime() {
    const endTime = this.getEndTime();
    if (!endTime) return null;

    let remaining = endTime - Date.now();

    const pauseStart = this.getPauseStartTime();
    if (pauseStart) {
      remaining -= (Date.now() - pauseStart);
    }

    const pausedDuration = this.getPausedDuration();
    remaining += pausedDuration;

    if (remaining < 0) remaining = 0;
    return remaining;
  }

  formatRemaining(remainingMs, showSeconds = false) {
    if (remainingMs === null || remainingMs === undefined) return '';

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (showSeconds) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  getStatusInfo() {
    const startTime = this.getStartTime();
    const endTime = this.getEndTime();
    const remaining = this.getRemainingTime();
    const isPaused = !!this.getPauseStartTime();

    if (!startTime || !endTime) {
      return { text: '$(clock) Not set', tooltip: 'Click to set start time', isActive: false };
    }

    const remainingStr = this.formatRemaining(remaining, false);

    if (remaining !== null && remaining <= 0) {
      return {
        text: `$(check) Done!`,
        tooltip: `9-hour workday complete!\nStart: ${this.formatTime(new Date(startTime))}\nEnd: ${this.formatTime(new Date(endTime + this.getPausedDuration()))}`,
        isActive: false
      };
    }

    let icon = '$(dashboard)';
    if (remaining !== null) {
      if (remaining < 15 * 60 * 1000) icon = '$(warning)';
      else if (remaining < 60 * 60 * 1000) icon = '$(watch)';
    }

    const pauseText = isPaused ? ' [PAUSE]' : '';
    const text = `${icon} ${remainingStr}${pauseText}`;

    const actualEnd = new Date(endTime + this.getPausedDuration());
    const tooltip = `Work countdown\nStart: ${this.formatTime(new Date(startTime))}\nEnd: ${this.formatTime(actualEnd)}\nRemaining: ${remainingStr}${isPaused ? '\nStatus: Paused (break)' : ''}`;

    return { text, tooltip, isActive: true };
  }

  formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.onTick) this.onTick();
    }, 30000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stopTimer();
  }
}

module.exports = CountdownManager;