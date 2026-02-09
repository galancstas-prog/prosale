FROM node:20-alpine

WORKDIR /app

# Install git (needed by some npm packages like Baileys)
RUN apk add --no-cache git

# Install ALL dependencies (including devDeps for TypeScript build)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create sessions directory
RUN mkdir -p /app/wa-sessions

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV WA_BRIDGE_PORT=3001
ENV WA_SESSIONS_DIR=/app/wa-sessions

# Start
CMD ["npm", "start"]
