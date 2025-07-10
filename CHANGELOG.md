# Changelog

All notable changes to the "PHP Workbench" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Composer Autoload Detection** - Automatically detects and includes Composer's vendor/autoload.php from workspace or active file directory

### Changed

- Build scripts now use clean script to remove artifacts before compilation
- Updated CONTRIBUTING.md to document all available npm scripts

## [0.1.1] - 2025-07-09

### Fixed

- Corrected license file reference in package.json to point to LICENSE.txt

## [0.1.0] - 2025-07-09

### Added

- **PHP Scratchpad Creation** - Create temporary PHP files with syntax highlighting via command palette or `Ctrl+Alt+N` / `Cmd+Alt+N`
- **Instant PHP Execution** - Execute PHP code snippets with `Ctrl+Enter` / `Cmd+Enter` for immediate feedback
- **Session Management** - Restart PHP sessions to clear variables and state via "PHP Workbench: Restart Session" command
- **Error Handling** - Clear error messages displayed in dedicated output panel
- **Issue Reporting** - Built-in issue reporter integration with VS Code's native issue reporting system
- **Output Panel** - Dedicated "PHP Workbench" output channel for execution results and errors
- **Smart Entrypoint Detection** - Automatically uses bundled .phar for production or individual PHP files for development
- **Build System** - PHP .phar bundling system for self-contained distribution

### Technical

- PsySH helpers for advanced PHP execution context and code cleaning
- JSON-RPC communication between VS Code and PHP worker process
- Automatic PHP worker process management with transparent restart on crashes
- TypeScript-based VS Code extension with comprehensive test suite
