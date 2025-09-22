#!/bin/bash

# Version 1.0

# Avatar Chat UI - Installation Script
# Automatische Installation für Ubuntu/Debian und andere Linux-Distributionen

set -e  # Exit on any error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                    Avatar Chat UI                 ║"
echo "║                  Installation Script              ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# System detection
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            echo -e "${GREEN}✓ Debian/Ubuntu System detected${NC}"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            echo -e "${GREEN}✓ RedHat/CentOS/Fedora System detected${NC}"
        elif [ -f /etc/arch-release ]; then
            OS="arch"
            echo -e "${GREEN}✓ Arch Linux System detected${NC}"
        else
            OS="unknown"
            echo -e "${YELLOW}⚠ Unknown Linux distribution${NC}"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        echo -e "${GREEN}✓ macOS System detected${NC}"
    else
        OS="unknown"
        echo -e "${YELLOW}⚠ Unknown operating system: $OSTYPE${NC}"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${RED}❌ This script should not be run as root!${NC}"
        echo -e "${YELLOW}Please run as a normal user. sudo will be used when needed.${NC}"
        exit 1
    fi
}

# Check for required tools
check_requirements() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    local missing_tools=()
    
    # Check for curl or wget
    if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
        missing_tools+=("curl or wget")
    fi
    
    # Check for git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Installing missing tools...${NC}"
        install_system_deps
    else
        echo -e "${GREEN}✓ All required tools are available${NC}"
    fi
}

# Install system dependencies
install_system_deps() {
    echo -e "${BLUE}📦 Installing system dependencies...${NC}"
    
    case $OS in
        "debian")
            sudo apt update
            sudo apt install -y curl wget git build-essential python3 ffmpeg
            ;;
        "redhat")
            if command -v dnf &> /dev/null; then
                sudo dnf install -y curl wget git gcc-c++ make python3 ffmpeg
            else
                sudo yum install -y curl wget git gcc-c++ make python3 ffmpeg
            fi
            ;;
        "arch")
            sudo pacman -S --noconfirm curl wget git base-devel python ffmpeg
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install curl wget git ffmpeg
            else
                echo -e "${YELLOW}⚠ Homebrew not found. Please install required tools manually:${NC}"
                echo "  - curl, wget, git, ffmpeg"
            fi
            ;;
        *)
            echo -e "${YELLOW}⚠ Unknown OS. Please install these tools manually:${NC}"
            echo "  - curl or wget, git, build tools, python3, ffmpeg"
            read -p "Press Enter to continue or Ctrl+C to abort..."
            ;;
    esac
}

# Install Node.js
install_nodejs() {
    echo -e "${BLUE}🟢 Installing Node.js...${NC}"
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        
        if [ "$major_version" -ge 18 ]; then
            echo -e "${GREEN}✓ Node.js v$node_version is already installed${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Node.js v$node_version is too old (need v18+)${NC}"
        fi
    fi
    
    # Install Node.js using NodeSource repository
    echo -e "${YELLOW}Installing Node.js v20 LTS...${NC}"
    
    case $OS in
        "debian")
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt install -y nodejs
            ;;
        "redhat")
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            if command -v dnf &> /dev/null; then
                sudo dnf install -y nodejs npm
            else
                sudo yum install -y nodejs npm
            fi
            ;;
        "arch")
            sudo pacman -S --noconfirm nodejs npm
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install node@20
            else
                echo -e "${YELLOW}Please install Node.js v20+ manually from: https://nodejs.org${NC}"
                exit 1
            fi
            ;;
        *)
            echo "Please install Node.js v20+ manually from: https://nodejs.org"
            read -p "Press Enter when Node.js is installed..."
            ;;
    esac
    
    # Verify installation
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js $(node --version) installed successfully${NC}"
        echo -e "${GREEN}✓ NPM $(npm --version) installed successfully${NC}"
    else
        echo -e "${RED}❌ Node.js installation failed${NC}"
        exit 1
    fi
}

# Create project directories
setup_project() {
    echo -e "${BLUE}📁 Setting up project structure...${NC}"
    
    # Get current directory
    PROJECT_DIR=$(pwd)
    echo -e "${CYAN}📍 Project directory: ${PROJECT_DIR}${NC}"
    
    # Create directories if they don't exist
    mkdir -p backend
    mkdir -p frontend/{css,js,assets/avatars/3d}
    
    # Create log files in backend directory
    touch backend/system.log
    touch backend/all.log
    
    # Set proper permissions
    chmod 644 backend/*.log
    
    echo -e "${GREEN}✓ Project directories created${NC}"
    echo -e "${CYAN}  • backend/ - Server files${NC}"
    echo -e "${CYAN}  • frontend/ - Client files${NC}"
    echo -e "${CYAN}  • frontend/assets/avatars/3d/ - 3D models${NC}"
}

# Install NPM dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing NPM dependencies...${NC}"
    
    cd backend
    
    # Create updated package.json with fixed dependencies
    if [ ! -f package.json ]; then
        echo -e "${YELLOW}Creating package.json...${NC}"
        cat > package.json << 'EOF'
{
  "name": "avatar-chat-backend",
  "version": "1.0 Beta",
  "description": "Enhanced Avatar Chat UI Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "clean-logs": "rm -f *.log",
    "backup-config": "cp config.json config.backup.json"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "express": "^4.19.2",
    "body-parser": "^1.20.2",
    "node-fetch": "^2.7.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOF
    fi
    
    # Clear npm cache to avoid version conflicts
    echo -e "${YELLOW}Clearing npm cache...${NC}"
    npm cache clean --force 2>/dev/null || true
    
    # Install dependencies with exact versions
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --no-audit --no-fund
    
    # Install global nodemon for development (optional)
    if ! command -v nodemon &> /dev/null; then
        echo -e "${YELLOW}Installing nodemon globally for development...${NC}"
        npm install -g nodemon || echo -e "${YELLOW}⚠ Could not install nodemon globally (not critical)${NC}"
    fi
    
    cd ..
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

# Create default configuration
create_default_config() {
    echo -e "${BLUE}⚙️ Creating default configuration...${NC}"
    
    if [ ! -f backend/config.json ]; then
        cat > backend/config.json << 'EOF'
{
  "openwebui_url": "https://localhost:443",
  "openwebui_api_key": "",
  "use_speech_input": true,
  "use_speech_output": true,
  "default_model": "gpt-4o-mini",
  "tts_engine_url": "",
  "tts_api_key": "",
  "tts_voice": "alloy",
  "tts_model": "tts-1",
  "tts_speed": 1.0,
  "tts_volume": 1.0,
  "speech_recognition_lang": "de-DE",
  "max_conversation_history": 20,
  "request_timeout": 30000,
  "tts_timeout": 15000,
  "avatar_settings": {
    "default_type": "3d",
    "default_quality": "high",
    "animation_enabled": true,
    "emotion_detection": true
  },
  "logging": {
    "level": "info",
    "max_file_size": "10MB",
    "rotate_logs": true
  },
  "security": {
    "cors_enabled": true,
    "rate_limiting": false,
    "max_requests_per_minute": 60
  }
}
EOF
        echo -e "${GREEN}✓ Default configuration created${NC}"
    else
        echo -e "${YELLOW}⚠ Configuration file already exists, skipping...${NC}"
    fi
}

# Download sample 3D models if they don't exist
download_sample_models() {
    echo -e "${BLUE}🎭 Setting up sample 3D models...${NC}"
    
    cd frontend/assets/avatars/3d
    
    # Create simple OBJ models if they don't exist
    if [ ! -f model_low.obj ]; then
        cat > model_low.obj << 'EOF'
# Simple low poly avatar model
v -0.5 0.5 0.5
v 0.5 0.5 0.5
v 0.5 -0.5 0.5
v -0.5 -0.5 0.5
f 1 2 3 4
EOF
    fi
    
    if [ ! -f model_medium.obj ]; then
        cat > model_medium.obj << 'EOF'
# Medium detail avatar model
v -0.6 0.8 0.4
v 0.6 0.8 0.4
v 0.6 -0.8 0.4
v -0.6 -0.8 0.4
f 1 2 3 4
EOF
    fi
    
    if [ ! -f model_high.obj ]; then
        cat > model_high.obj << 'EOF'
# High detail avatar model (stylized torso)
v 0 1 0
v -0.3 0.5 0.1
v 0.3 0.5 0.1
v -0.4 -0.8 0.1
v 0.4 -0.8 0.1
f 1 2 3
f 2 4 5 3
EOF
    fi
    
    cd - > /dev/null
    echo -e "${GREEN}✓ Sample 3D models ready${NC}"
}

# Test installation
test_installation() {
    echo -e "${BLUE}🧪 Testing installation...${NC}"
    
    # Test Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        return 1
    fi
    
    # Test NPM dependencies
    cd backend
    if ! npm list express &> /dev/null; then
        echo -e "${RED}❌ Express.js not installed properly${NC}"
        return 1
    fi
    cd ..
    
    # Test file structure
    local required_files=(
        "backend/server.js"
        "backend/api.js"
        "backend/package.json"
        "backend/config.json"
        "frontend/index.html"
        "frontend/css/style.css"
        "frontend/js/main.js"
        "frontend/js/avatar2d.js"
        "frontend/js/avatar3d.js"
    )
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        echo -e "${YELLOW}⚠ Some files are missing, but installation can continue:${NC}"
        for file in "${missing_files[@]}"; do
            echo -e "${YELLOW}  - $file${NC}"
        done
        echo -e "${CYAN}ℹ️  You can upload these files manually later.${NC}"
    fi
    
    echo -e "${GREEN}✓ Installation test completed${NC}"
}

# Create startup scripts
create_scripts() {
    echo -e "${BLUE}📝 Creating startup scripts...${NC}"
    
    # Create start script (fixed path issue)
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Avatar Chat UI v6 Enhanced..."
cd backend
if [ ! -f server.js ]; then
    echo "❌ Error: server.js not found in backend directory"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi
npm start
EOF
    chmod +x start.sh
    
    # Create dev script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Avatar Chat UI v6 Enhanced in development mode..."
cd backend
if [ ! -f server.js ]; then
    echo "❌ Error: server.js not found in backend directory"
    echo "Please ensure all files are properly uploaded"
    exit 1
fi
if command -v nodemon &> /dev/null; then
    npm run dev
else
    echo "⚠️ nodemon not found, using node instead"
    npm start
fi
EOF
    chmod +x start-dev.sh
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Avatar Chat UI..."
pkill -f "node.*server.js" || true
echo "Stopped."
EOF
    chmod +x stop.sh
    
    # Create status script
    cat > status.sh << 'EOF'
#!/bin/bash
echo "Avatar Chat UI Status:"
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Server is running (PID: $(pgrep -f "node.*server.js"))"
    echo "🌐 Access: http://localhost:3000"
else
    echo "⭕ Server is not running"
fi
EOF
    chmod +x status.sh
    
    echo -e "${GREEN}✓ Startup scripts created${NC}"
}

# Final instructions
show_final_instructions() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════╗"
    echo "║            🎉 Installation Complete! 🎉           ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. Upload missing files (if any):${NC}"
    echo "   • Copy server.js, api.js to backend/"
    echo "   • Copy index.html, CSS, JS files to frontend/"
    echo ""
    echo -e "${YELLOW}2. Configure your settings:${NC}"
    echo "   • OpenWebUI URL and API Key"
    echo "   • TTS Engine URL and API Key"
    echo "   • Avatar preferences"
    echo ""
    echo -e "${YELLOW}3. Start the application:${NC}"
    echo -e "   ${GREEN}./start.sh${NC}          # Production mode"
    echo -e "   ${GREEN}./start-dev.sh${NC}      # Development mode"
    echo ""
    echo -e "${YELLOW}4. Check status:${NC}"
    echo -e "   ${GREEN}./status.sh${NC}         # Check if running"
    echo -e "   ${GREEN}./stop.sh${NC}           # Stop server"
    echo ""
    echo -e "${YELLOW}5. Access the application:${NC}"
    echo -e "   ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo -e "${CYAN}🔧 Troubleshooting:${NC}"
    echo "• Path issues? Check: ls -la backend/"
    echo "• Dependencies? Run: cd backend && npm install"
    echo "• Port in use? Try: PORT=3001 ./start.sh"
    echo "• Logs: backend/system.log, backend/all.log"
    echo ""
    echo -e "${CYAN}📁 Directory Structure:${NC}"
    echo "$(pwd)/"
    echo "├── backend/           # Server files"
    echo "│   ├── server.js     # Main server"
    echo "│   ├── api.js        # API routes"
    echo "│   ├── config.json   # Configuration"
    echo "│   └── package.json  # Dependencies"
    echo "├── frontend/          # Client files"
    echo "│   ├── index.html    # Main page"
    echo "│   ├── css/style.css # Styles"
    echo "│   └── js/           # JavaScript"
    echo "└── *.sh              # Control scripts"
    echo ""
    echo -e "${PURPLE}📖 Documentation: README.md${NC}"
    echo -e "${PURPLE}🐛 Issues: https://github.com/baefthde/Avatar-beta/issues${NC}"
    echo ""
    echo -e "${GREEN}Happy chatting with your AI Avatar! 🤖✨${NC}"
}

# Main installation process
main() {
    echo -e "${BLUE}🚀 Starting Avatar Chat UI v6 Enhanced installation...${NC}"
    
    check_root
    detect_os
    check_requirements
    install_nodejs
    setup_project
    install_dependencies
    create_default_config
    download_sample_models
    test_installation
    create_scripts
    show_final_instructions
    
    echo ""
    echo -e "${GREEN}✅ Installation completed successfully!${NC}"
    echo -e "${CYAN}🔗 Next: Upload your files and run './start.sh'${NC}"
}

# Error handling
trap 'echo -e "${RED}❌ Installation failed at line $LINENO${NC}"; exit 1' ERR

# Run main function
main "$@" nodejs npm
