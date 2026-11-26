# syntax=docker/dockerfile:1

# Stage 1: Build frontend
FROM node:24-alpine AS frontend

RUN npm install -g bun@1.4.4

WORKDIR /build/frontend-panel
COPY frontend-panel/package.json frontend-panel/bun.lock ./
COPY frontend-panel/vendor/ vendor/
COPY frontend-panel/scripts/ scripts/
RUN bun install --frozen-lockfile

COPY frontend-panel/ ./
RUN bun run build

# Stage 2: Build Rust binary
FROM rust:1-alpine AS builder

RUN apk add --no-cache build-base pkgconfig sqlite-dev curl

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY migration/ migration/
COPY api-docs-macros/ api-docs-macros/
COPY crates/ crates/

ARG CARGO_FEATURES="server"
ENV CARGO_BUILD_JOBS=2 \
    CARGO_NET_RETRY=5 \
    CARGO_HTTP_TIMEOUT=120 \
    CARGO_PROFILE_RELEASE_LTO=false \
    CARGO_PROFILE_RELEASE_CODEGEN_UNITS=8 \
    RUSTFLAGS="-C link-arg=-s"

# Pre-build dependencies as a cache layer.
RUN --mount=type=cache,id=aster-cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=aster-cargo-git,target=/usr/local/cargo/git \
    --mount=type=cache,id=aster-cargo-target,target=/build/target \
    mkdir src && echo 'fn main() {}' > src/main.rs && \
    cargo build --release --locked 2>/dev/null || true && \
    rm -rf src

COPY src/ src/
COPY build.rs ./
COPY --from=frontend /build/frontend-panel/dist/ frontend-panel/dist/

RUN --mount=type=cache,id=aster-cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=aster-cargo-git,target=/usr/local/cargo/git \
    --mount=type=cache,id=aster-cargo-target,target=/build/target \
    # COPY can retain mtimes older than a shared Cargo target cache. Refresh
    # workspace inputs so a changed source or embedded frontend is rebuilt.
    find src migration api-docs-macros crates -type f -name '*.rs' -exec touch {} + && \
    touch build.rs Cargo.toml && \
    cargo build --release --locked --features "${CARGO_FEATURES}" && \
    cp target/release/aster_yggdrasil /build/aster_yggdrasil

# Stage 3: Alpine runtime
FROM alpine:3.24

RUN apk upgrade --no-cache && apk add --no-cache ca-certificates wget && \
    addgroup -S -g 10001 aster && \
    adduser -S -D -H -u 10001 -G aster -s /sbin/nologin aster && \
    mkdir -p /data && \
    chown -R aster:aster /data

LABEL org.opencontainers.image.title="KRWA MC Portal"
LABEL org.opencontainers.image.description="Self-hosted Minecraft skin site and Yggdrasil authentication server."
LABEL org.opencontainers.image.source="https://github.com/streletskiy/krwa-mc-portal"
LABEL org.opencontainers.image.licenses="MIT"

COPY --from=builder /build/aster_yggdrasil /usr/local/bin/aster_yggdrasil

VOLUME ["/data"]
EXPOSE 3000

WORKDIR /
ENV ASTER__SERVER__HOST=0.0.0.0
ENV ASTER__DATABASE__URL=sqlite:///data/asteryggdrasil.db?mode=rwc

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:3000/health/ready"]

USER aster:aster

ENTRYPOINT ["/usr/local/bin/aster_yggdrasil"]
