<?php

namespace App\Database\Connectors;

use Illuminate\Database\Connectors\PostgresConnector as BasePostgresConnector;

class NeonPostgresConnector extends BasePostgresConnector
{
    /**
     * Create a DSN string from a configuration.
     *
     * In serverless environments such as Vercel (vercel-php), the libpq library
     * may not support SNI (Server Name Indication). Neon Serverless Postgres requires
     * passing the endpoint ID when SNI is absent.
     *
     * This connector automatically extracts and appends options='endpoint=<endpoint-id>'
     * to the PDO DSN whenever connecting to Neon hosts.
     *
     * @param  array  $config
     * @return string
     */
    protected function getDsn(array $config): string
    {
        $dsn = parent::getDsn($config);

        $host = $config['host'] ?? '';
        $endpoint = $config['endpoint'] ?? null;

        if (! empty($config['options']) && is_string($config['options']) && ! str_contains($dsn, 'options=')) {
            $dsn .= ";options='{$config['options']}'";
        } elseif (! empty($endpoint) && ! str_contains($dsn, 'options=')) {
            $dsn .= ";options='endpoint={$endpoint}'";
        } elseif (! empty($host) && str_contains($host, 'neon.tech') && ! str_contains($dsn, 'options=')) {
            $endpoint = explode('.', $host)[0];
            $dsn .= ";options='endpoint={$endpoint}'";
        }

        return $dsn;
    }

    /**
     * Get the PDO options based on the configuration.
     *
     * When DATABASE_URL contains query parameters like options=endpoint%3D...,
     * Laravel's ConfigurationUrlParser stores 'options' as a string instead of an array.
     * We sanitize it here to prevent array_diff_key TypeError.
     *
     * @param  array  $config
     * @return array
     */
    public function getOptions(array $config): array
    {
        if (isset($config['options']) && ! is_array($config['options'])) {
            unset($config['options']);
        }

        return parent::getOptions($config);
    }
}
