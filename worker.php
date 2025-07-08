#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Psy\CodeCleaner;
use Psy\Context;
use QuickMix\ErrorHandler;
use QuickMix\ExecutionClosure;
use QuickMix\Executor;
use QuickMix\Input;
use QuickMix\Output;

$executor = new Executor(
    new Context(),
    new Input(fopen('php://stdin', 'r')),
    new Output(fopen('php://stdout', 'w')),
    new CodeCleaner(),
    new ErrorHandler(),
);

$loop = new ExecutionClosure($executor);

$loop->execute();