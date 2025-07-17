<?php

declare(strict_types=1);

namespace PhpWorkbench;

use PhpParser\Node;
use PhpParser\Node\Stmt\Class_;
use Psy\CodeCleaner\CodeCleanerPass;

/**
 * When a class is defined, wrap it in a class_exists check.
 * 
 * This is a workaround for the fact that PHP does not support duplicate class declarations.
 * 
 * @see https://www.php.net/manual/en/language.oop5.basic.php#language.oop5.basic.class.class-exists
 *
 */
class PreventDuplicateClassPass extends CodeCleanerPass
{
    public function __construct(private CodeCleaner $cleaner)
    {
    }

    public function leaveNode(Node $node)
    {
        if ($node instanceof Class_) {
            return new Node\Stmt\If_(
                new Node\Expr\BooleanNot(
                    new Node\Expr\FuncCall(
                        new Node\Name('class_exists'),
                        [new Node\Arg(new Node\Scalar\String_($this->fullyQualifiedName($node)))]
                    ),
                ),
                [
                    'stmts' => [$node],
                ]
            );
        }

        return $node;
    }

    protected function fullyQualifiedName(Class_ $node): string
    {
        if ($namespaced = $node->namespacedName?->toCodeString()) {
            return $namespaced;
        }

        $name = [$node->name->name];
        if ($namespace = $this->cleaner->getNamespace()) {
            $name = array_merge($namespace, $name);
        }

        return new Node\Name\FullyQualified($name)->toCodeString();
    }
}