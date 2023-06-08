# Use the official Node.js image as the base image
FROM node:18

# metadata
LABEL maintainer="Rehman Ahmadzai"
LABEL description="Fragments node.js microservice"

# image environment variables
# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Expose the port on which the Express app will run
EXPOSE ${PORT}
