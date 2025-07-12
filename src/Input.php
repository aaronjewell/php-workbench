<?php

declare(strict_types=1);

namespace PhpWorkbench;

class Input
{
    protected int $id = -1;

    public function __construct(
        protected $resource,
        protected string $token,
    ) {
    }

    public function read(): array
    {
        $this->id = -1;
        
        $headers = '';
        $body = '';

        while (($line = fgets($this->resource)) !== false && trim($line) !== '') {
            $headers .= $line;
        }

        if ($headers === '') {
            return ['', getcwd()];
        }

        if (!preg_match('/Content-Length:\s*(\d+)/i', $headers, $matches)) {
            return ['', getcwd()];
        }

        $len = (int)$matches[1];
        $body = '';

        while (strlen($body) < $len) {
            $body .= fread($this->resource, $len - strlen($body));
        }

        $request = json_decode($body, true);

        if ($request === null || !isset($request['id'], $request['params'])) {
            throw new \RuntimeException('Invalid JSON-RPC request');
        }

        $this->id = $request['id'];

        $params = $request['params'];
        
        // Validate token - expect 3 parameters: code, workdir, token
        if (count($params) !== 3) {
            throw new \RuntimeException('Invalid request: missing token');
        }
        
        $challengeToken = $params[2];
        if (!hash_equals($this->token, $challengeToken)) {
            throw new \RuntimeException('Invalid token');
        }

        // Return only code and working directory, token validation is complete
        return [$params[0], $params[1]];
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function hasMore(): bool
    {
        return !\feof($this->resource);
    }
}