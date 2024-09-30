import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

// Set the workerSrc property
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.js`;

const PdfUploadForm = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const canvasRef = useRef(null);
  const [pageNum, setPageNum] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      setPageNum(1); // Reset page number when a new file is selected
      setExtractedText(''); // Reset extracted text
    } else {
      setError('Please upload a valid PDF file.');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
      await loadPdf(file);
      setLoading(false);
    }
  };

  const loadPdf = async (pdfFile) => {
    const pdfUrl = URL.createObjectURL(pdfFile);
    const loadingTask = getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    setPdfDoc(pdf);
    renderPage(pageNum, pdf);
  };

  const renderPage = async (num, pdf) => {
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    document.getElementById('page_num').textContent = num;
    document.getElementById('page_count').textContent = pdf.numPages;

    // Perform OCR on the rendered page
    const imageDataUrl = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => console.log(m),
    });
    setExtractedText(result.data.text + '\n');
  };

  const onPrevPage = () => {
    if (pageNum <= 1) return;
    setPageNum(pageNum - 1);
    renderPage(pageNum - 1, pdfDoc);
  };

  const onNextPage = () => {
    if (pdfDoc && pageNum < pdfDoc.numPages) {
      setPageNum(pageNum + 1);
      renderPage(pageNum + 1, pdfDoc);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg"
      >
        <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Upload PDF File</h2>
        <div>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 p-2"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
        {loading && <p className="mt-4 text-blue-500">Loading PDF, please wait...</p>}
        {pdfDoc && (
          <div className="flex justify-between items-center mt-6 text-gray-700">
            <button
              id="prev"
              onClick={onPrevPage}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Previous
            </button>
            <span>
              Page: <span id="page_num" className="font-semibold">{pageNum}</span> / <span id="page_count" className="font-semibold"></span>
            </span>
            <button
              id="next"
              onClick={onNextPage}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Next
            </button>
          </div>
        )}
        <canvas ref={canvasRef} id="the-canvas" className="mt-6 border rounded-lg shadow-md" />
        {extractedText && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800">Extracted Text:</h3>
            <p className="mt-2 text-gray-700 bg-gray-100 p-4 rounded-lg shadow-inner whitespace-pre-wrap">{extractedText}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PdfUploadForm;
