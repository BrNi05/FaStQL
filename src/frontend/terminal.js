import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// Connect to server
const socket = io();

// Initialize xterm.js
const term = new Terminal({
  cols: 120,
  rows: 30,
  cursorBlink: true,
  fontFamily: `'Cascadia Code', 'Fira Code', monospace`, // Fallback if a font is not available
  fontSize: 14,
  theme: { background: '#1c1c1c', foreground: '#ffffff' },
});

// Fit to container
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));

function fitWithMargin(marginCols = 2) {
  fitAddon.fit();
  const cols = term.cols - marginCols;
  term.resize(cols, term.rows);
}

window.addEventListener('resize', () => fitWithMargin());
fitWithMargin();

// Forward SQLcl output to terminal
socket.on('output', (data) => {
  term.write(data);
});

// Send user input from terminal to backend
term.onData((data) => {
  socket.emit('input', data);
});

// Toolbar - emit to terminal helper
function sendCommand(cmd) {
  socket.emit('toolbar', cmd);
}

// Toolbar - connect to DB
function sendConnect() {
  const url = document.getElementById('connectInput').value;
  if (url) sendCommand(`CONNECT ${url}`);
}

// Toolbar - run script
function sendScript() {
  const inputElement = document.getElementById('scriptInput');
  const path = inputElement.value || inputElement.placeholder;
  if (path) sendCommand(`START ${path}`);
}

// Toolbar - spool on
function sendSpoolOn() {
  const inputElement = document.getElementById('spoolInput');
  const filename = inputElement.value || inputElement.placeholder;
  if (filename) sendCommand(`SPOOL ${filename}`);
}

// Toolbar - spool off
function sendSpoolOff() {
  sendCommand('SPOOL OFF');
}

// Toolbar - clear screen
function sendClear() {
  sendCommand('CLEAR SCREEN');
  term.clear();
  //term.reset();
}

// Add event listeners
document.getElementById('connectBtn').addEventListener('click', sendConnect);
document.getElementById('scriptBtn').addEventListener('click', sendScript);
document.getElementById('spoolOnBtn').addEventListener('click', sendSpoolOn);
document.getElementById('spoolOffBtn').addEventListener('click', sendSpoolOff);
document.getElementById('clearBtn').addEventListener('click', sendClear);
