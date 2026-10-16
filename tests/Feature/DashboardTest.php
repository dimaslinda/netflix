<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

// Aplikasi ini tidak punya halaman dasbor: /dashboard hanya alamat lama yang
// dialihkan ke halaman akun (routes/web.php).
test('authenticated users are redirected from the dashboard to their account', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))->assertRedirect(route('account'));
});
