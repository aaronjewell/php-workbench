<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpParser\NodeTraverser;

class ClearableTraverser extends NodeTraverser
{
    public function clear(): void
    {
        $this->visitors = [];
    }
}