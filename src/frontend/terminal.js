import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// Connect to server
const socket = io();

// Initialize xterm.js terminal
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

// Copy (Ctrl+C)
term.attachCustomKeyEventHandler((event) => {
  if (event.ctrlKey && event.key.toLowerCase() === 'c') {
    const selection = term.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }

    return false; // Prevent default behavior
  }

  return true; // Allow all other events
});

// Receive sqlcl output from server
socket.on('output', (data) => {
  term.write(data);
});

// Send user input from terminal to server
term.onData((data) => {
  socket.emit('input', data);
});

// Toolbar - emit to server helper
function sendCommand(cmd) {
  socket.emit('toolbar', cmd);
}

// Toolbar - connect to DB
function sendConnect() {
  const inputElement = document.getElementById('connectInput');

  let url = String(inputElement.value).trim();

  // If the user provides no input, use the last connection string
  if (!url) {
    url = localStorage.getItem('lastConnection') || '';
  }

  // If only a username is provided, assume the user wants to connect to the default BME server
  if (!url.includes('@')) {
    url += '@//rapid.eik.bme.hu:1521/szglab';
  }

  if (url) {
    sendCommand(`CONNECT ${url}`);

    // Save the last connection string to localStorage
    localStorage.setItem('lastConnection', url);
  }

  // Update input field to reflect the actual connection string used
  inputElement.value = url;
}

// Toolbar - run script
function sendScript() {
  const inputElement = document.getElementById('scriptInput');
  const path = 'output/' + inputElement.value || inputElement.placeholder;
  if (path) sendCommand(`START ${path}`);
}

// Toolbar - spool on
function sendSpoolOn() {
  const inputElement = document.getElementById('spoolInput');
  const filename = 'output/' + inputElement.value || inputElement.placeholder;
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
