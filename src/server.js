// Load .env
require('dotenv').config({ quiet: true });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');

// .env validation
const SQLCL_PATH = process.env.SQLCL_PATH;
const PORT = process.env.PORT;
if (!PORT || !SQLCL_PATH) {
  console.error('\nEnv vars are not supplied.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  console.log(`\nFaStQL GUI connected. Session ID: ${socket.id}`);

  // Spawn the terminal (for each client)
  let sqlcl;
  try {
    sqlcl = pty.spawn(SQLCL_PATH, ['/nolog'], {
      name: 'xterm-color',
      cols: 120,
      rows: 30,
      cwd: path.join(__dirname, '../'),
      env: process.env,
    });
  } catch (err) {
    socket.emit('output', `Error starting SQLcl: ${err.message}\r\nDisconnecting...`);
    console.error(`Error starting SQLcl: ${err.message}`);
    socket.disconnect();
    return;
  }

  // Send SQLcl output to client
  sqlcl.on('data', (data) => {
    socket.emit('output', data);
  });

  // Receive input from frontend terminal
  socket.on('input', (data) => {
    sqlcl.write(data);
  });

  // Toolbar commands (buttons)
  socket.on('toolbar', (cmd) => {
    // Handle spool command (create file if not exists)
    const trimmed = cmd.trim();

    if (trimmed.startsWith('SPOOL ')) {
      const pathToFile = trimmed.substring(6).trim();

      if (pathToFile !== 'OFF') {
        try {
          const dir = path.dirname(pathToFile);
          if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            socket.emit('output', `\r\nDirectory created: ${dir}\r\n`);
          }
          if (!fs.existsSync(pathToFile)) {
            fs.writeFileSync(pathToFile, '');
            socket.emit('output', `\r\nSpool file created: ${pathToFile}\r\n`);
          }
        } catch {
          socket.emit('output', `\r\nError creating directory for spool file: ${pathToFile}\r\n`);
        }
      }
    }

    // Foward the command to sqlcl
    sqlcl.write(cmd + '\r');
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    sqlcl.kill();
  });

  // Exit handling (SQL: EXIT)
  sqlcl.on('exit', (code) => {
    socket.emit('output', `\r\nSQLcl exited (code ${code})\r\n`);
    socket.disconnect();
  });

  // Error handling
  sqlcl.on('error', (err) => {
    socket.emit('output', `\r\nSQLcl error: ${err.message}\r\n`);
  });
});

server.listen(PORT, () => {
  console.log('\n\n==== FaStQL GUI ====');
  console.log(`Server running at http://localhost:${PORT}`);
});
