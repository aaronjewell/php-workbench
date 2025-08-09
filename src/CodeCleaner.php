<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpParser\NodeVisitor\NameResolver;
use PhpParser\Parser;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter;
use PhpWorkbench\ClearableTraverser;
use PhpWorkbench\PreventDuplicateClassPass;
use Psy\CodeCleaner as PsyCodeCleaner;
use Psy\CodeCleaner\ImplicitReturnPass;
use Psy\CodeCleaner\NamespacePass;
use Psy\CodeCleaner\UseStatementPass;
use Psy\ParserFactory;

class CodeCleaner extends PsyCodeCleaner
{
    public function __construct(
        protected ?Parser $parser = null,
        protected ?PrettyPrinter $printer = null,
        protected ?ClearableTraverser $traverser = null,
    ) {
        $this->parser = $parser ?? (new ParserFactory())->createParser();
        $this->printer = $printer ?: new PrettyPrinter();
        $this->traverser = $traverser ?: new ClearableTraverser();

        parent::__construct($this->parser, $this->printer, $this->traverser, false, true);

        $this->traverser->clear();

        foreach ($this->getDefaultPasses() as $pass) {
            $this->traverser->addVisitor($pass);
        }
    }

    private function getDefaultPasses(): array
    {
        return [
            new UseStatementPass(),
            new ImplicitReturnPass(),
            new NamespacePass($this), // must be after ImplicitReturnPass
            new NameResolver(null, ['replaceNodes' => false]),
            new PreventDuplicateClassPass($this),
        ];
    }
}