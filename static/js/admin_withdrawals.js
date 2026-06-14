async function approveWithdrawal(id, btn) {
  if (!confirm('Approve and send payment via Paystack?')) return;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const resp = await fetch('/admin/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    const data = await resp.json();
    if (resp.ok && data.ok) {
      location.reload();
    } else {
      alert('Transfer failed: ' + (data.error || 'Unknown error'));
      btn.disabled = false;
      btn.textContent = 'Approve & Pay';
    }
  } catch (e) {
    alert('Network error: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Approve & Pay';
  }
}

async function rejectWithdrawal(id) {
  if (!confirm('Reject this withdrawal and refund the reseller?')) return;
  const resp = await fetch('/admin/withdrawals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: 'failed' }),
  });
  if (resp.ok) location.reload();
}

document.querySelectorAll('.approve-btn').forEach(btn => {
  btn.addEventListener('click', () => approveWithdrawal(btn.dataset.id, btn));
});
document.querySelectorAll('.mark-failed-btn').forEach(btn => {
  btn.addEventListener('click', () => rejectWithdrawal(btn.dataset.id));
});
