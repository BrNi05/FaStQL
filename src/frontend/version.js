const semver = require('semver');

import { showAlert } from './alert.js';

async function checkVersion() {
  try {
    // Fetch current and latest version from backend
    const res = await fetch('/version');
    const { currentVersion, latest } = await res.json();

    // Show modal if a newer version exists
    if (semver.lt(currentVersion, latest)) {
      showAlert(
        'FaStQL Update',
        `A new version is available! ${currentVersion} -> ${latest}\n\nUse: docker pull brni05/fastql:latest\nThen: restart the container`
      );
    }
  } catch (err) {
    console.warn('FaStQL: Version check failed.', err);
  }
}

// Run version check on page load
checkVersion();
