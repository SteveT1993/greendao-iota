# greendao-iota

Development environment setup for IOTA with Rust and Cargo.

## Prerequisites

- Linux or macOS operating system
- Internet connection for downloading packages
- Git (for source installations)

## Quick Start

Run the installation script to set up your development environment:

```bash
./install.sh
```

This script will:
1. Check and install Rust and Cargo (if not already installed)
2. Update Rust to the latest stable version
3. Install the IOTA CLI
4. Verify all installations

## Manual Installation

### Install Rust and Cargo

If you prefer to install manually:

```bash
# Install Rust and Cargo via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the on-screen instructions, then:
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### Install IOTA CLI

```bash
# Option 1: Install from crates.io (if available)
cargo install iota-cli

# Option 2: Build from source
git clone https://github.com/iotaledger/iota.git
cd iota
cargo build --release
sudo cp target/release/iota /usr/local/bin/
```

## Verification

After installation, verify everything is set up correctly:

```bash
# Check Rust
rustc --version

# Check Cargo
cargo --version

# Check IOTA CLI
iota --version
iota --help
```

## Troubleshooting

### Rust/Cargo not found after installation

Make sure to source the cargo environment:
```bash
source $HOME/.cargo/env
```

Or add it to your shell profile:
```bash
echo 'source $HOME/.cargo/env' >> ~/.bashrc  # or ~/.zshrc
```

### IOTA CLI installation fails

If automatic installation fails, you may need to:
1. Check the official IOTA repository for the latest installation instructions
2. Ensure you have all required system dependencies
3. Try building from source manually

## Alternative Installation Methods

### Using Make

The repository includes a Makefile for convenient installation:

```bash
# Install everything
make install

# Install only Rust and Cargo
make install-rust

# Install only IOTA CLI (requires Rust)
make install-iota

# Verify installations
make verify

# Clean temporary files
make clean
```

### Using Docker

Build and run the development environment in a container:

```bash
# Build the Docker image
docker build -t iota-dev .

# Run the container
docker run -it -v $(pwd):/workspace iota-dev

# Or use docker-compose
docker-compose up -d
docker-compose exec iota-dev bash
```

### GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/setup-environment.yml`) that automatically sets up the environment for CI/CD pipelines.

## Project Structure

```
.
├── install.sh                      # Interactive installation script
├── install-rust.sh                 # Quick Rust/Cargo installation
├── Makefile                        # Make targets for installation
├── Dockerfile                      # Docker image for dev environment
├── docker-compose.yml              # Docker Compose configuration
├── .github/
│   └── workflows/
│       └── setup-environment.yml   # GitHub Actions workflow
└── README.md                       # This file
```

## Resources

- [Rust Official Website](https://www.rust-lang.org/)
- [Cargo Documentation](https://doc.rust-lang.org/cargo/)
- [IOTA Documentation](https://wiki.iota.org/)
- [IOTA GitHub Repository](https://github.com/iotaledger/iota)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

See LICENSE file for details.