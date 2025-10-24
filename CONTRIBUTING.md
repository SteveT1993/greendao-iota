# Contributing to greendao-iota

Thank you for your interest in contributing to greendao-iota!

## Setting Up Your Development Environment

### Prerequisites

Before you begin, ensure you have:
- A Unix-like operating system (Linux, macOS, or WSL on Windows)
- Git installed
- Internet connection

### Quick Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/SteveT1993/greendao-iota.git
   cd greendao-iota
   ```

2. Run the installation script:
   ```bash
   ./install.sh
   ```

3. Verify your setup:
   ```bash
   make verify
   ```

### Alternative Setup Methods

#### Using Make
```bash
# Install only Rust and Cargo
make install-rust

# Install everything
make install
```

#### Using Docker
```bash
# Build and run development container
docker-compose up -d
docker-compose exec iota-dev bash
```

#### Manual Installation

See [README.md](README.md) for detailed manual installation instructions.

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them

3. Run tests (if available):
   ```bash
   ./test-setup.sh
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. Push to your fork and create a pull request

## Testing

Before submitting a pull request, please run:

```bash
./test-setup.sh
```

This ensures:
- All scripts have valid syntax
- Makefile targets work correctly
- Documentation is complete
- Required tools are installed

## Code Style

- Follow existing code style in the repository
- Use meaningful variable and function names
- Add comments for complex logic
- Keep scripts POSIX-compliant where possible

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write clear, descriptive commit messages
- Update documentation if you change functionality
- Ensure all tests pass before submitting

## Questions?

If you have questions or need help, please:
- Open an issue on GitHub
- Check existing issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
