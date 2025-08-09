<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpWorkbench\Executor;
use PhpWorkbench\Logger;
use PhpWorkbench\Timeout;

class ExecutionClosure
{
    protected \Closure $closure;

    public function __construct(Executor $executor)
    {
        $closure = function () use ($executor) {
            \extract($executor->getScopeVariables());

            while ($executor->shouldContinue()) {
                try {
                    Logger::debug('Waiting for request...');
                    $executor->getInput();
                    Logger::debug('Received request', ['id' => $executor->getCurrentRequestId()]);

                    \error_reporting(\E_ALL);
                    Logger::debug('Error reporting set to E_ALL');

                    try {
                        Timeout::set();
                        Logger::debug('Execution timeout set', ['seconds' => 30]);


                        $autoloader = \getcwd() . '/vendor/autoload.php';
                        if (\file_exists($autoloader)) {
                            require_once $autoloader;
                            Logger::debug('Composer autoloader included');
                        }

                        if ($executor->wasLastExecSuccessful()) {
                            \extract($executor->getScopeVariablesDiff(\get_defined_vars()));
                        }

                        \ob_start([$executor, 'handleStdout']);
                        Logger::debug('Output buffering started');

                        \set_error_handler([$executor, 'handleError']);
                        Logger::debug('Custom error handler installed');

                        $executor->setErrorReporting();

                        $_ = eval($executor->flushCode());
                        Logger::debug('Code evaluated successfully');
                    } catch (\Throwable $e) {
                        Logger::debug('Throwable caught', ['message' => $e->getMessage(), 'code' => $e->getCode(), 'type' => \get_class($e)]);

                        if (\ob_get_level() > 0) {
                            \ob_end_clean();
                            Logger::debug('Output buffer cleaned');
                        }

                        throw $e;
                    } finally {
                        Timeout::clear();
                        Logger::debug('Execution timeout cleared');

                        \restore_error_handler();
                        Logger::debug('Custom error handler restored');

                        \error_reporting($executor->getErrorReporting());
                        Logger::debug('Error reporting restored');
                    }

                    \ob_end_flush();
                    Logger::debug('Output buffer flushed');

                    $executor->setScopeVariables(\get_defined_vars());

                    $executor->writeReturnValue($_);
                } catch (\Throwable $e) {
                    Logger::error('Unhandled exception during evaluation', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'type' => \get_class($e),
                    ]);
                    $executor->writeException($e);
                }

                $executor->flushOutput();
                Logger::debug('Response flushed', ['id' => $executor->getCurrentRequestId()]);
            }
        };
        
        $closure->bindTo($executor->getBoundClass());

        $this->closure = $closure;
    }

    public function execute()
    {
        return ($this->closure)();
    }
}