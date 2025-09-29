import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// Internal
import { initSqlEditor } from './composer.js';

// Connect to server
const socket = io();

// Initialize SQL Editor
initSqlEditor(socket);

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
const terminalElement = document.getElementById('terminal');
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(terminalElement);

function fitWithMargin(marginCols = 2) {
  fitAddon.fit();
  const cols = term.cols - marginCols;
  term.resize(cols, term.rows);
}

window.addEventListener('resize', () => fitWithMargin());
fitWithMargin();

// Track terminal focus
let terminalFocused = false;
terminalElement.addEventListener('focusin', () => (terminalFocused = true));
terminalElement.addEventListener('focusout', () => (terminalFocused = false));

// Event handler - custom keybindings
term.attachCustomKeyEventHandler((event) => {
  // Copy
  if (event.ctrlKey && event.key.toLowerCase() === 'c') {
    const selection = term.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }

    return false; // Prevent default behavior
  }
  // F11 - fullscreen
  else if (event.key === 'F11' && !terminalFocused) {
    // Terminal focus has to be tracked, as enabling fullscreen with a focused terminal is buggy
    document.body.requestFullscreen();
    fitWithMargin();
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
  const userInputElement = document.getElementById('unameInput');
  const pwdInputElement = document.getElementById('pwdInput');

  let username = String(userInputElement.value).trim();
  let password = String(pwdInputElement.value).trim();

  // If the user provides no username, use the stored one
  if (!username) {
    username = localStorage.getItem('lastUsername') || 'neptun';
  }

  // If the user provides no password, use the stored one or fallback to default password
  if (!password) {
    password = localStorage.getItem('lastPassword') || username.toUpperCase();
  }

  // Construct the connection string
  const url = `${username}/${password}@//rapid.eik.bme.hu:1521/szglab`;

  // Save the last used username and password to localStorage
  localStorage.setItem('lastUsername', username);
  if (!/^\*+$/.test(password)) {
    localStorage.setItem('lastPassword', password); // Do not accidentally save the masked password
  }

  // Send the CONNECT command to the server
  sendCommand(`CONNECT ${url}`);

  // Update input fields to reflect the user values
  userInputElement.value = username;
  pwdInputElement.value = password.replace(/./g, '*');
}

// Toolbar - run script
function sendScript() {
  const inputElement = document.getElementById('scriptInput');
  const path = 'output/' + (inputElement.value || inputElement.placeholder);

  // Append .sql extension if not present
  const finalPath = path.endsWith('.sql') ? path : path + '.sql';

  if (path) sendCommand(`START ${finalPath}`);
}

// Toolbar - spool
let spoolActive = false;

const spoolBtn = document.getElementById('spoolBtn');
const spoolInput = document.getElementById('spoolInput');

function toogleSpool() {
  const filename = 'output/' + (spoolInput.value || spoolInput.placeholder);

  // Spool: active, toogle off
  if (spoolActive) {
    sendCommand('SPOOL OFF');
    spoolBtn.textContent = 'SPOOL ✖';
    spoolActive = false;
  }
  // Spool: inactive, toogle on
  else {
    sendCommand(`SPOOL ${filename}`);
    spoolBtn.textContent = 'SPOOL ✔';
    spoolActive = true;
  }
}

// Toolbar - clear screen
function sendClear() {
  sendCommand('CLEAR SCREEN');
  term.clear();
}

// Add event listeners
document.getElementById('connectBtn').addEventListener('click', sendConnect);
document.getElementById('scriptBtn').addEventListener('click', sendScript);
spoolBtn.addEventListener('click', toogleSpool);
document.getElementById('clearBtn').addEventListener('click', sendClear);

// Handle disconnect event
let wasDisconnected = false;
socket.on('disconnect', (reason) => {
  console.warn('Backend disconnected:', reason);
  term.write('\r\n\r\n\x1b[31mFaStQL: Disconnected from backend. Attempting to reconnect...\x1b[0m');
  wasDisconnected = true;
});

// Handle (re)connect event
socket.on('connect', () => {
  if (wasDisconnected) {
    console.log('Connected to backend:', socket.id);
    location.reload();
    wasDisconnected = false;
  }
});
