import axios from 'axios';
import { showAlert } from './alert.js';

export function initSqlEditor(socket) {
  // Elements
  const openSqlEditorBtn = document.getElementById('openSqlEditorBtn');
  const sqlEditorWindow = document.getElementById('sqlEditorWindow');
  const titleBar = sqlEditorWindow.querySelector('.sql-editor-titlebar');
  const closeSqlBtn = titleBar.querySelector('.close-btn');
  const dropdown = document.getElementById('sqlFileDropdown');
  const runSqlBtn = document.getElementById('runSqlBtn');
  const saveSqlBtn = document.getElementById('saveSqlBtn');
  const sqlEditorTextarea = document.getElementById('sqlEditorTextarea');

  // Hide window initially
  sqlEditorWindow.style.display = 'none';

  // Open/close window
  openSqlEditorBtn.addEventListener('click', () => {
    if (sqlEditorWindow.style.display === 'none') {
      sqlEditorWindow.style.display = 'flex';
      populateDropdown();
    } else {
      sqlEditorWindow.style.display = 'none';
    }
  });

  closeSqlBtn.addEventListener('click', () => {
    sqlEditorWindow.style.display = 'none';
  });

  // Run SQL button sends textarea content to server
  runSqlBtn.addEventListener('click', async () => {
    const sqlCode = sqlEditorTextarea.value.trim();
    if (!sqlCode) return showAlert('Composer Error', 'No SQL code to run.');

    const tempFilename = `temp_${Date.now()}.sql`;

    try {
      await axios.post('/composer', {
        subPath: '.temp',
        name: tempFilename,
        content: sqlCode,
      });

      const path = `output/.composer/.temp/${tempFilename}`;
      socket.emit('toolbar', `START ${path}`);
    } catch (err) {
      console.error('FaStQL: failed to run SQL', err);
    }
  });

  // Save SQL button
  saveSqlBtn.addEventListener('click', () => {
    const filename = document.getElementById('saveSqlInput').value.trim();
    if (!filename) return showAlert('Composer Error', 'No filename provided.');
    if (filename.includes('/') || filename.includes('\\') || filename.includes('.'))
      return showAlert('Composer Error', 'Provide only the filename without path or extension.');

    const code = sqlEditorTextarea.value;

    try {
      axios.post('/composer', {
        subPath: '',
        name: `${filename}.sql`,
        content: code,
      });
    } catch (err) {
      console.error('FaStQL: error saving SQL file:', err);
      showAlert('Composer Error', 'Failed to save SQL file.');
    }
  });

  // Populate dropdown
  dropdown.addEventListener('focus', async () => {
    await populateDropdown();
  });

  // Populate dropdown function
  async function populateDropdown() {
    try {
      const res = await axios.get('/composer');
      const files = res.data;

      // Clear old options
      dropdown.innerHTML = '';

      if (files.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'NO SAVED SCRIPTS';
        dropdown.appendChild(option);
      } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select a script --';
        dropdown.appendChild(defaultOption);

        files.forEach((file) => {
          const option = document.createElement('option');
          option.value = file + '.sql';
          option.textContent = file;
          dropdown.appendChild(option);
        });
      }
    } catch (err) {
      console.error('FaStQL: failed to load SQL files', err);
      dropdown.innerHTML = '<option value="">ERROR LOADING FILES</option>';
    }
  }

  // Load SQL script on dropdown selection
  dropdown.addEventListener('change', async () => {
    const selected = dropdown.value;

    if (!selected || selected === '') return;

    try {
      const res = await axios.get(`/composer/${selected}`);
      sqlEditorTextarea.value = res.data.content;
    } catch (err) {
      console.error('FaStQL: failed to load SQL script', err);
    }
  });

  // Window dragging
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titleBar.addEventListener('mousedown', (e) => {
    if (e.target === closeSqlBtn) return;
    isDragging = true;
    offsetX = e.clientX - sqlEditorWindow.offsetLeft;
    offsetY = e.clientY - sqlEditorWindow.offsetTop;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    sqlEditorWindow.style.left = e.clientX - offsetX + 'px';
    sqlEditorWindow.style.top = e.clientY - offsetY + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });

  // Window resizing
  const resizeHandle = sqlEditorWindow.querySelector('.resize-handle');
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const minWidth = 418;
    const minHeight = 300;
    const maxWidth = window.innerWidth - sqlEditorWindow.offsetLeft - 10;
    const maxHeight = window.innerHeight - sqlEditorWindow.offsetTop - 10;

    let newWidth = e.clientX - sqlEditorWindow.offsetLeft;
    let newHeight = e.clientY - sqlEditorWindow.offsetTop;

    sqlEditorWindow.style.width = Math.min(Math.max(newWidth, minWidth), maxWidth) + 'px';
    sqlEditorWindow.style.height = Math.min(Math.max(newHeight, minHeight), maxHeight) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = '';
    }
  });
}
