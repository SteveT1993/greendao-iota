.PHONY: help install install-rust install-iota verify clean

help:
	@echo "IOTA Development Environment Setup"
	@echo "=================================="
	@echo ""
	@echo "Available targets:"
	@echo "  make install       - Install Rust, Cargo, and IOTA CLI"
	@echo "  make install-rust  - Install only Rust and Cargo"
	@echo "  make install-iota  - Install only IOTA CLI (requires Rust)"
	@echo "  make verify        - Verify all installations"
	@echo "  make clean         - Clean temporary files"
	@echo ""

install:
	@echo "Running full installation..."
	@./install.sh

install-rust:
	@echo "Installing Rust and Cargo..."
	@./install-rust.sh

install-iota:
	@echo "Installing IOTA CLI..."
	@if ! command -v cargo &> /dev/null; then \
		echo "Error: Cargo not found. Please run 'make install-rust' first."; \
		exit 1; \
	fi
	@echo "Building IOTA from source..."
	@mkdir -p /tmp/iota-build
	@cd /tmp/iota-build && \
		git clone https://github.com/iotaledger/iota.git && \
		cd iota && \
		cargo build --release --bin iota && \
		if [ -f "target/release/iota" ]; then \
			echo "Installing IOTA CLI..."; \
			sudo cp target/release/iota /usr/local/bin/ 2>/dev/null || cp target/release/iota $(HOME)/.cargo/bin/; \
			echo "✓ IOTA CLI installed successfully"; \
		else \
			echo "✗ Failed to build IOTA"; \
			exit 1; \
		fi

verify:
	@echo "Verifying installations..."
	@echo "=========================="
	@echo -n "Rust: "
	@rustc --version 2>/dev/null || echo "✗ Not installed"
	@echo -n "Cargo: "
	@cargo --version 2>/dev/null || echo "✗ Not installed"
	@echo -n "IOTA CLI: "
	@iota --version 2>/dev/null || echo "✗ Not installed"
	@echo "=========================="

clean:
	@echo "Cleaning temporary files..."
	@rm -rf /tmp/iota-build
	@echo "✓ Clean complete"
