<?php

declare(strict_types=1);

/**
 * Penjaga untuk dua kegagalan yang tidak terlihat di uji PHP mana pun.
 *
 * Keduanya hanya muncul di peramban, saat berkas gagal dimuat, dan keduanya
 * mudah dimasukkan kembali tanpa sengaja. Uji ini murah dan menahan keduanya.
 */
$player = __DIR__.'/../../resources/js/components/netflix/VideoPlayer.tsx';

it('tidak memasang crossOrigin pada elemen video', function () use ($player) {
    // Internet Archive mengalihkan unduhan ke server simpul yang balasannya
    // tidak membawa Access-Control-Allow-Origin. Dengan atribut itu terpasang,
    // permintaan menjadi bermode CORS dan setiap berkas Archive gagal dimuat.
    //
    // Yang dicari bentuk atributnya, bukan katanya, supaya komentar penjelas di
    // dalam komponen tidak ikut memicu kegagalan uji.
    expect(file_get_contents($player))->not->toContain('crossOrigin=');
});

it('menyaring kejadian error yang tidak meninggalkan MediaError', function () use ($player) {
    // Melepas sumber juga memancarkan 'error'. Tanpa saringan ini, mode ketat
    // React memunculkan galat palsu sebelum berkas sempat diputar.
    expect(file_get_contents($player))->toContain('video.error === null');
});

it('tidak memanggil load() saat melepas sumber', function () use ($player) {
    $cleanup = str($player)
        ->pipe(file_get_contents(...))
        ->after('const detachSource = () => {')
        ->before('};')
        ->toString();

    expect($cleanup)->toContain('removeAttribute')
        ->and($cleanup)->not->toContain('load()');
});
