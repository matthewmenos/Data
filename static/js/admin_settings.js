const form      = document.getElementById('settings-form');
const errEl     = document.getElementById('settings-error');
const successEl = document.getElementById('settings-success');
const saveBtn   = document.getElementById('save-settings-btn');

form.addEventListener('submit', async e => {
  e.preventDefault();
  errEl.classList.add('hidden');
  successEl.classList.add('hidden');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const fd = new FormData(form);
  const payload = {};

  // Pass all string fields through directly
  fd.forEach((v, k) => { payload[k] = v; });

  // Checkbox: FormData only includes it when checked — explicitly set 0 when unchecked
  const freeToggle = document.getElementById('reg-free-toggle');
  payload['registration_free'] = freeToggle && freeToggle.checked ? '1' : '0';

  // Convert GHS → pesewas for fee fields
  const regGhs = parseFloat(fd.get('reg_fee_ghs')) || 0;
  const wdGhs  = parseFloat(fd.get('min_wd_ghs'))  || 0;
  payload['reseller_registration_fee_pesewas'] = Math.round(regGhs * 100);
  payload['min_withdrawal_pesewas']            = Math.round(wdGhs  * 100);

  // Remove the GHS-named keys (backend stores pesewas keys)
  delete payload['reg_fee_ghs'];
  delete payload['min_wd_ghs'];

  // Drop empty API key fields to avoid overwriting saved values with blanks
  ['paystack_secret_key', 'paystack_public_key', 'gigzhub_api_key'].forEach(k => {
    if (!payload[k]) delete payload[k];
  });

  try {
    const resp = await fetch('/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to save settings.');
    successEl.classList.remove('hidden');
    setTimeout(() => successEl.classList.add('hidden'), 4000);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save all settings';
  }
});
