#!/bin/bash
# Task: Tesseract OCR on PDF or image files
# Runs ON the remote GPU instance

set -e

echo "[tesseract] Starting OCR..."

# Install if not present
if ! command -v tesseract &>/dev/null; then
  sudo apt-get install -y -q tesseract-ocr tesseract-ocr-eng poppler-utils
fi
if ! command -v pdftoppm &>/dev/null; then
  sudo apt-get install -y -q poppler-utils
fi

mkdir -p ~/output

# Detect available workers (use all CPUs)
WORKERS=$(nproc 2>/dev/null || echo 4)
echo "[tesseract] Workers: $WORKERS"

# Install PyMuPDF if not present (faster PDF→image than pdftoppm for many files)
python3 -c "import fitz" 2>/dev/null || pip3 install pymupdf -q 2>/dev/null || true

# Build list of PDFs/images to process, skip already-done
JOBS=()
for INPUT_FILE in ~/input/*; do
  BASENAME=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')
  EXT=$(echo "${INPUT_FILE##*.}" | tr '[:upper:]' '[:lower:]')
  [[ ! "$EXT" =~ ^(pdf|png|jpg|jpeg|tiff|tif|bmp|ppm|pgm|pbm)$ ]] && continue
  [ -f ~/output/"${BASENAME}_full.txt" ] && continue  # already done
  JOBS+=("$INPUT_FILE")
done

echo "[tesseract] Files to process: ${#JOBS[@]}"

# Worker function: OCR one file
ocr_one() {
  INPUT_FILE="$1"
  BASENAME=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')
  EXT=$(echo "${INPUT_FILE##*.}" | tr '[:upper:]' '[:lower:]')
  TMPDIR=$(mktemp -d)

  if [[ "$EXT" == "pdf" ]]; then
    # Try PyMuPDF first (faster), fallback to pdftoppm
    if python3 -c "import fitz" 2>/dev/null; then
      python3 -c "
import fitz, sys, os
doc = fitz.open('$INPUT_FILE')
mat = fitz.Matrix(200/72, 200/72)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
    pix.save('$TMPDIR/page-{:03d}.png'.format(i+1))
doc.close()
"
    elif command -v pdftoppm &>/dev/null; then
      pdftoppm -r 200 -png "$INPUT_FILE" "$TMPDIR/page"
    else
      echo "[tesseract] ERROR: no PDF converter for $BASENAME"
      rm -rf "$TMPDIR"
      return 1
    fi

    # OCR each page (OMP_THREAD_LIMIT=1 prevents CPU contention with parallel workers)
    for IMG in "$TMPDIR"/page-*.png; do
      PAGE=$(basename "$IMG" .png | sed 's/page-//')
      OMP_THREAD_LIMIT=1 tesseract "$IMG" ~/output/"${BASENAME}_p${PAGE}" txt \
        --oem 1 --psm 6 -c preserve_interword_spaces=1 2>/dev/null
    done

    # Combine all pages
    cat ~/output/"${BASENAME}"_p*.txt 2>/dev/null > ~/output/"${BASENAME}_full.txt"
    echo "[tesseract] Done: ${BASENAME}_full.txt"
  else
    OMP_THREAD_LIMIT=1 tesseract "$INPUT_FILE" ~/output/"$BASENAME" txt 2>/dev/null
    cp ~/output/"${BASENAME}.txt" ~/output/"${BASENAME}_full.txt" 2>/dev/null || true
    echo "[tesseract] Done: ${BASENAME}.txt"
  fi

  rm -rf "$TMPDIR"
}
export -f ocr_one

# Run in parallel using xargs
printf '%s\n' "${JOBS[@]}" | xargs -P "$WORKERS" -I{} bash -c 'ocr_one "$@"' _ {}

echo "[tesseract] All done. Output files: $(ls ~/output/*.txt 2>/dev/null | wc -l)"
