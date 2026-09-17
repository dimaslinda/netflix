<?php

declare(strict_types=1);

use App\Support\Subtitle\VttConverter;

describe('normalisasi SRT ke VTT', function () {
    it('memberi kepala WEBVTT dan mengubah koma milidetik menjadi titik', function () {
        $vtt = VttConverter::normalize("1\n00:00:20,000 --> 00:00:24,400\nHalo dunia\n");

        expect($vtt)->toStartWith("WEBVTT\n\n")
            ->and($vtt)->toContain('00:00:20.000 --> 00:00:24.400')
            ->and($vtt)->toContain('Halo dunia')
            ->and($vtt)->not->toContain("\n1\n");
    });

    it('mempertahankan baris dialog yang isinya hanya angka', function () {
        $srt = <<<'SRT'
        1
        00:00:01,000 --> 00:00:02,000
        1999

        2
        00:00:03,000 --> 00:00:04,000
        911
        SRT;

        $vtt = VttConverter::normalize($srt);

        // Nomor urut 1 dan 2 hilang, dialog 1999 dan 911 tetap ada.
        expect($vtt)->toContain('1999')
            ->and($vtt)->toContain('911')
            ->and(substr_count($vtt, '-->'))->toBe(2);
    });

    it('membiarkan berkas yang sudah berformat VTT apa adanya', function () {
        $vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nSudah VTT";

        expect(VttConverter::normalize($vtt))->toBe($vtt);
    });

    it('menangani akhir baris gaya Windows', function () {
        $vtt = VttConverter::normalize("1\r\n00:00:01,000 --> 00:00:02,000\r\nBaris CRLF\r\n");

        expect($vtt)->toContain('Baris CRLF')
            ->and($vtt)->not->toContain("\r");
    });
});

describe('pembacaan dan penulisan ulang cue', function () {
    $sample = <<<'SRT'
    1
    00:00:01,000 --> 00:00:02,000
    Good morning

    2
    00:00:03,000 --> 00:00:05,000
    How are you?
    I am fine.
    SRT;

    it('mengambil hanya teks dialog, tanpa baris waktu', function () use ($sample) {
        expect(VttConverter::cueTexts($sample))->toBe([
            'Good morning',
            "How are you?\nI am fine.",
        ]);
    });

    it('menulis ulang teks dialog tanpa menggeser penanda waktu', function () use ($sample) {
        $result = VttConverter::replaceCueTexts($sample, [
            'Selamat pagi',
            "Apa kabar?\nSaya baik.",
        ]);

        expect($result)->toContain('00:00:01.000 --> 00:00:02.000')
            ->and($result)->toContain('00:00:03.000 --> 00:00:05.000')
            ->and($result)->toContain('Selamat pagi')
            ->and($result)->toContain('Apa kabar?')
            ->and($result)->toContain('Saya baik.')
            ->and($result)->not->toContain('Good morning');
    });

    it('membiarkan cue yang tidak punya pengganti tetap dalam bahasa asli', function () use ($sample) {
        // Terjemahan yang gagal separuh tidak boleh membuat takarir bolong.
        $result = VttConverter::replaceCueTexts($sample, ['Selamat pagi']);

        expect($result)->toContain('Selamat pagi')
            ->and($result)->toContain('How are you?')
            ->and(substr_count($result, '-->'))->toBe(2);
    });

    it('bolak-balik tanpa kehilangan satu cue pun', function () use ($sample) {
        $texts = VttConverter::cueTexts($sample);
        $rebuilt = VttConverter::replaceCueTexts($sample, $texts);

        expect(VttConverter::cueTexts($rebuilt))->toBe($texts);
    });
});
