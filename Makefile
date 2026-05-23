.PHONY: all clean min

MINIFY = npx terser
MINIFY_FLAGS = --compress --mangle

SRC = src/calibration.js src/eyegestures.js
MIN = $(SRC:.js=.min.js)

min:
	$(MINIFY) $(SRC) $(MINIFY_FLAGS) -o src/eyegestures.min.js

clean:
	rm -f src/eyegestures.min.js