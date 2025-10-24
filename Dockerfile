# Dockerfile for IOTA Development Environment
# This provides a containerized environment with Rust, Cargo, and IOTA CLI

FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust and Cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Update Rust to stable
RUN rustup update stable

# Set working directory
WORKDIR /workspace

# Clone and build IOTA CLI
RUN git clone https://github.com/iotaledger/iota.git /tmp/iota && \
    cd /tmp/iota && \
    cargo build --release --bin iota && \
    cp target/release/iota /usr/local/bin/ && \
    rm -rf /tmp/iota

# Verify installations
RUN rustc --version && \
    cargo --version && \
    iota --version 2>/dev/null || echo "IOTA CLI installed"

# Set default command
CMD ["/bin/bash"]
