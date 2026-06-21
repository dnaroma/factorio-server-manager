# Build tool for Factorio Server Manager

NODE_ENV:=production

release := build/factorio-server-manager-linux.zip

build: $(release)

build/factorio-server-manager-%.zip: clean app/bundle factorio-server-manager-%
	@mkdir -p build/
	@echo "Packaging Build - $@"
	@cp -r app/ factorio-server-manager/
	@cp conf.json.example factorio-server-manager/conf.json
	@zip -r $@ factorio-server-manager > /dev/null
	@rm -r factorio-server-manager/

app/bundle:
	@echo "Building Frontend"
	@CI=true pnpm install --frozen-lockfile && pnpm run build

factorio-server-manager-linux:
	@echo "Building Backend - Linux"
	@mkdir -p factorio-server-manager
	@cd src; \
	CGO_ENABLED=0 GO111MODULE=on GOOS=linux GOARCH=amd64 go build -o ../factorio-server-manager/factorio-server-manager .

gen_release: build/factorio-server-manager-linux.zip
	@echo "Done"

clean:
	@echo "Cleaning"
	@-rm -r build/
	@-rm app/bundle.js
	@-rm app/bundle.js.map
	@-rm app/style.css
	@-rm app/style.css.map
	@-rm -r app/assets/
	@-rm -r app/fonts/vendor/
	@-rm -r app/images/vendor/
	@-rm -rf node_modules/
	@-rm -r pkg/
	@-rm -r factorio-server-manager
