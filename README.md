# VSCode Work Countdown

A VS Code extension that displays a real-time countdown timer for a 9-hour workday (8 hours work + 1 hour break) in the Activity Bar sidebar.

## Features

- **Activity Bar icon** — appears alongside Explorer, Search, Source Control
- **Status bar countdown** — always visible remaining time in the bottom-right
- **Set start time once** — timer automatically calculates your end time (9 hours later)
- **Pause/Resume** — pause the timer for additional breaks beyond the built-in 1 hour
- **Auto-reset daily** — timer resets automatically each new day
- **Color indicators** — green (> 1h), yellow (< 1h), red (< 15min)
- **Compact 2-column sidebar UI** — clock circle + time info + progress bar + controls

## Screenshot

```
┌─────────┬──────────────────┐
│  ⏰     │ Start     08:00  │
│ 04:32   │ End       17:00  │
│  LEFT   │ ████████░░░░░░░  │
│ Working │   [⏯️]  [🔄]    │
└─────────┴──────────────────┘
```

## Usage

1. Click the **watch icon** in the Activity Bar (left sidebar)
2. Click **Set Start Time** in the panel, or click the clock in the status bar
3. Enter your start time (e.g. `08:00`, `08.30`, `09:15`)
4. The countdown begins automatically — 9 hours total

### Commands

| Command | Description |
|---|---|
| `Work Countdown: Set Start Time` | Set or reset your start time |
| `Work Countdown: Show Countdown` | Focus the countdown panel |
| `Work Countdown: Pause/Resume Break` | Pause/resume for additional breaks |
| `Work Countdown: Reset Timer` | Clear all timer data |

## Configuration

| Setting | Default | Description |
|---|---|---|
| `workcountdown.workDuration` | `9` | Total work duration in hours |
| `workcountdown.showSeconds` | `true` | Show seconds in the countdown panel |
| `workcountdown.alertBeforeEnd` | `30` | Notification minutes before time ends |

## Installation

### From VSIX

```bash
code --install-extension vscode-work-countdown-1.0.0.vsix
```

### Manual

Copy the extension folder to:

- **Windows:** `%USERPROFILE%\.vscode\extensions\work-countdown\`
- **macOS:** `~/.vscode/extensions/work-countdown/`
- **Linux:** `~/.vscode/extensions/work-countdown/`

Then restart VS Code.

## Requirements

- VS Code `^1.74.0`

## License

MIT