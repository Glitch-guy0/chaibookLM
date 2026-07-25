import sys
import os
from docling.document_converter import DocumentConverter

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 parse_pdf.py <path_to_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}", file=sys.stderr)
        sys.exit(1)

    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    print(result.document.export_to_markdown())

if __name__ == "__main__":
    main()
