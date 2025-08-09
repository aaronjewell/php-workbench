<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpWorkbench\Logger;

class ErrorHandler
{
    protected int $errorReporting;
    protected ?\callable $exceptionCallback;

    public function __construct()
    {
        $this->setErrorReporting();
    }

    public function handle(int $errNo, string $errStr, string $errFile, int $errLine): ?\ErrorException
    {
        Logger::debug('Error occurred', ['error' => $errStr, 'file' => $errFile, 'line' => $errLine]);
        $exception = new \ErrorException($errStr, 0, $errNo, $errFile, $errLine);

        if ($errNo & (\E_ERROR | \E_PARSE | \E_CORE_ERROR | \E_COMPILE_ERROR | \E_USER_ERROR | \E_RECOVERABLE_ERROR)) {
            Logger::debug('Error is fatal, throwing exception', ['error' => $errStr, 'file' => $errFile, 'line' => $errLine]);
            throw $exception;
        }

        // When errors are suppressed, the error_reporting value will differ
        // from when we started executing. In that case, we won't log errors.
        $errorsSuppressed = $this->errorReporting !== null && $this->errorReporting !== \error_reporting();
        if ($errorsSuppressed) {
            Logger::debug('Errors suppressed', ['error' => $errStr, 'file' => $errFile, 'line' => $errLine]);
        }

        if ($errNo & \error_reporting() || (!$errorsSuppressed && ($errNo & \E_ALL))) {
            Logger::debug('Error is not fatal, returning exception', ['error' => $errStr, 'file' => $errFile, 'line' => $errLine]);
            return $exception;
        }

        return null;
    }

    public function setErrorReporting(): void
    {
        $this->errorReporting = \error_reporting();
    }

    public function getErrorReporting(): int
    {
        return $this->errorReporting;
    }
}