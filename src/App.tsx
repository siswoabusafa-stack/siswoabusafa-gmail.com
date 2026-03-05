import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Copy, 
  Loader2, 
  FileText, 
  Printer, 
  Check, 
  AlertCircle,
  Clock,
  Type,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { generateCeramahStream } from './services/geminiService';
import { cn } from './lib/utils';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  useEffect(() => {
    console.log("App component mounted");
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      setError("Peringatan: API Key Gemini belum terdeteksi. Silakan atur VITE_GEMINI_API_KEY di Environment Variables Vercel agar aplikasi dapat berfungsi.");
    }
  }, []);

  const [theme, setTheme] = useState('');
  const [duration, setDuration] = useState('15 Menit');
  const [type, setType] = useState('Ceramah Umum');
  const [customOutline, setCustomOutline] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme) return;
    
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      await generateCeramahStream(theme, duration, type, customOutline, (chunk) => {
        setResult(chunk);
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menghasilkan ceramah. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadWord = async () => {
    if (!result) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `Naskah Ceramah: ${theme}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Jenis: ${type} | Durasi: ${duration}`,
            alignment: AlignmentType.CENTER,
          }),
          ...result.split('\n').map(line => {
            return new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
              spacing: { before: 200 },
            });
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Ceramah_${theme.replace(/\s+/g, '_')}.docx`);
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    
    const canvas = await html2canvas(resultRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ceramah_${theme.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F4EBD0] text-[#2D241E] font-serif selection:bg-[#D4AF37] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#B8860B]/20 py-8 px-4 text-center bg-white/30 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#B8860B] rounded-full text-white shadow-lg">
              <BookOpen size={32} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-[#4A3700]">Khutbah Generator</h1>
          <p className="text-[#8B6B00] italic text-lg font-medium">"Menyusun Hikmah Berdasarkan Al-Qur'an dan As-Sunnah"</p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-[#B8860B]/10">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[#4A3700]">
                <Layout size={20} className="text-[#B8860B]" />
                Konfigurasi Ceramah
              </h2>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#B8860B] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Type size={14} /> Judul / Tema
                  </label>
                  <input 
                    type="text" 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Contoh: Keutamaan Sabar"
                    className="w-full px-4 py-3 rounded-xl border border-[#B8860B]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-[#F4EBD0]/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8860B] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} /> Estimasi Durasi
                  </label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#B8860B]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-[#F4EBD0]/30"
                  >
                    <option>7 Menit (Kultum)</option>
                    <option>15 Menit</option>
                    <option>20 Menit (Khutbah Jumat)</option>
                    <option>30 Menit</option>
                    <option>45 Menit (Kajian)</option>
                    <option>1 Jam</option>
                    <option>2 Jam</option>
                    <option>3 Jam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8860B] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Jenis Ceramah
                  </label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#B8860B]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-[#F4EBD0]/30"
                  >
                    <option>Ceramah Umum</option>
                    <option>Khutbah Jumat</option>
                    <option>Khutbah Idul Fitri</option>
                    <option>Khutbah Idul Adha</option>
                    <option>Kultum Ramadhan</option>
                    <option>Kajian Tematik</option>
                    <option>Nasehat Pernikahan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8860B] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Layout size={14} /> Kisi-kisi / Outline (Opsional)
                  </label>
                  <textarea 
                    value={customOutline}
                    onChange={(e) => setCustomOutline(e.target.value)}
                    placeholder="Masukkan poin-poin yang ingin dibahas (misal: 1. Definisi, 2. Dalil, 3. Contoh nyata...)"
                    className="w-full px-4 py-3 rounded-xl border border-[#B8860B]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-white/50 min-h-[100px] text-sm"
                  />
                  <p className="mt-1 text-[10px] text-[#8B6B00]/60 italic">Kosongkan jika ingin AI menyusun outline secara otomatis.</p>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !theme}
                  className={cn(
                    "w-full py-4 rounded-full font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg",
                    loading ? "bg-[#B8860B]/70 cursor-not-allowed" : "bg-[#B8860B] hover:bg-[#8B6B00] active:scale-95"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Menyusun Naskah...
                    </>
                  ) : (
                    <>
                      <BookOpen size={20} />
                      Buat Naskah
                    </>
                  )}
                </button>
              </form>
            </section>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-[32px] shadow-sm border border-[#2D241E]/5 overflow-hidden flex flex-col h-full min-h-[600px]"
                >
                  <div className="border-b border-[#B8860B]/10 p-6 flex flex-wrap items-center justify-between gap-4 bg-[#F4EBD0]/20">
                    <h2 className="text-xl font-semibold text-[#4A3700]">Hasil Naskah</h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-[#B8860B]/10 rounded-lg transition-colors text-[#B8860B] flex items-center gap-1 text-sm font-medium"
                        title="Salin Naskah"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                      <button 
                        onClick={downloadWord}
                        className="p-2 hover:bg-[#B8860B]/10 rounded-lg transition-colors text-[#B8860B] flex items-center gap-1 text-sm font-medium"
                        title="Download Word"
                      >
                        <Download size={18} />
                        Word
                      </button>
                      <button 
                        onClick={downloadPDF}
                        className="p-2 hover:bg-[#B8860B]/10 rounded-lg transition-colors text-[#B8860B] flex items-center gap-1 text-sm font-medium"
                        title="Download PDF"
                      >
                        <Printer size={18} />
                        PDF
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    ref={resultRef}
                    className="p-8 md:p-12 overflow-y-auto prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-[#4A3700] prose-p:text-[#2D241E] prose-p:leading-relaxed"
                  >
                    <div className="text-center mb-12 border-b border-dashed border-[#B8860B]/20 pb-8">
                      <h3 className="text-3xl font-bold mb-2 m-0 text-[#4A3700]">{theme}</h3>
                      <p className="text-[#8B6B00] italic m-0 font-medium">{type} • Estimasi {duration}</p>
                    </div>
                    
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => {
                          // Detect Arabic text (very basic check)
                          const text = children?.toString() || '';
                          const isArabic = /[\u0600-\u06FF]/.test(text);
                          return (
                            <p className={cn(
                              "mb-6 text-lg",
                              isArabic ? "text-right font-serif text-3xl leading-[1.8] py-4 bg-[#F4EBD0]/50 px-6 rounded-2xl border-r-4 border-[#D4AF37]" : ""
                            )}>
                              {children}
                            </p>
                          );
                        }
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#F4EBD0]/30 border-2 border-dashed border-[#B8860B]/20 rounded-[32px] flex flex-col items-center justify-center p-12 text-center h-full min-h-[600px]"
                >
                  <div className="w-20 h-20 bg-[#B8860B]/10 rounded-full flex items-center justify-center mb-6">
                    <BookOpen size={40} className="text-[#B8860B]/30" />
                  </div>
                  <h3 className="text-2xl font-semibold text-[#8B6B00]/60 mb-2">Belum ada naskah</h3>
                  <p className="text-[#8B6B00]/40 max-w-xs">Isi tema dan pilih konfigurasi di sebelah kiri untuk mulai menyusun naskah ceramah.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#B8860B]/10 py-12 px-4 text-center mt-12 bg-white/20">
        <p className="text-[#8B6B00]/60 text-sm font-medium">
          &copy; {new Date().getFullYear()} Khutbah Generator • Berdasarkan Manhaj Ahlussunnah wal Jama'ah
        </p>
      </footer>
    </div>
  );
}
