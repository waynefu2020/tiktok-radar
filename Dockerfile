FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp --break-system-packages 2>/dev/null || pip3 install yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
