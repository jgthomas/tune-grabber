.PHONY: check up down logs create import destroy clean clean-all help

# --- Variables ---
TF_DIR := terraform
APP_NAME := tune-grabber
IMAGE_NAME := latest
IMAGE_PORT := 8080
CONTAINER_NAME := $(APP_NAME)-development

check: ## 🧪 Run linting, formatting, types, and tests
	@echo "Checking linting..."
	yarn lint
	@echo "Checking formatting..."
	yarn format
	@echo "Checking types..."
	yarn type-check
	@echo "Running tests with coverage..."
	yarn test:coverage

up: down ## 🚀 Start local development environment
	@echo "--- Starting local development environment ---"
	docker build -t $(APP_NAME):$(IMAGE_NAME) .
	docker run -d \
		--restart unless-stopped \
		-p $(IMAGE_PORT):$(IMAGE_PORT) \
		--name $(CONTAINER_NAME) \
		$(APP_NAME):$(IMAGE_NAME)

down: ## 🛑 Stop local development environment
	@echo "--- Stopping local development environment ---"
	-@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	-@docker rm $(CONTAINER_NAME) 2>/dev/null || true

logs: ## 📜 Follow container logs
	docker logs -f $(CONTAINER_NAME)

create: ## 🏗️  Full backend and infrastructure setup
	@echo "--- Starting Setup ---"
	./bootstrap.sh create
	cd $(TF_DIR) && terraform init
	cd $(TF_DIR) && terraform plan
	@echo "--- Setup complete. Run 'make import' if ECR already exists. ---"

import: ## 📥 Sync existing ECR repository into state
	@echo "--- Importing existing ECR repository ---"
	cd $(TF_DIR) && terraform import aws_ecr_repository.app $(APP_NAME)

destroy: ## 🧨 Full infrastructure destruction
	@echo "--- Starting Teardown ---"
	cd $(TF_DIR) && terraform destroy -auto-approve
	./bootstrap.sh destroy

clean: ## 🧹 Clean local media files
	rm -f *.mp3

clean-all: clean ## 🧹 Clean media AND local Terraform state/cache
	rm -rf $(TF_DIR)/.terraform/
	rm -f $(TF_DIR)/terraform.tfstate*

help: ## ❓ Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help