<?php

declare(strict_types=1);

namespace PhpWorkbench;

class Timeout
{
    public static function set(int $seconds): void
    {
        if (self::isSupported()) {
            \pcntl_async_signals(true);
            \pcntl_signal(SIGALRM, fn () => throw new \RuntimeException('Execution timed out.'));
            \pcntl_alarm($seconds);
        }
    }

    public static function clear(): void
    {
        if (self::isSupported()) {
            \pcntl_alarm(0);
            \pcntl_signal(SIGALRM, SIG_DFL);
        }
    }

    protected static function isSupported(): bool
    {
        return \function_exists('pcntl_async_signals');
    }
} 