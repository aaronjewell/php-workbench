# Cursor Rule Best Practices and Examples

Based on the [official Cursor Rules documentation](https://docs.cursor.com/context/rules).

## How Rules Work

Large language models don't retain memory between completions. Rules provide persistent, reusable context at the prompt level. When applied, rule contents are included at the start of the model context, giving the AI consistent guidance for generating code, interpreting edits, or helping with workflows.

Rules apply to Chat and Inline Edit. Active rules show in the Agent sidebar.

## Rule Types

Rules are written in **MDC** (`.mdc`) format with frontmatter metadata that controls how they're applied:

| Rule Type       | Frontmatter | Description                                                                      |
| --------------- | ----------- | -------------------------------------------------------------------------------- |
| Always          | `alwaysApply: true` | Always included in model context                                     |
| Auto Attached   | `globs: "*.ts,*.tsx"` | Included when files matching a glob pattern are referenced       |
| Agent Requested | `description: "..."` | Available to AI, which decides whether to include it. Must provide a description |
| Manual          | No special properties | Only included when explicitly mentioned using @ruleName                          |

### Rule Anatomy Example

```md
---
description: RPC Service boilerplate
globs: "src/**/*.ts"
alwaysApply: false
---

- Use our internal RPC pattern when defining services
- Always use snake_case for service names.

@service-template.ts
```

## File References

Rules can reference other files using `@filename.ts` syntax. Referenced files are included as additional context when the rule triggers.

```md
---
description: React component template
---

React components should follow this layout:
- Props interface at top
- Component as named export
- Styles at bottom

@component-template.tsx
```

## Nested Rules

Organize rules by placing them in `.cursor/rules` directories throughout your project. Nested rules automatically attach when files in their directory are referenced.

```
project/
  .cursor/rules/        # Project-wide rules
  backend/
    server/
      .cursor/rules/    # Backend-specific rules
  frontend/
    .cursor/rules/      # Frontend-specific rules
```

## Best Practices

Good rules are focused, actionable, and scoped.

- Keep rules under 500 lines
- Split large rules into multiple, composable rules
- Provide concrete examples or referenced files
- Avoid vague guidance. Write rules like clear internal docs
- Reuse rules when repeating prompts in chat

## Examples

### Standards for Frontend Components and API Validation

**Frontend Components Rule:**
```md
---
globs: "src/components/**/*.tsx"
description: "Frontend component standards"
---

When working in components directory:
- Always use Tailwind for styling
- Use Framer Motion for animations
- Follow component naming conventions
```

**API Validation Rule:**
```md
---
globs: "src/api/**/*.ts"
description: "API endpoint validation standards"
---

In API directory:
- Use zod for all validation
- Define return types with zod schemas
- Export types generated from schemas
```

### Templates for Express Services and React Components

**Express Service Template:**
```md
---
description: "Express service template"
---

Use this template when creating Express service:
- Follow RESTful principles
- Include error handling middleware
- Set up proper logging

@express-service-template.ts
```

**React Component Template:**
```md
---
description: "React component structure"
---

React components should follow this layout:
- Props interface at top
- Component as named export
- Styles at bottom

@component-template.tsx
```

### Automating Development Workflows and Documentation Generation

**App Analysis Automation:**
```md
---
description: "Automated app analysis workflow"
---

When asked to analyze the app:
1. Run dev server with `npm run dev`
2. Fetch logs from console
3. Suggest performance improvements
```

**Documentation Generation:**
```md
---
description: "Documentation generation helper"
---

Help draft documentation by:
- Extracting code comments
- Analyzing README.md
- Generating markdown documentation
```

### Using Tailwind in Cursor

```md
---
globs: "src/**/*.tsx,src/**/*.ts"
description: "Tailwind usage standards"
---

Tailwind is supported in this VS Code fork!

Usage examples:
- `text-error-foreground`
- `bg-input-border`
```

### Adding a New Setting in Cursor

```md
---
description: "Cursor settings implementation guide"
---

First create a property to toggle in `@reactiveStorageTypes.ts`.

Add default value in `INIT_APPLICATION_USER_PERSISTENT_STORAGE` in `@reactiveStorageService.tsx`.

For beta features, add toggle in `@settingsBetaTab.tsx`, otherwise add in `@settingsGeneralTab.tsx`. Toggles can be added as `<SettingsSubSection>` for general checkboxes. Look at the rest of the file for examples.

```tsx
<SettingsSubSection
	label="Your feature name"
	description="Your feature description"
	value={
		vsContext.reactiveStorageService.applicationUserPersistentStorage
			.myNewProperty ?? false
	}
	onChange={(newVal) => {
		vsContext.reactiveStorageService.setApplicationUserPersistentStorage(
			'myNewProperty',
			newVal
		);
	}}
/>
```

To use in the app, import reactiveStorageService and use the property:

```js
const flagIsEnabled = vsContext.reactiveStorageService.applicationUserPersistentStorage.myNewProperty
```
```

## FAQ

### Why isn't my rule being applied?

Check the rule type. For `Agent Requested`, ensure a description is defined. For `Auto Attached`, ensure the file pattern matches referenced files.

### Can rules reference other rules or files?

Yes. Use `@filename.ts` to include files in your rule's context.

### Can I create a rule from chat?

Yes, generate project rules from chat using the `/Generate Cursor Rules` command. If Memories are enabled, memories are generated automatically.

### Do rules impact Cursor Tab or other AI features?

No. Rules only apply to Agent and Inline Edit.

## User Rules vs Project Rules

- **Project Rules**: Stored in `.cursor/rules`, version-controlled and scoped to your codebase
- **User Rules**: Global preferences defined in **Cursor Settings → Rules** that apply across all projects. Plain text format perfect for communication style or coding conventions:

```
Please reply in a concise style. Avoid unnecessary repetition or filler language.
```