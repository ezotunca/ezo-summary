document.addEventListener('DOMContentLoaded', function() {
  
    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultBox = document.getElementById('resultBox');
    const summaryLength = document.getElementById('summaryLength');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const copyBtn = document.getElementById('copyBtn');
    const loading = document.getElementById('loading'); 
    inputText.addEventListener('input', function() {
        const length = inputText.value.length;
        charCount.textContent = `${length}/5000 karakter`;
        if (length > 5000) {
            charCount.style.color = '#ff4444';
        } else if (length < 50) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#667eea';
        }
    });
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        charCount.textContent = '0/5000 karakter';
        charCount.style.color = '#667eea';
        resultBox.innerHTML = '<p class="placeholder-text">Özet burada görünecek...</p>';
        summaryLength.textContent = 'Özet: 0 karakter';
        downloadPdfBtn.disabled = true;
        copyBtn.disabled = true;
    });
    summarizeBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        if (text.length < 50) {
            alert('Lütfen en az 50 karakter girin!');
            return;
        }
        
        if (text.length > 5000) {
            alert('Metin en fazla 5000 karakter olabilir!');
            return;
        }
        loading.style.display = 'block';
        summarizeBtn.disabled = true;

        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (response.ok) {
                displaySummary(text, data.summary);
            } else {
                alert('Hata: ' + (data.error || 'Bilinmeyen bir hata oluştu'));
            }
        } catch (error) {
            alert('Bağlantı hatası: ' + error.message);
        } finally {
            loading.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });
    function displaySummary(original, summary) {
        resultBox.innerHTML = `<p>${summary}</p>`;
        summaryLength.textContent = `Özet: ${summary.length} karakter`;
        downloadPdfBtn.disabled = false;
        copyBtn.disabled = false; 
        downloadPdfBtn.onclick = function() {
            downloadAsPdf(original, summary);
        };
        copyBtn.onclick = function() {
            copyToClipboard(summary);
        };
    }
    async function downloadAsPdf(original, summary) {
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PDF Oluşturuluyor...';

        try {
            const response = await fetch('/create_pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    original: original,
                    summary: summary 
                })
            });

            const data = await response.json();

            if (response.ok) {
                // PDF Olarak indirmek için
                window.open(data.pdf_url, '_blank');
            } else {
                alert('PDF oluşturma hatası: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('PDF oluşturma hatası: ' + error.message);
        } finally {
            downloadPdfBtn.disabled = false;
            downloadPdfBtn.innerHTML = '<i class="fas fa-download"></i> PDF İndir';
        }
    }
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
                copyBtn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            })
            .catch(err => {
                alert('Kopyalama hatası: ' + err);
            });
    }

    // Başlangıç ayarları
    charCount.textContent = '0/5000 karakter';

});
