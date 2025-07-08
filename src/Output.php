<?php

declare(strict_types=1);

namespace QuickMix;

class Output {
    protected string $stdoutBuffer = '';
    protected ?\Throwable $lastException = null;
    protected mixed $returnValue = null;

    
    public function __construct(
        protected $resource,
    ) {
    }

    public function writeException(\Throwable $e): void
    {
        $this->lastException = $e;
    }

    public function writeStdout(string $out): void
    {
        $this->stdoutBuffer .= $out;
    }

    public function writeReturnValue(mixed $value): void
    {
        $this->returnValue = \var_export($value, true);
    }

    public function getOutputBuffer(): string
    {
        return $this->stdoutBuffer;
    }

    public function flush(int $id): void
    {
        $body = json_encode($this->payload($id));

        @fwrite($this->resource, "Content-Length: ".strlen($body)."\r\n\r\n".$body);
        fflush($this->resource);

        $this->stdoutBuffer = '';
        $this->lastException = null;
    }

    protected function payload(int $id): array
    {
        if ($this->lastException) {
            return [
                'id' => $id,
                'error' => [
                    'code' => -32000, // A reserved code that we'll use for PHP eval errors
                    'message' => $this->lastException->getMessage(),
                ]
            ];
        } else {
            return [
                'id' => $id,
                'result' => [
                    'stdout' => $this->stdoutBuffer,
                    'returnValue' => $this->returnValue,
                ]
            ];
        }
    }
}
