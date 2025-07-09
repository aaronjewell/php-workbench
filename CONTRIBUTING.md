# Contributing to PHP Workbench

Thank you for your interest in contributing to PHP Workbench! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Documentation](#documentation)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment. Please be respectful in all interactions.

## Getting Started

### Prerequisites

- **Node.js** (v24 or higher)
- **npm** (v11 or higher)
- **PHP** (v8.0 or higher)
- **Composer** (latest version)
- **Visual Studio Code** (latest version)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/aaronjewell/php-workbench.git
   cd php-workbench
   ```
3. Install dependencies:
   ```bash
   npm install
   composer install
   ```
4. Open in VS Code:
   ```bash
   code .
   ```
5. Press `F5` to run the extension in a new Extension Development Host window

## Reporting Bugs

### Before Submitting a Bug Report

- Check the [existing issues](https://github.com/aaronjewell/php-workbench/issues) to avoid duplicates
- Test with the latest version
- Ensure the bug is reproducible
- Check if it's related to your PHP setup (not in PATH)

### Bug Report Template

When reporting bugs, please include:

**Environment:**
- VS Code version
- PHP Workbench version
- PHP version (`php --version`)
- Operating system

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
Describe what you expected to happen.

**Actual Behavior:**
Describe what actually happened.

**Code Sample:**
```php
// Minimal code that reproduces the issue
```

**Additional Context:**
- Screenshots or recordings if applicable
- Error messages from the Output panel

## Suggesting Features

### Before Submitting a Feature Request

- Check [existing issues](https://github.com/aaronjewell/php-workbench/issues) and [USER_STORIES.md](USER_STORIES.md)
- Consider if the feature fits the extension's scope
- Think about how it would benefit other users

### Feature Request Template

**Problem Statement:**
Describe the problem you're trying to solve.

**Proposed Solution:**
Describe your proposed solution in detail.

**Alternatives Considered:**
List any alternative solutions you've considered.

**Use Cases:**
Provide specific examples of how this feature would be used.

**Additional Context:**
Any other relevant information, mockups, or examples.

## Submitting Pull Requests

### Development Workflow

We follow an **incremental delivery** approach:

1. **Small Steps**: Break work into small, deliverable increments
2. **Test-Driven**: Write tests before implementing features
3. **Conventional Commits**: Use standardized commit messages
4. **Quality Gates**: All changes must pass tests and linting

### Pull Request Process

1. **Create an Issue**: For non-trivial changes, create an issue first
2. **Fork and Branch**: Create a feature branch from `main`
3. **Implement Changes**: Follow our development guidelines
4. **Test**: Ensure all tests pass (`npm test`)
5. **Commit**: Use conventional commit messages
6. **Push**: Push your branch to your fork
7. **Create PR**: Submit a pull request with detailed description

### Pull Request Template

**Description:**
Brief summary of changes made.

**Related Issue:**
Fixes #(issue number)

**Type of Change:**
- [ ] Bug fix
- [ ] New feature  
- [ ] Breaking change
- [ ] Documentation update

**Testing:**
- [ ] Tests pass
- [ ] Manual testing completed

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)

## Documentation

### Types of Documentation

- **Code Comments**: Document complex logic and public APIs
- **README**: User-facing documentation
- **USER_STORIES**: Feature requirements and acceptance criteria
- **CONTRIBUTING**: This file
- **CHANGELOG**: Release notes and version history

### Documentation Guidelines

- **Focus on Why**: Explain the reasoning behind decisions
- **Keep Current**: Update docs when code changes
- **Be Concise**: Clear and to the point
- **Include Examples**: Show practical usage
- **Test Documentation**: Ensure examples work

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos and grammar
- Add missing examples
- Clarify confusing sections
- Update outdated information
- Add new sections as needed

## Development Guidelines

### Code Style

- **TypeScript**: Use strict type checking
- **PHP**: Follow PSR-12 coding standards
- **Linting**: Code must pass ESLint checks
- **Formatting**: Use consistent formatting

### Architecture Principles

- **Separation of Concerns**: Keep VS Code API separate from business logic
- **Testability**: All business logic should be unit testable
- **Minimal Dependencies**: Only add necessary dependencies
- **Error Handling**: Graceful degradation when dependencies unavailable

### File Organization

```
src/
├── extension.ts           # Main entry point
└── extension.test.ts      # Test file for entrypoint
worker.php              # JSON-RPC server worker script
```

## Testing

### Running Tests

```bash
# Run all tests
npm test
```

## Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```
feat(commands): add createScratchpad command with basic functionality
fix(services): handle PHP execution timeout properly
docs(readme): update installation instructions
test(services): add unit tests for CodeExecutor class
```

## Release Process

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md` with new features and fixes
3. **Tag**: Create git tag with version number
4. **Publish**: Publish to VS Code Marketplace
5. **GitHub Release**: Create release with notes

## Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for feedback on pull requests

## Recognition

Contributors will be recognized in the README and release notes. Thank you for helping make PHP Workbench better! 