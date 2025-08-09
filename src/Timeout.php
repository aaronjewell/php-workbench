<?php

declare(strict_types=1);

namespace PhpWorkbench;

class Timeout
{
    static private int $defaultSeconds = 30;

    public static function init(?int $seconds = null): void
    {
        self::$defaultSeconds = $seconds ?? self::$defaultSeconds;
    }

    public static function set(?int $seconds = null): void
    {
        if (self::isSupported() && $seconds !== 0) {
            \pcntl_async_signals(true);
            \pcntl_signal(SIGALRM, fn () => throw new \RuntimeException('Execution timed out.'));
            \pcntl_alarm($seconds ?? self::$defaultSeconds);
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