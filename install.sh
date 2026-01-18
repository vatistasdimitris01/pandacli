#!/usr/bin/env bash
set -e

REPO="vatistasdimitris01/pandacli"
BIN="pandacli"

OS="$(uname | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  msys*|mingw*|cygwin*) OS="windows" ;;
  *) echo "Unsupported OS: $OS" && exit 1 ;;
esac

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported ARCH: $ARCH" && exit 1 ;;
esac

FILE="$BIN-$OS-$ARCH"
[ "$OS" = "windows" ] && FILE="$FILE.exe"

LATEST=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" \
  | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

URL="https://github.com/$REPO/releases/download/$LATEST/$FILE"

echo "Downloading $FILE from $URL..."
curl -L "$URL" -o /tmp/$FILE
chmod +x /tmp/$FILE || true

INSTALL_DIR="/usr/local/bin"
[ "$OS" = "windows" ] && INSTALL_DIR="$HOME/bin"

mkdir -p "$INSTALL_DIR"
mv /tmp/$FILE "$INSTALL_DIR/$BIN"

echo "Installed $BIN!"
echo "Run: $BIN --help"