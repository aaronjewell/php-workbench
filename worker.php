#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Psy\CodeCleaner;
use Psy\Context;
use PhpWorkbench\ErrorHandler;
use PhpWorkbench\ExecutionClosure;
use PhpWorkbench\Executor;
use PhpWorkbench\Input;
use PhpWorkbench\Output;

try {
    $executor = new Executor(
        new Context(),
        new Input(fopen('php://stdin', 'r')),
        new Output(fopen('php://stdout', 'w')),
        new CodeCleaner(),
        new ErrorHandler(),
    );

    $loop = new ExecutionClosure($executor);

    $loop->execute();
} catch (Throwable $e) {
    error_log($e->getMessage(), 3, 'tmp/extension_errors.log');
}