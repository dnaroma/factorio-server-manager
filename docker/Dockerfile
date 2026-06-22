# Glibc is required for Factorio Server binaries to run
FROM ubuntu

ENV MANAGER_VERSION=0.10.1 \
    RCON_PASS="" \
    FSM_ADMIN_USERNAME=admin

VOLUME /opt/fsm-data /opt/factorio

EXPOSE 80/tcp 34197/udp

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tar xz-utils unzip jq \
        >/tmp/apt-install.log 2>&1 \
        || { cat /tmp/apt-install.log; exit 1; } \
    && { grep -v "update-alternatives: warning: skip creation" /tmp/apt-install.log || true; } \
    && rm -f /tmp/apt-install.log \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# Install FSM
RUN curl --location "https://github.com/dnaroma/factorio-server-manager/releases/download/$MANAGER_VERSION/factorio-server-manager-linux-$MANAGER_VERSION.zip" \
         --output /tmp/factorio-server-manager-linux_${MANAGER_VERSION}.zip \
    && unzip /tmp/factorio-server-manager-linux_${MANAGER_VERSION}.zip \
    && rm /tmp/factorio-server-manager-linux_${MANAGER_VERSION}.zip \
    && mv factorio-server-manager fsm \
    && mkdir -p /opt/fsm/app \
    && if [ -f /opt/fsm/index.html ]; then mv /opt/fsm/index.html /opt/fsm/bundle.js /opt/fsm/style.css /opt/fsm/app/; fi

COPY ./entrypoint.sh /opt/entrypoint.sh

ENTRYPOINT ["/opt/entrypoint.sh"]
