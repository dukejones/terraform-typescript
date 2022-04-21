#!/bin/sh
sudo apt-get update -q > /dev/null
sudo apt-get install -qy docker.io awscli
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
usermod -aG docker ubuntu
