# ──────────────────────────────────────────────
# Runtime
# Image: ghcr.io/hx-build/hx-pi
# Used by: end users via docker run
# ──────────────────────────────────────────────
FROM node:24-slim AS runtime

# Git is required for HX's git operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install HX globally — version is controlled by the build arg
ARG GSD_VERSION=latest
RUN npm install -g hx-pi@${GSD_VERSION}

# Default working directory for user projects
WORKDIR /workspace

ENTRYPOINT ["hx"]
CMD ["--help"]
