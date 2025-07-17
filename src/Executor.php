<?php

declare(strict_types=1);

namespace PhpWorkbench;

use Psy\CodeCleaner\NoReturnValue;
use Psy\Context;
use PhpWorkbench\CodeCleaner;
use PhpWorkbench\Input;

class Executor {

    protected bool $lastExecSuccess = false;

    protected string $code = '';

    public function __construct(
        protected Context $context,
        protected Input $input,
        protected Output $output,
        protected CodeCleaner $cleaner,
        protected ErrorHandler $errorHandler,
    ) {
    }

    public function wasLastExecSuccessful(): bool
    {
        return $this->lastExecSuccess;
    }

    public function shouldContinue(): bool
    {
        return $this->input->hasMore();
    }

    public function getInput(): void
    {
        $params = $this->input->read();
        $this->addCode($params[0]);
        $this->setWorkingDirectory($params[1]);
    }

    public function addCode(string $code): void
    {
        $dirty = $code;
        
        // strip off <?php if exists
        $code = preg_replace('/^<\?php\s*/', '', $code);

        // also handle shorthand opening tags
        $code = preg_replace('/^<\?=\s*/', '', $code);

        // lastly, strip off the closing tag
        $code = preg_replace('/^<\?\s*\s*$/', '', $code);

        if ($clean = $this->cleaner->clean([ $code ])) {
            $this->code .= $clean;
            $this->output->writeDirty($dirty);
            $this->output->writeCleaned($clean);
        }
    }

    public function flushCode(): string
    {
        return trim($this->code) ?: 'return null;';
    }

    public function setWorkingDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        chdir($directory);
    }

    public function getBoundClass(): ?string
    {
        return $this->context->getBoundClass();
    }

    /**
     * Set the variables currently in scope.
     *
     * @param array $vars
     */
    public function setScopeVariables(array $vars)
    {
        $this->context->setAll($vars);
    }

    /**
     * Return the set of variables currently in scope.
     * 
     * Excludes 'this' so may return array may be safely passedIf you're
     * to `extract`
     *
     * @return array Associative array of scope variables
     */
    public function getScopeVariables(): array
    {
        $vars = $this->context->getAll();

        unset($vars['this']);

        return $vars;
    }

    /**
     * Return the set of variables currently in scope which differ from the
     * values passed as $currentVars.
     *
     * This is used inside the Execution Closure loop to pick up scope variable
     * changes made by commands while the loop is running.
     *
     * @param array $currentVars
     *
     * @return array Associative array of scope variables which differ from $currentVars
     */
    public function getScopeVariablesDiff(array $currentVars): array
    {
        // @todo: can we replace this with a flag to extract instead?

        $newVars = [];

        foreach ($this->getScopeVariables(false) as $key => $value) {
            if (!\array_key_exists($key, $currentVars) || $currentVars[$key] !== $value) {
                $newVars[$key] = $value;
            }
        }

        return $newVars;
    }

    /**
     * Write a string to stdout.
     *
     * This is used by the shell loop for rendering output from evaluated code.
     *
     * @param string $out
     * @param int $phase Output buffering phase
     */
    public function handleStdout(string $out, int $phase = \PHP_OUTPUT_HANDLER_FINAL)
    {

        if ($out !== '' && !($phase & \PHP_OUTPUT_HANDLER_CLEAN)) {
            $this->output->writeStdout($out);
        }

        if ($phase & \PHP_OUTPUT_HANDLER_FINAL) {

            if ($this->output->getOutputBuffer() !== '') {
                $this->context->setLastStdout($this->output->getOutputBuffer());
            }
        }
    }

    public function setErrorReporting(): void
    {
        $this->errorHandler->setErrorReporting();
    }

    public function handleError(int $errNo, string $errStr, string $errFile, int $errLine): void
    {
        $exception = $this->errorHandler->handle($errNo, $errStr, $errFile, $errLine);

        if ($exception) {
            $this->writeException($exception);
        }
    }

    /**
     * Write a return value to output.
     * 
     * Stores $value as the last return value in the context.
     *
     * @param mixed $value
     */
    public function writeReturnValue($value): void
    {
        $this->lastExecSuccess = true;

        if ($value instanceof NoReturnValue) {
            $this->output->writeReturnValue(null);
            return;
        }

        $this->context->setReturnValue($value);

        $this->output->writeReturnValue($value);
    }

    /**
     * Write a caught Exception or Error to output.
     *
     * Stores $e as the last Exception in the context
     *
     * @param \Throwable $e An exception or error instance
     */
    public function writeException(\Throwable $e): void
    {
        $this->lastExecSuccess = false;
        $this->context->setLastException($e);

        $this->output->writeException($e);
    }

    public function flushOutput(): void
    {
        $this->code = '';
        $this->output->flush($this->input->getId());
    }
}