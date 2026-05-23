.PHONY: all clean min wasm

MINIFY = npx terser
MINIFY_FLAGS = --compress --mangle

SRC = src/calibration.js src/eyegestures.js
MIN = $(SRC:.js=.min.js)

min:
	$(MINIFY) $(SRC) $(MINIFY_FLAGS) -o src/eyegestures.min.js

wasm:
	cd ./rust_eyegestures && wasm-pack build --target web

clean:
	rm -f src/eyegestures.min.js