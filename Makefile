.PHONY: setup teardown clean help

# --- Variables ---
TF_DIR := terraform

create: ## 🏗️  Full backend and infrastructure setup
	@echo "--- Starting Setup ---"
	./bootstrap.sh create
	cd $(TF_DIR) && terraform init
	cd $(TF_DIR) && terraform plan
	@echo "--- Setup complete. Run 'make apply' or 'cd terraform && terraform apply' to deploy. ---"

destroy: ## 🧨 Full infrastructure and backend destruction
	@echo "--- Starting Teardown ---"
	@echo "⚠️  Warning: This will destroy ALL managed infrastructure and the backend state."
	@read -p "Are you sure? [y/N] " ans && [ $${ans:-N} = y ]
	cd $(TF_DIR) && terraform destroy -auto-approve
	./bootstrap.sh destroy
	@echo "--- Teardown complete. ---"

clean: ## 🧹 Clean local temporary files
	rm -f *.mp3
	rm -rf $(TF_DIR)/.terraform/
	rm -f $(TF_DIR)/terraform.tfstate*

help: ## ❓ Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help