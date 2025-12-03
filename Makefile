
YT_DLP_PATH := /usr/bin/yt-dlp
FFMPEG_PATH := /usr/bin/ffmpeg

.PHONY: clean help

clean:
	rm -f *.mp3

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

.DEFAULT_GOAL := help