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

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload 