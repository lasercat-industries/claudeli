# Library Template

A modern TypeScript library template with ESLint, Prettier, and build tooling pre-configured. Designed for seamless setup with `bun create`.

## Features

- 🚀 Interactive setup with `bun create`
- 📦 TypeScript support with strict mode
- 🎨 ESLint and Prettier pre-configured
- 🔨 Build scripts ready to go
- 🤖 GitHub Actions CI/CD workflow
- 📚 Optional NPM publishing

## Quick Start

### Using bun create (Recommended)

```bash
bun create github.com/lasercat-industries/library-template my-library
```

The interactive setup will:

- Configure your package name as `@lasercat/<your-name>`
- Set the author field
- Optionally set up npm publishing
- Clean up setup files automatically

### Manual Setup

1. Clone this template
2. Run `bun install`
3. Update `package.json` with your library details
4. Replace this README with your library documentation
5. Start developing your library

## Development

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Run linting
bun run lint

# Run formatter
bun run format

# Run tests
bun test

# Type checking
bun run typecheck
```

## Project Structure

```
src/
├── index.ts        # Main entry point
└── index.test.ts   # Example test file

dist/               # Built output (generated)
```

## GitHub Actions

The template includes a CI workflow that:

- Runs tests, linting, and type checking on every push
- Publishes to npm when the version changes (if configured)

## Publishing to npm

If you chose to enable npm publishing during setup:

1. Add `NPM_TOKEN` secret to your GitHub repository
2. Update the version in `package.json`
3. Push to the `main` branch
4. The package will be automatically published

## License

MIT
