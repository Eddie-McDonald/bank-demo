let currentUsername = null;

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const currentUsernameSpan = document.getElementById('current-username');
const balanceAmount = document.getElementById('balance-amount');
const refreshBalanceButton = document.getElementById('refresh-balance-button');
const transferForm = document.getElementById('transfer-form');
const transferMessage = document.getElementById('transfer-message');
const logoutButton = document.getElementById('logout-button');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  loginMessage.textContent = '';
  loginMessage.className = 'message';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      currentUsername = username;
      currentUsernameSpan.textContent = username;
      loginSection.hidden = true;
      dashboardSection.hidden = false;
      loginForm.reset();
      await loadBalance();
    } else {
      loginMessage.textContent = body.message || 'Login failed';
      loginMessage.className = 'message error';
    }
  } catch (err) {
    loginMessage.textContent = 'Could not reach server';
    loginMessage.className = 'message error';
  }
});

async function loadBalance() {
  balanceAmount.textContent = '...';
  try {
    const res = await fetch(`/api/accounts/${encodeURIComponent(currentUsername)}/balance`);
    const body = await res.json();
    balanceAmount.textContent = res.ok ? Number(body.balance).toFixed(2) : '?';
  } catch (err) {
    balanceAmount.textContent = '?';
  }
}

refreshBalanceButton.addEventListener('click', loadBalance);

transferForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const to_username = document.getElementById('transfer-to').value.trim();
  const amount = document.getElementById('transfer-amount').value;

  transferMessage.textContent = '';
  transferMessage.className = 'message';

  try {
    const res = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_username: currentUsername,
        to_username,
        amount: Number(amount),
      }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      transferMessage.textContent = `Sent ${body.amount} to ${body.to_username}`;
      transferMessage.className = 'message success';
      transferForm.reset();
      await loadBalance();
    } else {
      transferMessage.textContent = body.detail || body.message || 'Transfer failed';
      transferMessage.className = 'message error';
    }
  } catch (err) {
    transferMessage.textContent = 'Could not reach server';
    transferMessage.className = 'message error';
  }
});

logoutButton.addEventListener('click', () => {
  currentUsername = null;
  dashboardSection.hidden = true;
  loginSection.hidden = false;
  balanceAmount.textContent = '-';
  transferMessage.textContent = '';
});
