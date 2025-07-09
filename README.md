# PHP Workbench

A dedicated workspace for PHP development and experimentation. Test PHP code snippets instantly within your project context with full access to Composer dependencies - no temporary files or terminal switching required.

Perfect for experimenting with APIs, testing functions, or trying out new packages without disrupting your workflow.

## Features

### 🚀 **Instant PHP Execution**

- Execute PHP code snippets with `Ctrl+Enter` (or `Cmd+Enter`)
- See results immediately in VS Code's output panel
- Full error handling with line numbers and stack traces
- No need for `<?php` tags - just write PHP code

### 📦 **Project Context**

- Automatically includes your project's `vendor/autoload.php`
- Full access to your Composer dependencies
- Works with any PHP project structure
- Maintains your project's environment and configuration

### 🐳 **Docker Support**

- Run code in your Docker containers
- Simple configuration for Docker Compose projects
- Seamless integration with containerized PHP environments

### 📝 **Smart Scratchpad Management**

- Create temporary PHP files that auto-save as you type
- Automatic cleanup of temporary files
- Full VS Code features: syntax highlighting, IntelliSense, debugging
- Multiple scratchpads for different experiments

## Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "PHP Workbench"
4. Click Install

## Quick Start

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "PHP Workbench: New Scratchpad"
3. A new temporary PHP file opens in your editor
4. Write your PHP code (no need for `<?php` tags)
5. Press `Ctrl+Enter` (or `Cmd+Enter`) to execute
6. Results appear instantly in the "PHP Workbench" output panel

**That's it!** Your scratchpad has full access to your project's Composer dependencies and runs in your project's context.

## Usage

### Creating Scratchpads

- **Command Palette**: `PHP Workbench: New Scratchpad`
- **Keyboard Shortcut**: `Ctrl+Alt+N` (or `Cmd+Alt+N`)

### Executing Code

- **Keyboard Shortcut**: `Ctrl+Enter` (or `Cmd+Enter`)
- **Command Palette**: `PHP Workbench: Execute Code`

### Scratchpad Management

- Scratchpads are temporary files that auto-save as you type
- Close anytime - PHP Workbench will clean up temporary files
- Use regular VS Code features: syntax highlighting, IntelliSense, etc.

## Configuration

### Zero Configuration

PHP Workbench works out of the box with sensible defaults:

- **PHP**: Uses `php` command from your PATH
- **Composer**: Automatically includes `vendor/autoload.php` if present in your workspace root
- **Output**: Results appear in the "PHP Workbench" output panel

### Docker Projects

For Docker Compose projects, add this to your VS Code settings:

```json
{
  "phpWorkbench.docker.service": "app"
}
```

Where `"app"` is your PHP service name in `docker-compose.yml`.

### Optional Settings

Most users won't need any configuration, but these settings are available:

```json
{
  "phpWorkbench.docker.service": "app"
}
```

For Docker projects, specify your PHP service name from `docker-compose.yml`.

## Keyboard Shortcuts

| Shortcut                   | Action                   |
| -------------------------- | ------------------------ |
| `Ctrl+Enter` / `Cmd+Enter` | Execute current PHP code |
| `Ctrl+Alt+N` / `Cmd+Alt+N` | New PHP scratchpad       |

## Use Cases

Perfect for:

- **Testing new packages** - Try out Composer packages before committing to them
- **API exploration** - Test API calls and responses quickly
- **Function debugging** - Isolate and test problematic functions
- **Learning PHP** - Experiment with PHP features and syntax
- **Code snippets** - Test small pieces of code within your project context

## Examples

### Testing Composer Packages

```php
use Carbon\Carbon;

$date = Carbon::now();
echo $date->format('Y-m-d H:i:s');

// Try different methods
$tomorrow = $date->addDay();
echo $tomorrow->diffForHumans();
```

### API Testing

```php
$response = file_get_contents('https://api.github.com/users/octocat');
$data = json_decode($response, true);

echo "User: " . $data['name'] . "\n";
echo "Public repos: " . $data['public_repos'];
```

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

## Requirements

- VS Code 1.101.0 or higher
- PHP installed on your system (or Docker with PHP containers)
- That's it! PHP Workbench will automatically detect your Composer dependencies

## Troubleshooting

**Code not executing:**

- Check if PHP is installed: `php --version`
- For Docker projects: Ensure containers are running

**Composer dependencies not available:**

- Run `composer install` in your project root
- Check if `vendor/autoload.php` exists (must be in workspace root)

**Docker issues:**

- Ensure containers are running: `docker-compose ps`
- Set the correct service name in settings: `"phpWorkbench.docker.service": "your-service-name"`

## Release Notes

### 0.0.1

Initial release of PHP Workbench

- Basic PHP code execution
- Composer autoload support
- Docker integration
- Scratchpad management

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

- **Documentation**: [GitHub Wiki](https://github.com/your-org/phpWorkbench/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/phpWorkbench/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/phpWorkbench/discussions)

---

**Happy PHP Coding!** 🐘

_PHP Workbench: Your dedicated workspace for PHP development and experimentation._
