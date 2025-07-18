# Changelog

All notable changes to the "PHP Workbench" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Execution Timeout Protection** - Automatically terminate PHP execution after 2 seconds to prevent infinite loops from hanging the extension
- **Processed Code Diffs** - View the diff of the submitted original code compared to the processed code that is evaluated

### Changed

- **Duplicate Class Declaration Prevention** - Automatically wrap class declarations in exists checks so that repeated executions in the same session do not error
- **Webview Architecture** - Refactored webview from static HTML file to dynamic generation with separate CSS and JavaScript files for better maintainability
- **Build System** - Simplified build process by removing static webview.html file copying

### Technical

- Use a more limited set of psysh CodeCleaner passes, and additional new one to handle namespaces and conditional class declarations
- Enhanced test coverage for timeout handling, concurrent execution, and webview panel reuse
- Improved webview resource management with proper CSP headers and nonce-based script loading

## [0.3.1] - 2025-01-12

### Security

- **Token-based Authentication** - Added secure token validation between VSCode extension and PHP worker process
- **Request Validation** - Enhanced JSON-RPC request validation to prevent malformed requests

### Fixed

- **Execution Loop Logic** - Fixed inverted boolean logic in `shouldContinue()` and `hasMore()` methods
- **Process Cleanup** - Improved PHP worker process termination with proper signal handling
- **Test Compatibility** - Fixed webview panel detection test to work across all tab groups

### Changed

- **Error Handling** - Enhanced error handling in PHP worker process with better exception management
- **Process Management** - Improved cleanup and disposal of PHP worker processes and connections
- **Logging** - Added comprehensive logging for debugging PHP worker process lifecycle

### Technical

- Enhanced security model with cryptographically secure token generation
- Improved process lifecycle management with proper resource cleanup
- Better error propagation and handling throughout the system

## [0.3.0] - 2025-07-11

### Added

- **Webview Results Panel** - HTML panel for displaying PHP execution results in friendlier UI
- **Real-time Execution Feedback** - Visual indicators during code execution with loading states
- **Enhanced Result Display** - Separate sections for output, return values, and errors in the webview
- **Webview Resource Management** - Proper cleanup and caching of webview resources

### Changed

- **Improved Build System** - Added webview.html copying to compilation process with proper pre-compile hooks
- **Enhanced Extension Architecture** - Better resource management with proper cleanup and disposal patterns
- **Friendlier UI/UX** - Replaced basic output channel with interactive webview for better user experience
- **Output Channel Auto Reveal** - Output channel no longer reveals automatically, although it still renders results

### Technical

- Added comprehensive webview integration with VS Code's webview API
- Implemented proper resource cleanup and disposal patterns
- Enhanced test coverage for webview functionality
- Improved TypeScript documentation and code organization

## [0.2.2] - 2025-07-10

### Added

- Demo GIF to README.md showcasing extension functionality

### Changed

- Improved documentation clarity in README.md examples

### Fixed

- Removed debug logging statement from ExecutionClosure.php

## [0.2.1] - 2025-07-10

### Added

- **Composer Autoload Detection** - Automatically detects and includes Composer's vendor/autoload.php from workspace or active file directory

### Changed

- Build scripts now use clean script to remove artifacts before compilation
- Updated CONTRIBUTING.md to document all available npm scripts
- Updated the icon to be less cluttered

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
