export function showAlert(title, message) {
  const modal = document.getElementById('alertModal');
  modal.querySelector('.alert-title').textContent = title;
  modal.querySelector('.alert-message').textContent = message;
  modal.style.display = 'block';

  modal.querySelector('.alert-close').onclick = () => {
    modal.style.display = 'none';
  };
}
