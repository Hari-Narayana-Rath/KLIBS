#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cab Booking App GitHub Deployment Script${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git and try again.${NC}"
    exit 1
fi

# Ask for GitHub username and repository name
read -p "Enter your GitHub username: " username
read -p "Enter repository name (default: cab-booking-app): " repo_name
repo_name=${repo_name:-cab-booking-app}

echo -e "\n${YELLOW}Initializing Git repository...${NC}"
git init

echo -e "\n${YELLOW}Adding all files (except those in .gitignore)...${NC}"
git add .

echo -e "\n${YELLOW}Creating initial commit...${NC}"
git commit -m "Initial commit: Cab Booking Application"

echo -e "\n${YELLOW}Adding GitHub remote repository...${NC}"
git remote add origin https://github.com/$username/$repo_name.git

echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
git push -u origin master

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Success! Your Cab Booking App has been pushed to GitHub at:${NC}"
    echo -e "${GREEN}https://github.com/$username/$repo_name${NC}"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Configure your environment variables on your deployment platform"
    echo "2. Set up MongoDB Atlas if deploying to production"
    echo "3. Update the README.md with your specific details"
else
    echo -e "\n${RED}There was an error pushing to GitHub. Please check the error message above.${NC}"
    echo -e "You may need to create the repository first at: https://github.com/new"
fi

echo -e "\n${YELLOW}Done!${NC}" 