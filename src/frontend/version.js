const semver = require('semver');

function showUpdateModal(message) {
  const modal = document.getElementById('updateModal');
  modal.querySelector('.update-message').textContent = message;
  modal.style.display = 'block';

  modal.querySelector('.update-close').onclick = () => {
    modal.style.display = 'none';
  };
}

async function checkVersion() {
  try {
    // Fetch current and latest version from backend
    const res = await fetch('/version');
    const { currentVersion, latest } = await res.json();

    // Show modal if a newer version exists
    if (semver.lt(currentVersion, latest)) {
      showUpdateModal(
        `A new version is available! ${currentVersion} -> ${latest}\n\nUse: docker pull brni05/fastql:latest\nThen: restart the container`
      );
    }
  } catch (err) {
    console.warn('FaStQL: Version check failed.', err);
  }
}

// Run version check on page load
checkVersion();
