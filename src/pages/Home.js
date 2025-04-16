import React, { useState } from "react";
import PDFViewer from "../components/PDFViewer";

const Home = () => {
    const [pdfFile, setPdfFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = (ev) => setPdfFile(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a PDF file.");
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>eSignMate 📄✍️</h1>
            <p>Step 1: Upload a PDF to get started</p>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            {pdfFile && <PDFViewer fileUrl={pdfFile} />}
        </div>
    );
};

export default Home;


