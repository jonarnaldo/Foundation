FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Firewall dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    iptables \
    ipset \
    dnsutils \
    jq \
    aggregate \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Firewall script lives in the workspace (bind-mounted at runtime), not baked
# into the image, so edits take effect on the next container start without a
# rebuild. Grant scoped sudo for running it via bash from that fixed path.
RUN echo "vscode ALL=(root) NOPASSWD:SETENV: /usr/bin/bash /workspaces/Foundation/.devcontainer/init-firewall.sh" > /etc/sudoers.d/vscode-firewall \
    && chmod 0440 /etc/sudoers.d/vscode-firewall

USER vscode