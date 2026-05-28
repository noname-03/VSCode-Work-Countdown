const vscode = require('vscode');
const CountdownManager = require('./countdown');
const { WorkCountdownViewProvider } = require('./webview');

let countdownManager;
let statusBarItem;
let viewProvider;

function activate(context) {
  countdownManager = new CountdownManager(context);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'workcountdown.setStartTime';
  context.subscriptions.push(statusBarItem);

  countdownManager.onTick = () => {
    updateStatusBar();
    if (viewProvider) viewProvider.broadcast();
  };
  updateStatusBar();

  autoResetIfNewDay(context);

  viewProvider = new WorkCountdownViewProvider(countdownManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('workCountdownView', viewProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('workcountdown.setStartTime', async () => {
      await promptSetStartTime();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('workcountdown.focusView', () => {
      vscode.commands.executeCommand('workCountdown.workCountdownView.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('workcountdown.resetTimer', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Reset timer? All data will be cleared.',
        'Yes, Reset',
        'Cancel'
      );
      if (confirm === 'Yes, Reset') {
        await countdownManager.resetTimer();
        updateStatusBar();
        if (viewProvider) viewProvider.broadcast();
        vscode.window.showInformationMessage('Timer reset.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('workcountdown.togglePause', () => {
      countdownManager.togglePause();
      updateStatusBar();
      if (viewProvider) viewProvider.broadcast();
    })
  );

  if (countdownManager.isActive()) {
    countdownManager.startTimer();
  }
}

async function promptSetStartTime() {
  const startTime = countdownManager.getStartTime();
  if (startTime && countdownManager.isActive()) {
    const action = await vscode.window.showInformationMessage(
      'Timer is already running. Reset?',
      'Reset',
      'Cancel'
    );
    if (action !== 'Reset') return;
  }

  const timeInput = await vscode.window.showInputBox({
prompt: 'Enter start time (e.g. 08:00 or 08.30)',
      placeHolder: '08:00',
      validateInput: (value) => {
        const parts = value.replace('.', ':').split(':');
        if (parts.length !== 2) return 'Invalid format. Use HH:MM (e.g. 08:00)';
        const hour = parseInt(parts[0]);
        const minute = parseInt(parts[1]);
        if (isNaN(hour) || isNaN(minute)) return 'Enter valid numbers';
        if (hour < 0 || hour > 23) return 'Hour must be 0-23';
        if (minute < 0 || minute > 59) return 'Minute must be 0-59';
        return null;
    }
  });

  if (!timeInput) return;

  const parts = timeInput.replace('.', ':').split(':');
  const hour = parseInt(parts[0]);
  const minute = parseInt(parts[1]);

  await countdownManager.setStartTime(hour, minute);

  const endTime = countdownManager.getEndTime();
  const endDate = new Date(endTime);
  vscode.window.showInformationMessage(
    `Start: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}. ` +
    `End: ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')} ` +
    `(9 hours)`
  );

  updateStatusBar();
  if (viewProvider) viewProvider.broadcast();
}

function updateStatusBar() {
  const info = countdownManager.getStatusInfo();
  statusBarItem.text = info.text;
  statusBarItem.tooltip = info.tooltip;

  if (!info.isActive) {
    statusBarItem.backgroundColor = undefined;
    statusBarItem.color = undefined;
  } else {
    const remaining = countdownManager.getRemainingTime();
    if (remaining < 15 * 60 * 1000) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (remaining < 60 * 60 * 1000) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      statusBarItem.backgroundColor = undefined;
    }
  }

  statusBarItem.show();
}

function autoResetIfNewDay(context) {
  const savedDate = context.globalState.get('countdown.date');
  const today = new Date().toDateString();

  if (savedDate && savedDate !== today) {
    countdownManager.resetTimer();
    updateStatusBar();
  }
}

function deactivate() {
  if (countdownManager) {
    countdownManager.dispose();
  }
}

module.exports = { activate, deactivate };