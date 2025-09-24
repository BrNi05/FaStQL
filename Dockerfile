FROM node:lts-bookworm-slim

WORKDIR /fastql

COPY package*.json ./

# Install Java and build tools for node-pty
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
    openjdk-17-jre-headless python3 g++ make >/dev/null \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

# Production release
RUN npm ci --omit=dev --omit=optional --silent

COPY . .

# Remove build tools
RUN apt-get purge -y python3 g++ make >/dev/null \
    && rm -rf /var/lib/apt/lists/* && apt-get autoremove -y >/dev/null && apt-get clean 

# Add executable permissions to sqlcl
RUN chmod +x /fastql/external/sqlcl/bin/sql

ENV NODE_ENV=production

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

ENV PATH="$JAVA_HOME/bin:$PATH"

CMD ["node", "src/server.js"]