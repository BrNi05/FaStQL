const scripterWindow = document.getElementById('scripterWindow');
const openScripterBtn = document.getElementById('openScripterBtn');
const scripterCloseBtn = scripterWindow.querySelector('.close-btn');
const titlebar = scripterWindow.querySelector('.sql-editor-titlebar');
const resizeHandle = scripterWindow.querySelector('.resize-handle');

openScripterBtn.addEventListener('click', () => {
  scripterWindow.style.display = scripterWindow.style.display === 'flex' ? 'none' : 'flex';
});

scripterCloseBtn.addEventListener('click', () => {
  scripterWindow.style.display = 'none';
});

// Windows dragging
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

titlebar.addEventListener('mousedown', (e) => {
  if (e.target === scripterCloseBtn) return;
  isDragging = true;
  dragOffsetX = e.clientX - scripterWindow.offsetLeft;
  dragOffsetY = e.clientY - scripterWindow.offsetTop;
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  scripterWindow.style.left = e.clientX - dragOffsetX + 'px';
  scripterWindow.style.top = e.clientY - dragOffsetY + 'px';
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
  }
});

// Window resizing
// Since the resize handle overlaps the scrollbar, I use pointer events to avoid buggy behavior
let isResizing = false;
let startX, startY, startWidth, startHeight;

resizeHandle.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  isResizing = true;
  document.body.style.userSelect = 'none';
  startX = e.clientX;
  startY = e.clientY;
  startWidth = scripterWindow.offsetWidth;
  startHeight = scripterWindow.offsetHeight;
  resizeHandle.setPointerCapture(e.pointerId);
});

document.addEventListener('pointermove', (e) => {
  if (!isResizing) return;

  let newWidth = startWidth + (e.clientX - startX);
  let newHeight = startHeight + (e.clientY - startY);

  const maxWidth = window.innerWidth - scripterWindow.offsetLeft - 10;
  const maxHeight = window.innerHeight - scripterWindow.offsetTop - 10;
  newWidth = Math.min(Math.max(newWidth, 740), maxWidth);
  newHeight = Math.min(Math.max(newHeight, 400), maxHeight);

  scripterWindow.style.width = newWidth + 'px';
  scripterWindow.style.height = newHeight + 'px';
});

document.addEventListener('pointerup', (e) => {
  if (isResizing) {
    isResizing = false;
    document.body.style.userSelect = '';
    if (resizeHandle.hasPointerCapture(e.pointerId)) resizeHandle.releasePointerCapture(e.pointerId);
  }
});
