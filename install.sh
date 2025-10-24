#!/bin/bash

# Installation script for IOTA CLI, Cargo, and Rust
# This script sets up the development environment for working with IOTA

set -e

echo "=================================="
echo "IOTA Development Environment Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running on Linux or macOS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_info "Detected OS: ${MACHINE}"

# 1. Install Rust and Cargo
echo ""
echo "Step 1: Checking Rust and Cargo installation..."
if command -v rustc &> /dev/null && command -v cargo &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    CARGO_VERSION=$(cargo --version)
    print_success "Rust is already installed: ${RUST_VERSION}"
    print_success "Cargo is already installed: ${CARGO_VERSION}"
else
    print_info "Installing Rust and Cargo via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source the cargo environment
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi
    
    if command -v rustc &> /dev/null && command -v cargo &> /dev/null; then
        print_success "Rust and Cargo installed successfully!"
        rustc --version
        cargo --version
    else
        print_error "Failed to install Rust and Cargo"
        exit 1
    fi
fi

# Update Rust to the latest stable version
echo ""
echo "Step 2: Updating Rust to latest stable version..."
if command -v rustup &> /dev/null; then
    rustup update stable
    print_success "Rust updated successfully"
else
    print_info "Rustup not found, skipping update"
fi

# 3. Install IOTA CLI
echo ""
echo "Step 3: Installing IOTA CLI..."

# Check if IOTA CLI is already installed
if command -v iota &> /dev/null; then
    print_success "IOTA CLI is already installed: $(iota --version 2>/dev/null || echo 'version unknown')"
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping IOTA CLI installation"
    fi
else
    print_info "IOTA CLI installation options:"
    echo ""
    echo "  The IOTA CLI can be installed in several ways:"
    echo "  1. From a pre-built binary release"
    echo "  2. Built from source (requires significant time and resources)"
    echo ""
    
    read -p "Would you like to attempt automatic installation from source? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Attempting to install from IOTA repository..."
        print_info "NOTE: This may take 30+ minutes and requires several GB of disk space"
        
        TEMP_DIR=$(mktemp -d)
        CURRENT_DIR=$(pwd)
        cd "$TEMP_DIR"
        
        # Try cloning the IOTA repository
        if git clone https://github.com/iotaledger/iota.git; then
            cd iota
            print_info "Building IOTA from source (this will take a while)..."
            
            if cargo build --release --bin iota; then
                # Install the binary
                if [ -f "target/release/iota" ]; then
                    if sudo cp target/release/iota /usr/local/bin/ 2>/dev/null; then
                        print_success "IOTA CLI installed to /usr/local/bin/iota"
                    elif cp target/release/iota "$HOME/.cargo/bin/" 2>/dev/null; then
                        print_success "IOTA CLI installed to $HOME/.cargo/bin/iota"
                    else
                        print_error "Failed to install IOTA binary"
                        print_info "Binary location: $TEMP_DIR/iota/target/release/iota"
                    fi
                else
                    print_error "Build succeeded but binary not found"
                fi
            else
                print_error "Failed to build IOTA from source"
            fi
        else
            print_error "Could not clone IOTA repository"
        fi
        
        cd "$CURRENT_DIR"
        
        read -p "Clean up build directory? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            rm -rf "$TEMP_DIR"
            print_success "Build directory cleaned"
        else
            print_info "Build directory preserved at: $TEMP_DIR"
        fi
    else
        print_info "Skipping automatic installation"
        echo ""
        echo "  To install IOTA CLI manually:"
        echo "  1. Visit: https://github.com/iotaledger/iota/releases"
        echo "  2. Download the latest release for your platform"
        echo "  3. Extract and place the binary in your PATH"
        echo ""
        echo "  Or build from source:"
        echo "  git clone https://github.com/iotaledger/iota.git"
        echo "  cd iota"
        echo "  cargo build --release --bin iota"
        echo "  sudo cp target/release/iota /usr/local/bin/"
        echo ""
    fi
fi

# 4. Verify installations
echo ""
echo "Step 4: Verifying installations..."
echo "-----------------------------------"

if command -v rustc &> /dev/null; then
    print_success "Rust: $(rustc --version)"
else
    print_error "Rust not found"
fi

if command -v cargo &> /dev/null; then
    print_success "Cargo: $(cargo --version)"
else
    print_error "Cargo not found"
fi

if command -v rustup &> /dev/null; then
    print_success "Rustup: $(rustup --version)"
else
    print_info "Rustup not found (optional)"
fi

if command -v iota &> /dev/null; then
    print_success "IOTA CLI: $(iota --version 2>/dev/null || echo 'installed')"
else
    print_error "IOTA CLI not found"
fi

echo ""
echo "=================================="
print_success "Installation complete!"
echo "=================================="
echo ""
echo "To get started:"
echo "  1. Restart your shell or run: source \$HOME/.cargo/env"
echo "  2. Verify installation: cargo --version && rustc --version"
echo "  3. Check IOTA CLI: iota --help"
echo ""
