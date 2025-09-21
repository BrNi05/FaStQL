FROM node:lts-bullseye

WORKDIR /fastql

COPY package*.json ./

# Install Java and build tools for node-pty
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk python3 g++ make && \
    rm -rf /var/lib/apt/lists/*

# Production release
RUN npm ci --omit=dev --omit=optional --silent

COPY . .

ENV NODE_ENV=production

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

CMD ["node", "src/server.js"]