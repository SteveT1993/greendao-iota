#!/bin/bash

# Quick installation script for Rust and Cargo only
# Use this if you only need the Rust toolchain

set -e

echo "Installing Rust and Cargo..."

# Check if already installed
if command -v rustc &> /dev/null && command -v cargo &> /dev/null; then
    echo "✓ Rust is already installed: $(rustc --version)"
    echo "✓ Cargo is already installed: $(cargo --version)"
    echo ""
    echo "Updating to latest stable version..."
    rustup update stable 2>/dev/null || echo "Rustup not available for update"
else
    echo "Installing Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source the cargo environment
    source "$HOME/.cargo/env"
    
    echo ""
    echo "✓ Rust installed: $(rustc --version)"
    echo "✓ Cargo installed: $(cargo --version)"
fi

echo ""
echo "Installation complete!"
echo ""
echo "If this is a new installation, run:"
echo "  source \$HOME/.cargo/env"
