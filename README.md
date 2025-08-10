# PHP Workbench

A dedicated workspace for PHP development and experimentation. Test PHP code snippets instantly with full access to your project's Composer dependencies, custom classes, and framework components - no temporary files or terminal switching required.

Modern PHP development relies heavily on Composer packages. PHP Workbench automatically detects and includes your project's `vendor/autoload.php`, giving you instant access to test package integrations, debug business logic, and experiment with your actual project dependencies without disrupting your workflow.

## Demo

![PHP Workbench Demo](res/demo.png)

## Features

### 🚀 **Instant PHP Execution**

- Execute PHP code snippets with `Ctrl+Enter` (or `Cmd+Enter`)
- See results in the PHP Workbench Results view
- Automatic Composer integration - uses your project's `vendor/autoload.php` automatically
- Full error handling with line numbers and stack traces
- No need for `<?php` tags - just write PHP code
- Open a native VS Code diff (original → processed) with one click

### 📝 **Smart Scratchpad Management**

- Full VS Code features: syntax highlighting, IntelliSense, debugging
- Multiple scratchpads for different experiments, all with shared context
- No temp files or context switching—stay in flow inside VS Code

## Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "PHP Workbench"
4. Click Install

## Quick Start

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "PHP Workbench: New Scratchpad"
3. A new untitled PHP file opens in your editor
4. Write your PHP code (no need for `<?php` tags, but they may help your other tools)
5. Press `Ctrl+Enter` (or `Cmd+Enter`) to execute
6. Results appear in the "PHP Workbench" Results view

**That's it!**

## Usage

### Creating Scratchpads

- **Command Palette**: `PHP Workbench: New Scratchpad`
- **Keyboard Shortcut**: `Ctrl+Alt+N` (or `Cmd+Alt+N`)

### Executing Code

- **Keyboard Shortcut**: `Ctrl+Enter` (or `Cmd+Enter`)
- **Command Palette**: `PHP Workbench: Execute Code`

### Scratchpad Management

- Scratchpads are simply PHP language text files
- Close anytime - PHP Workbench will clean up after itself
- Use regular VS Code features: syntax highlighting, IntelliSense, etc.

## Configuration

### Zero Configuration

PHP Workbench works out of the box with sensible defaults:

- **PHP**: Uses `php` command from your PATH
- **Composer**: Automatically detects and includes vendor/autoload.php from your workspace
- **Results**: Results appear in a dedicated "PHP Workbench" Results view

### Settings

Tune behavior from Settings → Extensions → PHP Workbench:

- `phpWorkbench.debug` (boolean, default: false)
  - Flip on diagnostic logs when needed. See runner logs in the Output channel.
- `phpWorkbench.logFile` (string, default: empty)
  - Prefer files? Send runner logs to a path you control. Empty = STDERR.
- `phpWorkbench.timeout` (number, default: 30)
  - Guard rails for runaway code. 30s by default; set to `0` for no limit.

## Keyboard Shortcuts

| Shortcut                   | Action                   |
| -------------------------- | ------------------------ |
| `Ctrl+Enter` / `Cmd+Enter` | Execute current PHP code |
| `Ctrl+Alt+N` / `Cmd+Alt+N` | New PHP scratchpad       |

## Use Cases

Perfect for:

- **Package integration testing** - Test how third-party packages work with your data before committing to implementation
- **API exploration** - Test API calls with real HTTP clients and logging
- **Business logic debugging** - Isolate complex logic with actual project dependencies
- **Database query testing** - Test ORM queries and relationships without running full application
- **Configuration validation** - Test environment-specific configurations and service integrations
- **Learning new packages** - Experiment with package APIs in your project context

## Examples

### Quick Function Testing

```php
function calculateTotal($items) {
    return array_sum(array_column($items, 'price'));
}

$items = [
    ['name' => 'Item 1', 'price' => 10.50],
    ['name' => 'Item 2', 'price' => 25.00],
];

echo "Total: $" . calculateTotal($items);
```

### API Testing

```php
$url = "https://api.github.com/users/octocat";

$opts = [
    'http' => [
            'method' => 'GET',
            'header' => [
                    'User-Agent: PHP Workbench',
                    'Content-type: application/x-www-form-urlencoded'
            ]
    ]
];

$context = stream_context_create($opts);
$response = file_get_contents($url, false, $context);
$body = json_decode($response, true);

return $body['name'];
```

### Testing Package Integrations

Same API call as above, but using your project's Composer dependencies for better logging and HTTP handling:

```php
// Works with ANY Composer project - automatically includes vendor/autoload.php
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use GuzzleHttp\Client;

// Test logging behavior by routing the stream to php's output
$logger = new Logger('test');
$logger->pushHandler(new StreamHandler('php://output', Logger::DEBUG));

// Test HTTP client with your actual configs
$client = new Client();
$response = $client->get('https://api.github.com/users/octocat');

$logger->info('API Response', [
    'status' => $response->getStatusCode(),
    'user' => json_decode($response->getBody(), true)['name']
]);
```

## Requirements

- VS Code 1.99.3 (earlier versions will likely work, but not tested)
- PHP installed on your system
- That's it!

## Troubleshooting

**Code not executing:**

- Check if PHP is installed: `php --version`

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This extension is licensed under the [MIT License](LICENSE).

## Support

- **Documentation**: [GitHub Wiki](https://github.com/aaronjewell/php-workbench/wiki)
- **Issues**: [GitHub Issues](https://github.com/aaronjewell/php-workbench/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aaronjewell/php-workbench/discussions)

---

**Happy PHP Coding!** 🐘

_PHP Workbench: Your dedicated workspace for PHP development and experimentation._
