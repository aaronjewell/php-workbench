<?php

declare(strict_types=1);

namespace PhpWorkbench;

/**
 * Centralized runtime configuration.
 */
class Configuration
{
    public const ENV_TOKEN = 'PHP_WORKBENCH_TOKEN';
    public const ENV_DEBUG = 'PHP_WORKBENCH_DEBUG';
    public const ENV_TIMEOUT = 'PHP_WORKBENCH_TIMEOUT';
    public const ENV_LOG = 'PHP_WORKBENCH_LOG';

    public function __construct(
        private string $token,
        private bool $debugEnabled,
        private ?int $timeoutSeconds,
        private ?string $logDestination,
    ) {
    }

    /** Create configuration by reading process environment variables. */
    public static function fromEnvironment(): self
    {
        $token = getenv(self::ENV_TOKEN);
        if ($token === false || $token === '') {
            throw new \RuntimeException('Error: token required', 1);
        }

        $debug = self::parseBoolEnv(self::ENV_DEBUG);
        $timeout = self::parseIntEnv(self::ENV_TIMEOUT);
        $log = self::parseStringEnv(self::ENV_LOG);

        return new self((string) $token, $debug, $timeout, $log);
    }

    /** Whether debug logging is enabled. Mirrors existing env semantics. */
    public function isDebugEnabled(): bool
    {
        return $this->debugEnabled;
    }

    /** Path for logs or null/'stderr' meaning STDERR. */
    public function getLogDestination(): ?string
    {
        return $this->logDestination;
    }

    /** Execution timeout in seconds, or null to use default. */
    public function getTimeoutSeconds(): ?int
    {
        return $this->timeoutSeconds;
    }

    /** Required execution token used to validate RPC requests. */
    public function getToken(): string
    {
        return $this->token;
    }

    private static function parseStringEnv(string $name): ?string
    {
        $value = strtolower(trim((string) getenv($name)));
        if ($value === '') {
            return null;
        }
        return $value;
    }

    private static function parseBoolEnv(string $name): bool
    {
        $value = strtolower(trim((string) getenv($name)));
        if ($value === '0' || $value === 'false') {
            return false;
        }
        return true;
    }

    private static function parseIntEnv(string $name): ?int
    {
        $value = self::parseStringEnv($name);
        if ($value === null || !is_numeric($value)) {
            return null;
        }
        return (int) $value;
    }
}


