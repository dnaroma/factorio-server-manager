FROM mcr.microsoft.com/devcontainers/base:debian

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        make \
        unzip \
        zip \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | sh \
    && mv /root/.local/bin/mise /usr/local/bin/mise

ENV MISE_DATA_DIR=/usr/local/share/mise \
    MISE_CACHE_DIR=/usr/local/share/mise/cache \
    MISE_CONFIG_DIR=/usr/local/share/mise/config \
    PATH=/usr/local/share/mise/shims:/usr/local/bin:$PATH

RUN mkdir -p /usr/local/share/mise \
    && chown -R vscode:vscode /usr/local/share/mise

USER vscode

RUN echo 'eval "$(mise activate bash)"' >> /home/vscode/.bashrc \
    && echo 'eval "$(mise activate zsh)"' >> /home/vscode/.zshrc
