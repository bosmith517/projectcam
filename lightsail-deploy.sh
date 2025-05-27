#!/bin/bash

# AWS Lightsail Deployment Script for ProjectCam
# This script sets up ProjectCam on AWS Lightsail with HTTPS

echo "🚀 Starting ProjectCam deployment on AWS Lightsail..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /var/www/projectcam
sudo chown -R $USER:$USER /var/www/projectcam

# Clone or copy your application files here
# git clone https://github.com/yourusername/projectcam.git /var/www/projectcam

# Navigate to project directory
cd /var/www/projectcam

# Install dependencies
npm install
cd client && npm install && npm run build
cd ../server && npm install

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'projectcam-server',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: '${JWT_SECRET}',
      MONGODB_URI: '${MONGODB_URI}',
      AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
      AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
      AWS_S3_BUCKET: '${AWS_S3_BUCKET}',
      AWS_REGION: '${AWS_REGION}'
    }
  }]
}
EOF

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/projectcam << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve static files
    location / {
        root /var/www/projectcam/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/projectcam /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start services
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start the application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Basic deployment complete!"
echo "📋 Next steps:"
echo "1. Update your domain DNS to point to this Lightsail instance"
echo "2. Run: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo "3. Set up your environment variables in ecosystem.config.js"
echo "4. Configure your S3 bucket and MongoDB connection"
echo "5. Test the application at https://your-domain.com"

echo "🔧 Useful commands:"
echo "- pm2 status (check app status)"
echo "- pm2 logs (view logs)"
echo "- pm2 restart projectcam-server (restart app)"
echo "- sudo systemctl status nginx (check nginx)"
echo "- sudo certbot renew --dry-run (test SSL renewal)"
