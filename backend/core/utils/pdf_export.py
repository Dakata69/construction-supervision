import sys
import pythoncom
from docx2pdf import convert

def convert_to_pdf(docx_path, pdf_path):
    """
    Convert a DOCX file to PDF.
    
    Args:
        docx_path (str): Path to the source DOCX file
        pdf_path (str): Path where to save the PDF file
    """
    # Initialize COM for this thread on Windows
    if sys.platform == 'win32':
        pythoncom.CoInitialize()
    
    try:
        convert(docx_path, pdf_path)
    finally:
        # Uninitialize COM when done
        if sys.platform == 'win32':
            pythoncom.CoUninitialize()
