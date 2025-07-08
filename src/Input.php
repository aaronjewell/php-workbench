<?php

declare(strict_types=1);

namespace QuickMix;

class Input
{
    protected int $id = -1;

    public function __construct(
        protected $resource,
    ) {
    }

    public function read(): string
    {
        $this->id = -1;
        
        $headers = '';
        $body = '';

        while (($line = fgets($this->resource)) !== false && trim($line) !== '') {
            $headers .= $line;
        }

        if ($headers === '') {
            return '';
        }

        if (!preg_match('/Content-Length:\s*(\d+)/i', $headers, $matches)) {
            return '';
        }

        $len = (int)$matches[1];
        $body = '';

        while (strlen($body) < $len) {
            $body .= fread($this->resource, $len - strlen($body));
        }

        $request = json_decode($body, true);

        $this->id = $request['id'];

        return $request['params'][0];
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function hasMore(): bool
    {
        return \feof($this->resource);
    }
}