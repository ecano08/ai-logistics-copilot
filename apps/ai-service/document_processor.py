from pathlib import Path

from pypdf import PdfReader


class DocumentProcessingError(Exception):
    """Raised when a knowledge document cannot be processed."""


def extract_pdf_text(file_path: str) -> str:
    path = Path(file_path)

    if not path.exists():
        raise DocumentProcessingError(f"Document not found: {file_path}")

    if not path.is_file():
        raise DocumentProcessingError(f"Document path is not a file: {file_path}")

    if path.suffix.lower() != ".pdf":
        raise DocumentProcessingError("Only PDF documents are supported")

    try:
        reader = PdfReader(path)

        pages: list[str] = []

        for page in reader.pages:
            text = page.extract_text()

            if text:
                cleaned_text = text.strip()

                if cleaned_text:
                    pages.append(cleaned_text)

        extracted_text = "\n\n".join(pages).strip()

        if not extracted_text:
            raise DocumentProcessingError(
                "No extractable text was found in the PDF"
            )

        return extracted_text

    except DocumentProcessingError:
        raise

    except Exception as error:
        raise DocumentProcessingError(
            f"Unable to extract text from PDF: {error}"
        ) from error