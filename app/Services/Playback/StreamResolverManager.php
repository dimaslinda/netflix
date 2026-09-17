<?php

declare(strict_types=1);

namespace App\Services\Playback;

use App\Contracts\StreamResolver;
use App\Support\Playback\StreamSource;

/**
 * Titik masuk tunggal untuk mencari sumber tontonan.
 *
 * Controller memanggil manager, bukan resolver satu per satu. Menambah asal
 * baru cukup dengan mendaftarkan implementasi di AppServiceProvider.
 */
final class StreamResolverManager
{
    /** @var array<string, StreamResolver> */
    private array $resolvers = [];

    /** @param  iterable<StreamResolver>  $resolvers */
    public function __construct(iterable $resolvers = [])
    {
        foreach ($resolvers as $resolver) {
            $this->resolvers[$resolver->provider()] = $resolver;
        }
    }

    /**
     * Resolusi terarah ke satu penyedia. Kembalikan null bila penyedia tidak
     * terdaftar, supaya penyedia yang dihapus tidak menjatuhkan permintaan.
     *
     * @param  array<string, string>  $options
     */
    public function resolve(string $provider, string $reference, array $options = []): ?StreamSource
    {
        return $this->resolvers[$provider]?->resolve($reference, $options);
    }

    public function has(string $provider): bool
    {
        return isset($this->resolvers[$provider]);
    }

    /**
     * Daftar penyedia aktif untuk pemilih sumber di frontend.
     *
     * @return array<int, array{provider: string, label: string}>
     */
    public function available(): array
    {
        return array_values(array_map(
            static fn (StreamResolver $resolver): array => [
                'provider' => $resolver->provider(),
                'label' => $resolver->label(),
            ],
            $this->resolvers,
        ));
    }
}
