document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn      = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');

    btn.textContent = 'Signing in...';
    btn.disabled    = true;
    errorMsg.style.display = 'none';

    const payload = {
        username_or_email: document.getElementById('username_or_email').value.trim(),
        password:          document.getElementById('password').value
    };

    try {
        const res  = await fetch('/api/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            if (window.parent && window.parent.setLoggedIn) {
                window.parent.setLoggedIn(true, data.username);
            }
            window.parent.closeModalPage();
        } else {
            errorMsg.textContent   = data.error || 'Login failed';
            errorMsg.style.display = 'block';
            btn.textContent        = 'Sign In';
            btn.disabled           = false;
        }

    } catch (err) {
        errorMsg.textContent   = 'Network error – please try again';
        errorMsg.style.display = 'block';
        btn.textContent        = 'Sign In';
        btn.disabled           = false;
    }
});
