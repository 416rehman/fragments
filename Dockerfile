# Use the official Node.js 14 image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the application code to the working directory
COPY . .

# Expose the port on which the Express app will run
EXPOSE 8080

# Start the Express app
CMD ["npm", "start"]
