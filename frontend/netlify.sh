#!/bin/bash

# Install pnpm
npm install -g pnpm@8.6.12

# Install dependencies
pnpm install

# Build the project
pnpm build

# Ensure dist directory exists
mkdir -p dist