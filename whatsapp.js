const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');


const API_URL = 'https://live-mt-server.wati.io/309564'; // Change this to your WATI URL
const API_KEY = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMmY5YjU4MC1hYjUyLTQxOGItOWVkYS02YWY0NjQ2MjAyZTUiLCJ1bmlxdWVfbmFtZSI6InRvd25wbGFubWFwQGdtYWlsLmNvbSIsIm5hbWVpZCI6InRvd25wbGFubWFwQGdtYWlsLmNvbSIsImVtYWlsIjoidG93bnBsYW5tYXBAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDUvMTAvMjAyNCAwNTowNDozNyIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJ0ZW5hbnRfaWQiOiIzMDk1NjQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.cJSxtQdlyLu9qVd-n-AJkI2aKFexJCQ8piGqB7Txrf8'; // Your API key from WATI

async function uploadMedia(filePath) {
    const url = `${API_URL}/api/v1/media/upload`;
    const file = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(url, formData, {
        headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    return response.data;
}

// Function to send media on WhatsApp
async function sendWhatsAppMedia(to, mediaUrl) {
    const url = `${API_URL}/api/v1/sendSessionFile/916351672051`;
    const data = {
        to,
        url: mediaUrl,
        caption: 'Here is your PDF file!', // Optional caption
        filename: 'document.pdf' // Optional filename
    };

    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    return response.data;
}

// Example usage
async function sendPdf(to, filePath) {
    try {
        const uploadResponse = await uploadMedia(filePath);
        if (uploadResponse.success) {
            const sendResponse = await sendWhatsAppMedia(to, uploadResponse.url);
            console.log('Send response:', sendResponse);
        }
    } catch (error) {
        console.error('Error sending PDF:', error);
    }
}

// Call the function with recipient number and PDF file path
sendPdf('916351672051', 'submitted_data.pdf');


