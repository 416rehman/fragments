# Use a specific version of the Node.js base image
FROM node:18-alpine as builder

# Metadata
LABEL maintainer="Rehman Ahmadzai"
LABEL description="Fragments node.js microservice"

# Image environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Final stage, using a smaller base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy built artifacts from the previous stage
COPY --from=builder /app .

# Expose the port on which the Express app will run
EXPOSE ${PORT}

# Run the start script defined in package.json
CMD [ "npm", "start" ]