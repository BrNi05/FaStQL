// Load .env
require('dotenv').config({ quiet: true });

// Networking
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Pseudo-terminal
const pty = require('node-pty');

// Paths and FS
const path = require('path');
const fs = require('fs');

// .env validation
const SQLCL_PATH = process.env.SQLCL_PATH;
const PORT = process.env.PORT;
if (!PORT || !SQLCL_PATH) {
  console.error('\nEnv vars are not supplied. Exiting...\n');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Parse JSON bodies
app.use(express.json());

// Serve static files with no caching
app.use(
  express.static(path.join(__dirname, '../public'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },
  })
);

// Create directories if not exist
const outputDir = path.join(__dirname, '..', 'output');
const composerDir = path.join(outputDir, '.composer');
const tempDir = path.join(composerDir, '.temp');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(composerDir)) fs.mkdirSync(composerDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Clear output/.composer/.temp dir on startup
function clearTempDir() {
  fs.readdirSync(tempDir).forEach((file) => {
    const filePath = path.join(tempDir, file);
    if (fs.lstatSync(filePath).isFile()) fs.unlinkSync(filePath);
  });
}

clearTempDir();

// Clear output/.composer/.temp dir on SIGTERM (docker compose down)
process.on('SIGTERM', () => {
  clearTempDir();
  process.exit(0);
});

// Version check endpoint
app.get('/version', async (req, res) => {
  try {
    // Current version
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
    const currentVersion = pkg.version;

    // Latest version
    const dockerRes = await fetch(
      'https://hub.docker.com/v2/repositories/brni05/fastql/tags?page_size=1&page=1&ordering=last_updated'
    );
    if (!dockerRes.ok) throw new Error();

    const jsonDocker = await dockerRes.json();
    const latest = jsonDocker.results[0].name;

    res.json({ currentVersion, latest });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Composer GET endpoint (list)
app.get('/composer', (req, res) => {
  const folderPath = path.join(__dirname, '..', 'output', '.composer');
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('FaStQL: failed to GET', err);
      return res.sendStatus(500);
    }

    // Remove .sql suffix
    files = files.filter((file) => file.endsWith('.sql')).map((file) => file.slice(0, -4));

    res.json(files);
  });
});

// Composer GET endpoint (file content)
app.get('/composer/:filename', (req, res) => {
  const { filename } = req.params;

  const filePath = path.join(__dirname, '..', 'output', '.composer', filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('FaStQL: failed to GET', err);
      return res.sendStatus(500);
    }

    res.json({ filename, content: data });
  });
});

// Composer POST endpoint
app.post('/composer', (req, res) => {
  const { subPath, name, content } = req.body;

  const baseDir = path.join(__dirname, '..', 'output', '.composer');
  const targetDir = path.join(baseDir, subPath);
  const targetPath = path.join(targetDir, name);

  fs.writeFile(targetPath, content, 'utf8', (err) => {
    if (err) {
      console.error('FaStQL: failed to POST', err);
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  });
});

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
    const trimmedCmd = cmd.trim();
    const pathToFile = trimmedCmd.substring(6);

    // Handle spool command (create file if not exists)
    if (trimmedCmd.startsWith('SPOOL ')) {
      if (pathToFile !== 'OFF') {
        try {
          const dir = path.dirname(pathToFile);
          if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // sqlcl does not handle directory creation
            socket.emit('output', `\r\nDirectory created: ${dir}\r\n`);
          }
          if (!fs.existsSync(pathToFile)) {
            fs.writeFileSync(pathToFile, ''); // sqlcl handles file creation, but just to be sure
            socket.emit('output', `\r\nSpool file created: ${pathToFile}\r\n`);
          }
        } catch {
          socket.emit('output', `\r\nError creating directory for spool file: ${pathToFile}\r\n`);
          console.error(`FaStQL: error creating directory for spool file: ${pathToFile}`);
        }
      }
    }

    // Handle run script command (normalize line endings)
    if (trimmedCmd.startsWith('START ')) {
      try {
        let content = fs.readFileSync(pathToFile, 'utf-8');
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        fs.writeFileSync(pathToFile, content, 'utf-8');
      } catch {
        console.error(`FaStQL: error normalizing line endings for script: ${pathToFile}`);
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
    console.log(`SQLcl process exited with code ${code}`);
    socket.disconnect();
  });

  // Error handling
  sqlcl.on('error', (err) => {
    socket.emit('output', `\r\nSQLcl error: ${err.message}\r\n`);
    console.error(`FaStQL: SQLcl error: ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log('\n\n==== FaStQL Server ====');
  console.log(`Server running at http://localhost:${PORT}`);
});
