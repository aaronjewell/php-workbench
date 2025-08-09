<?php

declare(strict_types=1);

namespace PhpWorkbench;

/**
 * Minimal opt-in logger for the PHP code runner.
 *
 * Why: We need diagnostic visibility that does not interfere with the
 * evaluated program output, which is buffered and sent over JSON-RPC.
 *
 * What: Writes structured, single-line log records to STDERR or a file when
 * enabled via environment variables. Safe to call from anywhere; no-op when
 * disabled. Uses a static facade to avoid threading dependencies through
 * business logic paths.
 */
class Logger
{
    private static bool $enabled = false;
    /** @var resource|null */
    private static $stream = null;
    private static bool $needsClose = false;

    /**
     * Initialize logger from env or explicit parameters.
     *
     * @param bool $enabled Whether logging is enabled
     * @param string|null $destination Path to a file. If null or 'stderr', logs go to STDERR.
     */
    public static function init(bool $enabled, ?string $destination = null): void
    {
        self::$enabled = $enabled;

        if (!self::$enabled) {
            return;
        }

        if ($destination === null || $destination === '' || strtolower($destination) === 'stderr') {
            self::$stream = fopen('php://stderr', 'ab');
            self::$needsClose = true;
            return;
        }

        // Attempt to open the provided file path in append mode.
        $stream = @fopen($destination, 'ab');
        if ($stream === false) {
            // Fallback to STDERR if file cannot be opened
            self::$stream = fopen('php://stderr', 'ab');
            self::$needsClose = true;
            self::log('WARN', 'Failed to open log file, falling back to STDERR', ['path' => $destination]);
            return;
        }

        self::$stream = $stream;
        self::$needsClose = true;
    }

    /** Close the stream if we opened it. */
    public static function shutdown(): void
    {
        if (self::$stream && self::$needsClose) {
            @fflush(self::$stream);
            @fclose(self::$stream);
        }
        self::$stream = null;
        self::$needsClose = false;
        self::$enabled = false;
    }

    public static function debug(string $message, array $context = []): void
    {
        self::log('DEBUG', $message, $context);
    }

    public static function info(string $message, array $context = []): void
    {
        self::log('INFO', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::log('ERROR', $message, $context);
    }

    /**
     * Core log writer (no-op when disabled).
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        if (!self::$enabled) {
            return;
        }

        if (!is_resource(self::$stream)) {
            // As a last-ditch effort, try STDERR.
            self::$stream = @fopen('php://stderr', 'ab');
            self::$needsClose = true;
            if (!is_resource(self::$stream)) {
                // Nowhere to write
                return;
            }
        }

        $timestamp = date('c');
        $pid = getmypid();
        $record = sprintf('[%s] [%s] [pid:%s] %s', $timestamp, $level, (string) $pid, $message);

        if (!empty($context)) {
            // Keep context compact and single-line
            $json = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $record .= ' ' . $json;
        }

        @fwrite(self::$stream, $record . PHP_EOL);
        @fflush(self::$stream);
    }
}


