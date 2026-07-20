INFRA_DIR := infrastructure

# 全環境・モジュールのディレクトリ一覧
TERRAFORM_DIRS := \
	$(INFRA_DIR)/environments/00_bootstrap \
	$(INFRA_DIR)/environments/10_shared \
	$(INFRA_DIR)/environments/20_stg \
	$(INFRA_DIR)/environments/30_prod \
	$(INFRA_DIR)/environments/90_github \
	$(INFRA_DIR)/modules/cloud_run \
	$(INFRA_DIR)/modules/firestore \
	$(INFRA_DIR)/modules/firebase_auth \
	$(INFRA_DIR)/_global-settings

.PHONY: terraform/fmt terraform/fmt-check terraform/validate terraform/lint terraform/check gen-env-local install-hooks emulator help

## terraform/fmt: terraform fmt で全ファイルを自動整形
terraform/fmt:
	terraform fmt -recursive $(INFRA_DIR)/

## terraform/fmt-check: フォーマット差分の確認のみ (変更なし)
terraform/fmt-check:
	terraform fmt -check -recursive -diff $(INFRA_DIR)/

## terraform/validate: 全ディレクトリで terraform validate を実行
terraform/validate:
	@for dir in $(TERRAFORM_DIRS); do \
		echo "▶ validate: $$dir"; \
		terraform -chdir=$$dir init -backend=false -input=false > /dev/null && \
		terraform -chdir=$$dir validate || exit 1; \
	done
	@echo "✓ validate: all passed"

## terraform/lint: tflint を実行 (要: tflint インストール済み)
terraform/lint:
	tflint --init --config=.tflint.hcl
	tflint --recursive --config="$(CURDIR)/.tflint.hcl" --chdir=$(INFRA_DIR)/

## terraform/check: fmt-check + validate + lint をまとめて実行
terraform/check: terraform/fmt-check terraform/validate terraform/lint

## gen-env-local: STG の接続情報を .env.local に書き出す
gen-env-local:
	terraform -chdir=$(INFRA_DIR)/environments/20_stg output -raw env_local > .env.local
	@echo "✓ .env.local を生成しました (NEXT_PUBLIC_FIREBASE_API_KEY は手動で設定してください)"

## install-hooks: pre-commit フックをインストール
install-hooks:
	@command -v pre-commit >/dev/null 2>&1 || { echo "pre-commit をインストールしてください: pip install pre-commit"; exit 1; }
	pre-commit install
	pre-commit install --hook-type commit-msg
	@echo "✓ pre-commit フックをインストールしました"

## emulator: 全エミュレータを起動 (Auth:9099, Firestore:8080, UI:4000) ※データは .firebase/emulator-data に永続化
emulator:
	GOOGLE_CLOUD_QUOTA_PROJECT=gizumon-hanayori \
	FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
	FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
	npx -y firebase-tools@latest emulators:start \
		--project gizumon-hanayori \
		--import=.firebase/emulator-data \
		--export-on-exit

## help: このヘルプを表示
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'
