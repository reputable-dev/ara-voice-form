# Use Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --production

# Copy source code
COPY . .

# Build the application (if needed)
# RUN bun run build

# Expose port
EXPOSE 3210

# Start the application
CMD ["bun", "run", "convex:dev"]