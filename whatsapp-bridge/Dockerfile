FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

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
