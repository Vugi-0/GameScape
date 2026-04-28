document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn      = document.getElementById('registerBtn');
    const errorMsg = document.getElementById('errorMsg');

    btn.textContent = 'Creating account...';
    btn.disabled    = true;
    errorMsg.style.display = 'none';

    const genderInput = document.querySelector('input[name="gender"]:checked');

    const payload = {
        username:         document.getElementById('username').value.trim(),
        password:         document.getElementById('password').value,
        confirm_password: document.getElementById('confirm_password').value,
        full_name:        document.getElementById('full_name').value.trim(),
        email:            document.getElementById('email').value.trim(),
        birthday:         document.getElementById('birthday').value,
        gender:           genderInput ? genderInput.value : ''
    };

    try {
        const res  = await fetch('/api/register', {
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
            errorMsg.textContent   = data.error || 'Registration failed';
            errorMsg.style.display = 'block';
            btn.textContent        = 'Register';
            btn.disabled           = false;
        }

    } catch (err) {
        errorMsg.textContent   = 'Network error – please try again';
        errorMsg.style.display = 'block';
        btn.textContent        = 'Register';
        btn.disabled           = false;
    }
});
