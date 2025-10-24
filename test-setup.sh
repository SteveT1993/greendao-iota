#!/bin/bash

# Test script to verify installation scripts and configurations
# This script tests that all installation methods are working correctly

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo "======================================"
echo "Testing IOTA Setup Scripts"
echo "======================================"
echo ""

# Test 1: Check if scripts exist and are executable
echo "Test 1: Checking script files..."
if [ -x "install.sh" ]; then
    print_success "install.sh exists and is executable"
else
    print_error "install.sh is missing or not executable"
    exit 1
fi

if [ -x "install-rust.sh" ]; then
    print_success "install-rust.sh exists and is executable"
else
    print_error "install-rust.sh is missing or not executable"
    exit 1
fi

# Test 2: Check script syntax
echo ""
echo "Test 2: Validating script syntax..."
if bash -n install.sh; then
    print_success "install.sh syntax is valid"
else
    print_error "install.sh has syntax errors"
    exit 1
fi

if bash -n install-rust.sh; then
    print_success "install-rust.sh syntax is valid"
else
    print_error "install-rust.sh has syntax errors"
    exit 1
fi

# Test 3: Check Makefile
echo ""
echo "Test 3: Validating Makefile..."
if [ -f "Makefile" ]; then
    print_success "Makefile exists"
    
    # Check if make targets work
    if make help > /dev/null 2>&1; then
        print_success "Makefile help target works"
    else
        print_error "Makefile help target failed"
        exit 1
    fi
else
    print_error "Makefile is missing"
    exit 1
fi

# Test 4: Check Docker files
echo ""
echo "Test 4: Checking Docker configuration..."
if [ -f "Dockerfile" ]; then
    print_success "Dockerfile exists"
else
    print_error "Dockerfile is missing"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    print_success "docker-compose.yml exists"
else
    print_error "docker-compose.yml is missing"
    exit 1
fi

# Test 5: Check GitHub Actions workflow
echo ""
echo "Test 5: Checking GitHub Actions workflow..."
if [ -f ".github/workflows/setup-environment.yml" ]; then
    print_success "GitHub Actions workflow exists"
else
    print_error "GitHub Actions workflow is missing"
    exit 1
fi

# Test 6: Verify Rust and Cargo are available
echo ""
echo "Test 6: Verifying Rust toolchain..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust is installed: ${RUST_VERSION}"
else
    print_error "Rust is not installed"
    exit 1
fi

if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    print_success "Cargo is installed: ${CARGO_VERSION}"
else
    print_error "Cargo is not installed"
    exit 1
fi

# Test 7: Test make verify target
echo ""
echo "Test 7: Testing make verify..."
if make verify; then
    print_success "make verify completed"
else
    print_error "make verify failed"
    exit 1
fi

# Test 8: Check README documentation
echo ""
echo "Test 8: Validating README documentation..."
if [ -f "README.md" ]; then
    # Check if README contains key sections
    if grep -q "Quick Start" README.md && \
       grep -q "Manual Installation" README.md && \
       grep -q "Alternative Installation Methods" README.md; then
        print_success "README has all required sections"
    else
        print_error "README is missing required sections"
        exit 1
    fi
else
    print_error "README.md is missing"
    exit 1
fi

echo ""
echo "======================================"
print_success "All tests passed!"
echo "======================================"
echo ""
echo "Summary:"
echo "  ✓ Scripts are valid and executable"
echo "  ✓ Makefile works correctly"
echo "  ✓ Docker configuration is present"
echo "  ✓ GitHub Actions workflow is configured"
echo "  ✓ Rust and Cargo are installed"
echo "  ✓ Documentation is complete"
echo ""
