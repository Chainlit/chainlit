# instsall backend
cd backend 
pip install -e .


# install frontend
cd ..
cd frontend 
pnpm install
pnpm build

# install libs
cd ..
cd libs/copilot
pnpm install 
pnpm build


#!/bin/bash

# # Install backend
# cd backend
# pip install -e .
# if [ $? -ne 0 ]; then
#   echo "Failed to install backend dependencies"
#   exit 1
# fi

# # Install frontend and build
# cd ../frontend
# pnpm install --frozen-lockfile
# if [ $? -ne 0 ]; then
#   echo "Failed to install frontend dependencies"
#   exit 1
# fi
# pnpm build
# if [ $? -ne 0 ]; then
#   echo "Failed to build frontend"
#   exit 1
# fi

# # Install libs and build
# cd ../libs/copilot
# pnpm install --frozen-lockfile
# if [ $? -ne 0 ]; then
#   echo "Failed to install libs/copilot dependencies"
#   exit 1
# fi
# pnpm build
# if [ $? -ne 0 ]; then
#   echo "Failed to build libs/copilot"
#   exit 1
# fi
