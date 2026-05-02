.DEFAULT_GOAL := help

PACKAGE_NAME := selector-extension
PACKAGE_FILE := $(PACKAGE_NAME).zip

.PHONY: help install clean reset dev build typecheck package smoke arch-check privacy-check version check release-check reload-info inspect

help: ## Show this help
	@printf "\nSelector operations\n\n"
	@printf "🛠  Setup\n"
	@printf "  make install        Install npm dependencies\n"
	@printf "  make clean          Remove build artifacts and packages\n"
	@printf "  make reset          Clean local dependencies and install again\n\n"
	@printf "🏗  Build\n"
	@printf "  make dev            Watch-build the extension during local development\n"
	@printf "  make build          Build the side-loadable MV3 extension into dist/\n"
	@printf "  make typecheck      Run TypeScript without emitting files\n"
	@printf "  make package        Build and zip dist/ for handoff or store upload\n\n"
	@printf "🧪  Check\n"
	@printf "  make smoke          Verify required dist/ extension artifacts\n"
	@printf "  make arch-check     Verify domain entities stay UI/API independent\n"
	@printf "  make privacy-check  Verify local-only constraints are not violated\n"
	@printf "  make version        Verify package and manifest versions match\n"
	@printf "  make check          Run typecheck, build, smoke, arch, privacy, version\n\n"
	@printf "🧩  Extension Debug\n"
	@printf "  make reload-info    Print Chrome side-load reload steps\n"
	@printf "  make inspect        Print MV3 debugging entry points\n\n"
	@printf "🚢  Release\n"
	@printf "  make release-check  Clean, install, build, and run all release checks\n\n"

install: ## Install npm dependencies
	npm install

clean: ## Remove build artifacts and packages
	rm -rf dist .vite $(PACKAGE_FILE)

reset: ## Clean local dependencies and install again
	rm -rf node_modules dist .vite $(PACKAGE_FILE)
	npm install

dev: ## Watch-build the extension (content + SW + 教程/沙盒页)
	@printf "\nStarting extension watch build...\n\n"
	@printf "First runs a full build, then watches main + tutorial Vite configs in parallel.\n"
	@printf "After the first build finishes:\n"
	@printf "1. Open Chrome and go to: chrome://extensions\n"
	@printf "2. Enable Developer mode in the top-right corner\n"
	@printf "3. Click Load unpacked\n"
	@printf "4. Select this project directory's dist/ folder\n"
	@printf "5. Extension menu: open 使用教程 / UI 沙盒 tabs, or use content script on a page\n"
	@printf "6. After code changes, extension reloads from watch output; click Reload on the extension card if needed\n\n"
	npm run dev

build: ## Build the side-loadable MV3 extension into dist/
	npm run build

typecheck: ## Run TypeScript without emitting files
	npm run typecheck

package: build ## Build and zip dist/ for handoff or store upload
	rm -f $(PACKAGE_FILE)
	cd dist && zip -qr ../$(PACKAGE_FILE) .
	@printf "Created $(PACKAGE_FILE)\n"

smoke: build ## Verify required dist/ extension artifacts
	node scripts/smoke-check.mjs

arch-check: ## Verify domain entities stay UI/API independent
	node scripts/arch-check.mjs

privacy-check: ## Verify local-only constraints are not violated
	node scripts/privacy-check.mjs

version: ## Verify package and manifest versions match
	node scripts/version-check.mjs

check: typecheck build smoke arch-check privacy-check version ## Run all normal checks

release-check: clean install build smoke arch-check privacy-check version ## Run release readiness checks

reload-info: ## Print Chrome side-load reload steps
	@printf "Chrome side-load flow:\n"
	@printf "1. Run: make build or make dev\n"
	@printf "2. Open Chrome and go to: chrome://extensions\n"
	@printf "3. Enable Developer mode in the top-right corner\n"
	@printf "4. Click Load unpacked\n"
	@printf "5. Select this project directory's dist/ folder\n"
	@printf "6. Open a target page, then click the Selector extension action or press Alt+Shift+S\n"
	@printf "7. After code changes rebuild, click Reload on the Selector extension card\n"

inspect: ## Print MV3 debugging entry points
	@printf "MV3 debugging entry points:\n"
	@printf "- Service worker: chrome://extensions -> Selector -> service worker inspect\n"
	@printf "- Content script: open the target page DevTools -> Sources -> Content scripts\n"
	@printf "- Runtime errors: chrome://extensions -> Selector -> Errors\n"
	@printf "- User activation: click the extension action or press Alt+Shift+S\n"
