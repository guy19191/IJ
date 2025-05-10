#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certificates/localhost.key \
  -out certificates/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Certificates generated successfully!"
echo "Key: certificates/localhost.key"
echo "Certificate: certificates/localhost.crt" 