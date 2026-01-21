// Sayfa yüklendiğinde çalışacak kodlar
document.addEventListener('DOMContentLoaded', function() {
    // HTML elementlerini seç
    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultBox = document.getElementById('resultBox');
    const summaryLength = document.getElementById('summaryLength');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const copyBtn = document.getElementById('copyBtn');
    const loading = document.getElementById('loading');

    // Karakter sayacını güncelle
    inputText.addEventListener('input', function() {
        const length = inputText.value.length;
        charCount.textContent = `${length}/5000 karakter`;
        
        // 5000 karakterden fazlaysa uyarı
        if (length > 5000) {
            charCount.style.color = '#ff4444';
        } else if (length < 50) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#667eea';
        }
    });

    // Temizle butonu
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        charCount.textContent = '0/5000 karakter';
        charCount.style.color = '#667eea';
        resultBox.innerHTML = '<p class="placeholder-text">Özet burada görünecek...</p>';
        summaryLength.textContent = 'Özet: 0 karakter';
        downloadPdfBtn.disabled = true;
        copyBtn.disabled = true;
    });

    // Özetle butonu
    summarizeBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        
        // Validasyon kontrolleri
        if (text.length < 50) {
            alert('Lütfen en az 50 karakter girin!');
            return;
        }
        
        if (text.length > 5000) {
            alert('Metin en fazla 5000 karakter olabilir!');
            return;
        }

        // Yükleme göster
        loading.style.display = 'block';
        summarizeBtn.disabled = true;

        try {
            // Sunucuya istek gönder
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (response.ok) {
                // Başarılı ise özeti göster
                displaySummary(text, data.summary);
            } else {
                // Hata durumunda
                alert('Hata: ' + (data.error || 'Bilinmeyen bir hata oluştu'));
            }
        } catch (error) {
            alert('Bağlantı hatası: ' + error.message);
        } finally {
            // Yükleme gizle
            loading.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });

    // Özeti ekranda göster
    function displaySummary(original, summary) {
        // Özeti göster
        resultBox.innerHTML = `<p>${summary}</p>`;
        summaryLength.textContent = `Özet: ${summary.length} karakter`;
        
        // Butonları aktif et
        downloadPdfBtn.disabled = false;
        copyBtn.disabled = false;
        
        // PDF indirme butonuna tıklama
        downloadPdfBtn.onclick = function() {
            downloadAsPdf(original, summary);
        };
        
        // Kopyala butonuna tıklama
        copyBtn.onclick = function() {
            copyToClipboard(summary);
        };
    }

    // PDF oluşturma fonksiyonu
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
                // PDF'yi indir
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

    // Panoya kopyalama fonksiyonu
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Başarılı mesajı
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