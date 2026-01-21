# Flask web uygulaması
from flask import Flask, render_template, request, jsonify, send_file
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import uuid
from werkzeug.utils import secure_filename

# Flask başlat
app = Flask(__name__)

# PDF kayıt klasörü
app.config['UPLOAD_FOLDER'] = 'uploads'

# Klasör yoksa oluştur
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Basit Türkçe özetleme
def turkce_ozetle(metin, cumle_sayisi=3):
    # Noktalama ile cümle ayır
    cumleler = []
    gecici = ""
    
    for char in metin:
        gecici += char
        if char in '.!?':
            cumleler.append(gecici.strip())
            gecici = ""
    
    if gecici:
        cumleler.append(gecici.strip())
    
    # İlk cümleleri al
    ozet = cumleler[:min(cumle_sayisi, len(cumleler))]
    return ' '.join(ozet)

# Ana sayfa
@app.route('/')
def ana_sayfa():
    return render_template('index.html')

# Özetleme endpoint
@app.route('/ozetle', methods=['POST'])
def ozetle():
    try:
        # JSON verisini al
        data = request.get_json()
        metin = data.get('metin', '')
        
        # Boş mu kontrol
        if not metin:
            return jsonify({'hata': 'Metin gerekli'}), 400
        
        # Temizle ve kontrol
        metin = metin.strip()
        if len(metin) < 50:
            return jsonify({'hata': 'En az 50 karakter'}), 400
        if len(metin) > 5000:
            return jsonify({'hata': 'En fazla 5000 karakter'}), 400
        
        # Cümle sayısını ayarla
        cumle_sayisi = max(2, len(metin) // 500)
        cumle_sayisi = min(cumle_sayisi, 5)
        
        # Özetle
        ozet = turkce_ozetle(metin, cumle_sayisi)
        
        return jsonify({'ozet': ozet})
        
    except Exception as e:
        return jsonify({'hata': str(e)}), 500

# Türkçe karakterleri ASCII'ye çevir
def turkce_to_ascii(text):
    replacements = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    }
    for turkce, ingilizce in replacements.items():
        text = text.replace(turkce, ingilizce)
    return text

# PDF oluştur - TÜRKÇE KARAKTER DESTEKLİ
@app.route('/pdf_olustur', methods=['POST'])
def pdf_olustur():
    try:
        data = request.get_json()
        orijinal = data.get('orijinal', '')
        ozet = data.get('ozet', '')
        
        if not orijinal or not ozet:
            return jsonify({'hata': 'PDF için metin gerekli'}), 400
        
        # Benzersiz dosya adı
        dosya_adi = str(uuid.uuid4())[:8] + "_ozet.pdf"
        dosya_yolu = os.path.join(app.config['UPLOAD_FOLDER'], dosya_adi)
        
        # PDF oluştur
        doc = SimpleDocTemplate(dosya_yolu, pagesize=letter)
        styles = getSampleStyleSheet()
        icerik = []
        
        # Başlık stili
        styles['Heading1'].fontSize = 16
        styles['Heading1'].alignment = 1  # Ortala
        
        styles['Heading2'].fontSize = 12
        styles['Heading2'].spaceBefore = 12
        
        styles['Normal'].fontSize = 10
        styles['Normal'].leading = 14
        
        # Türkçe karakterleri ASCII'ye çevir
        orijinal_ascii = turkce_to_ascii(orijinal)
        ozet_ascii = turkce_to_ascii(ozet)
        
        # Başlık
        baslik = Paragraph("EZO SUMMARY - OZET RAPORU", styles['Heading1'])
        icerik.append(baslik)
        icerik.append(Paragraph("<br/><br/>", styles['Normal']))
        
        # Orijinal metin başlığı
        icerik.append(Paragraph("ORIJINAL METIN:", styles['Heading2']))
        icerik.append(Paragraph("<br/>", styles['Normal']))
        
        # Orijinal metni paragraflara ayır
        orijinal_paragraflar = orijinal_ascii.split('\n')
        for p in orijinal_paragraflar:
            if p.strip():
                icerik.append(Paragraph(p.strip(), styles['Normal']))
                icerik.append(Paragraph("<br/>", styles['Normal']))
        
        icerik.append(Paragraph("<br/>", styles['Normal']))
        
        # Özet başlığı
        icerik.append(Paragraph("OZET:", styles['Heading2']))
        icerik.append(Paragraph("<br/>", styles['Normal']))
        
        # Özet metnini ekle
        ozet_paragraflar = ozet_ascii.split('. ')
        for p in ozet_paragraflar:
            if p.strip():
                # Nokta ekle (split sırasında kayboldu)
                if not p.strip().endswith('.'):
                    p = p.strip() + '.'
                icerik.append(Paragraph(p, styles['Normal']))
                icerik.append(Paragraph("<br/>", styles['Normal']))
        
        # PDF'yi kaydet
        doc.build(icerik)
        
        return jsonify({'pdf_url': f'/pdf_indir/{dosya_adi}'})
        
    except Exception as e:
        return jsonify({'hata': str(e)}), 500

# PDF indir
@app.route('/pdf_indir/<dosya_adi>')
def pdf_indir(dosya_adi):
    try:
        guvenli_adi = secure_filename(dosya_adi)
        dosya_yolu = os.path.join(app.config['UPLOAD_FOLDER'], guvenli_adi)
        
        if os.path.exists(dosya_yolu):
            return send_file(dosya_yolu, as_attachment=True, download_name="ezo_ozet.pdf")
        else:
            return "Dosya bulunamadı", 404
            
    except Exception as e:
        return str(e), 500

# Uygulamayı çalıştır
if __name__ == '__main__':
    print("EZO SUMMARY başlatılıyor...")
    print("Adres: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)