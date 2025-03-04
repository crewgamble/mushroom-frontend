#!/bin/bash

# Update system
sudo dnf update -y

# Install nginx
sudo dnf install nginx -y

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create directory for the app
sudo mkdir -p /usr/share/nginx/html

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
sudo cp -r dist/* /usr/share/nginx/html/

# Set permissions
sudo chown -R nginx:nginx /usr/share/nginx/html
sudo chmod -R 755 /usr/share/nginx/html

# Restart nginx
sudo systemctl restart nginx

# Configure security group (this needs to be done in AWS Console)
echo "Please ensure your EC2 security group allows inbound traffic on port 80 (HTTP)" 