<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpWorkbench\Executor;

class ExecutionClosure
{
    protected \Closure $closure;

    public function __construct(Executor $executor)
    {
        $closure = function () use ($executor) {
            \extract($executor->getScopeVariables());

            while ($executor->shouldContinue()) {
                try {
                    $executor->getInput();

                    try {
                        if ($executor->wasLastExecSuccessful()) {
                            \extract($executor->getScopeVariablesDiff(\get_defined_vars()));
                        }

                        \ob_start([$executor, 'handleStdout']);

                        \set_error_handler([$executor, 'handleError']);

                        $executor->setErrorReporting();

                        $_ = eval($executor->flushCode());
                    } catch (\Throwable $e) {
                        if (\ob_get_level() > 0) {
                            \ob_end_clean();
                        }

                        throw $e;
                    } finally {
                        \restore_error_handler();
                    }

                    \ob_end_flush();

                    $executor->setScopeVariables(\get_defined_vars());

                    $executor->writeReturnValue($_);
                } catch (\Throwable $e) {
                    $executor->writeException($e);
                }

                $executor->flushOutput();
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