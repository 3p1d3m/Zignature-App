import React, { useState, useRef } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import download from 'downloadjs';

const PDFViewer = ({ fileUrl }) => {
    const [pageCount, setPageCount] = useState(0);
    const [signatures, setSignatures] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [isSigningMode, setIsSigningMode] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const signaturePadRef = useRef(null);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const handleDocumentLoad = ({ numPages }) => {
        setPageCount(numPages);
    };

    const handleSignature = () => {
        if (!signaturePadRef.current) return;

        const signatureDataUrl = signaturePadRef.current.toDataURL();
        if (signatureDataUrl) {
            setSignatures(prev => ({
                ...prev,
                [currentPage]: {
                    dataUrl: signatureDataUrl,
                    position: { x: 400, y: 650 } // Fixed bottom right position
                }
            }));
            setIsSigningMode(false);
        }
    };

    const downloadSignedPdf = async () => {
        setIsGenerating(true);
        try {
            // Load the original PDF
            const response = await fetch(fileUrl);
            const existingPdfBytes = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            // Process each signed page
            const pages = pdfDoc.getPages();
            for (const [pageNum, signature] of Object.entries(signatures)) {
                const pageIndex = parseInt(pageNum) - 1;
                if (pageIndex >= 0 && pageIndex < pages.length) {
                    const page = pages[pageIndex];
                    const { height } = page.getSize();
                    
                    // Convert signature to PNG and embed
                    const pngImage = await pdfDoc.embedPng(signature.dataUrl);
                    const pngDims = pngImage.scale(0.2);
                    
                    // Draw signature at bottom right position
                    page.drawImage(pngImage, {
                        x: 400, // Fixed right position
                        y: height - 650 - pngDims.height, // Fixed bottom position
                        width: pngDims.width,
                        height: pngDims.height,
                        opacity: 0.9,
                    });
                }
            }
            
            // Save and download the modified PDF
            const pdfBytes = await pdfDoc.save();
            download(pdfBytes, "signed_document.pdf", "application/pdf");
            
        } catch (error) {
            console.error("Error generating signed PDF:", error);
            alert("Failed to generate signed PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ 
            position: 'relative', 
            height: '750px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div style={{
                    height: '750px',
                    position: 'relative',
                    filter: isSigningMode ? 'blur(2px)' : 'none',
                    transition: 'filter 0.3s ease'
                }}>
                    <Viewer
                        fileUrl={fileUrl}
                        plugins={[defaultLayoutPluginInstance]}
                        onDocumentLoad={handleDocumentLoad}
                        onPageChange={({ currentPage }) => setCurrentPage(currentPage + 1)}
                    />

                    {/* Signature preview at bottom right */}
                    {signatures[currentPage] && (
                        <div style={{
                            position: 'absolute',
                            right: '30px',
                            bottom: '30px',
                            zIndex: 10,
                            pointerEvents: 'none',
                            border: '1px dashed #27c069',
                            borderRadius: '4px',
                            padding: '5px',
                            backgroundColor: 'rgba(255,255,255,0.7)'
                        }}>
                            <img
                                src={signatures[currentPage].dataUrl}
                                alt="Signature"
                                style={{ 
                                    width: '120px',
                                    height: '50px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    )}
                </div>
            </Worker>

            {isSigningMode && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    width: '420px',
                    maxWidth: '90%'
                }}>
                    <h3 style={{ 
                        margin: '0 0 15px 0',
                        color: '#2c3e50',
                        textAlign: 'center'
                    }}>
                        Sign Page {currentPage}
                    </h3>
                    <p style={{
                        textAlign: 'center',
                        marginBottom: '15px',
                        color: '#7f8c8d'
                    }}>
                        Signature will be placed at bottom right
                    </p>
                    <SignatureCanvas
                        ref={signaturePadRef}
                        penColor="#3498db"
                        backgroundColor="rgba(240, 245, 250, 0.9)"
                        canvasProps={{
                            width: 350,
                            height: 150,
                            className: 'signature-canvas',
                            style: {
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                backgroundColor: 'white'
                            }
                        }}
                    />
                    <div style={{ 
                        marginTop: '20px', 
                        display: 'flex', 
                        gap: '10px',
                        justifyContent: 'center'
                    }}>
                        <button 
                            onClick={handleSignature}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#27c069',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Save Signature
                        </button>
                        <button 
                            onClick={() => signaturePadRef.current?.clear()}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Clear
                        </button>
                        <button 
                            onClick={() => setIsSigningMode(false)}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#95a5a6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                zIndex: 10,
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                backgroundColor: 'rgba(39, 192, 105, 0.9)',
                padding: '12px 20px',
                borderRadius: '6px',
                backdropFilter: 'blur(5px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <button 
                    onClick={() => setIsSigningMode(true)}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: 'white',
                        color: '#27c069',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        ':hover': {
                            transform: 'scale(1.05)'
                        }
                    }}
                >
                    Add Signature
                </button>
                <button 
                    onClick={downloadSignedPdf}
                    disabled={Object.keys(signatures).length === 0 || isGenerating}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: Object.keys(signatures).length === 0 ? '#95a5a6' : '#2c3e50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: Object.keys(signatures).length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        opacity: isGenerating ? 0.7 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    {isGenerating ? 'Generating...' : 'Download Signed PDF'}
                </button>
                <span style={{
                    marginLeft: 'auto',
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    Page {currentPage} of {pageCount}
                </span>
            </div>
        </div>
    );
};

export default PDFViewer;


