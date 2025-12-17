import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { 
  FileText, 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  File, 
  FileSpreadsheet,
  FileImage,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDeclaration } from '@/contexts/DeclarationContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { findValueInText, findValueInExcel } from '@/lib/extractionUtils';

// Set worker for PDF.js (using unpkg to avoid build config issues in this environment)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const ALLOWED_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Declaration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { currentDeclaration, fetchDeclaration, updateDeclaration, loading: dataLoading } = useDeclaration();
  const { toast } = useToast();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [currentProcessingFile, setCurrentProcessingFile] = useState('');

  useEffect(() => {
    if (id) {
      fetchDeclaration(id);
    }
  }, [id, fetchDeclaration]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Type de fichier non supporté. Utilisez PDF, JPG, PNG ou Excel.` 
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Fichier trop volumineux. Max 10 MB.` 
      };
    }
    return { valid: true };
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [];
    let errors = [];

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        newFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur de validation',
        description: (
          <ul className="list-disc pl-4 mt-2">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        ),
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setExtractionError(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setExtractedData(null);
      setExtractionError(null);
    }
  };

  // --- Real Extraction Logic ---

  const extractFromPDF = async (file) => {
    console.log(`Processing PDF: ${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    console.log("PDF Content extracted:", fullText.substring(0, 100) + "...");

    // PDF Strategy: Extract Salary and Professional Expenses
    const salary = findValueInText(fullText, ['salaire net', 'net salaire', 'salaire', 'total net', 'revenu net']);
    const expenses = findValueInText(fullText, ['frais de transport', 'déduction', 'frais professionnels', 'repas', 'transport']);

    return {
      type: 'pdf',
      source: file.name,
      data: {
        salary: salary,
        professional_expenses: expenses
      }
    };
  };

  const extractFromExcel = async (file) => {
    console.log(`Processing Excel: ${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to array of arrays
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Excel Strategy: Extract Other Income and Securities
    const otherIncome = findValueInExcel(rows, ['dividende', 'accessoire', 'autre revenu', 'bonus', 'gain']);
    const securities = findValueInExcel(rows, ['titre', 'fortune', 'action', 'compte', 'solde', 'valeur']);

    return {
      type: 'excel',
      source: file.name,
      data: {
        other_income: otherIncome,
        securities_value: securities
      }
    };
  };

  const extractFromImage = async (file) => {
    console.log(`Processing Image (OCR): ${file.name}`);
    
    const { data: { text } } = await Tesseract.recognize(
      file,
      'fra', // French language
      { 
        logger: m => {
          if (m.status === 'recognizing text') {
             // Optional: update progress UI specifically for OCR
             console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
          }
        } 
      }
    );

    console.log("OCR Text extracted:", text.substring(0, 100) + "...");

    // Image Strategy: Extract Insurance and Donations
    const insurance = findValueInText(text, ['prime', 'assurances', 'maladie', 'lamal', 'helsana', 'swica', 'groupe mutuel']);
    const donations = findValueInText(text, ['don', 'bienfaisance', 'caritatif', 'fondation', 'attestation']);

    return {
      type: 'image',
      source: file.name,
      data: {
        insurance_premiums: insurance,
        charitable_donations: donations
      }
    };
  };

  const processFile = async (file) => {
    setCurrentProcessingFile(file.name);
    try {
      if (file.type === 'application/pdf') {
        return await extractFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return await extractFromExcel(file);
      } else if (file.type.startsWith('image/')) {
        return await extractFromImage(file);
      }
    } catch (e) {
      console.error(`Error processing ${file.name}:`, e);
      return { 
        type: 'error', 
        source: file.name, 
        error: e.message,
        data: {} 
      };
    }
    return { type: 'unknown', source: file.name, data: {} };
  };

  const runExtraction = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setExtractionError(null);

    try {
      // Simulate minimal upload delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploading(false);
      setExtracting(true);

      // Process files sequentially to not kill browser performance with OCR/PDF parsing
      const results = [];
      for (const file of files) {
        const result = await processFile(file);
        results.push(result);
      }
      
      setCurrentProcessingFile('');

      // Aggregate Results
      const aggregatedData = {
        salary: 0,
        other_income: 0,
        professional_expenses: 0,
        insurance_premiums: 0,
        securities_value: 0,
        charitable_donations: 0,
        first_name: user?.email?.split('@')[0] || 'Déclarant',
        last_name: 'Vaudois',
        sources: []
      };

      let hasErrors = false;

      results.forEach(res => {
        if (res.type === 'error') {
          hasErrors = true;
          aggregatedData.sources.push({
            name: res.source,
            type: 'error',
            error: res.error,
            found: false
          });
        } else {
          aggregatedData.salary += res.data.salary || 0;
          aggregatedData.other_income += res.data.other_income || 0;
          aggregatedData.professional_expenses += res.data.professional_expenses || 0;
          aggregatedData.insurance_premiums += res.data.insurance_premiums || 0;
          aggregatedData.securities_value += res.data.securities_value || 0;
          aggregatedData.charitable_donations += res.data.charitable_donations || 0;
          
          const dataFound = Object.values(res.data).some(val => val > 0);
          
          aggregatedData.sources.push({
            name: res.source,
            type: res.type,
            found: dataFound
          });
        }
      });

      setExtractedData(aggregatedData);
      setExtracting(false);

      if (hasErrors) {
        toast({
          variant: "destructive",
          title: "Extraction partielle",
          description: "Certains fichiers n'ont pas pu être lus correctement.",
        });
      } else {
        toast({
          title: "Extraction terminée",
          description: `${files.length} fichiers traités avec succès.`,
        });
      }

    } catch (error) {
      setExtracting(false);
      setExtractionError(error.message || "Erreur critique lors de l'extraction.");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'extraire les données."
      });
    }
  };

  const calculateTax = (data) => {
    const totalIncome = data.salary + data.other_income;
    const totalDeductions = data.professional_expenses + data.insurance_premiums + data.charitable_donations;
    const taxable = Math.max(0, totalIncome - totalDeductions);
    
    // Vaud simplified progressive tax logic
    let tax = 0;
    if (taxable <= 20000) tax = taxable * 0.05; 
    else if (taxable <= 50000) tax = 1000 + (taxable - 20000) * 0.10;
    else tax = 4000 + (taxable - 50000) * 0.15;
    
    const taxableWealth = Math.max(0, data.securities_value - 50000);
    const wealthTax = taxableWealth * 0.001;

    return Math.floor(tax + wealthTax);
  };

  const handleConfirmAndSubmit = async () => {
    if (!id || !extractedData) return;
    setUploading(true);

    try {
      const taxableIncome = Math.max(0, 
        (extractedData.salary + extractedData.other_income) - 
        (extractedData.professional_expenses + extractedData.insurance_premiums + extractedData.charitable_donations)
      );
      
      const estimatedTax = calculateTax(extractedData);

      await updateDeclaration(id, {
        status: 'submitted',
        salary: extractedData.salary,
        other_income: extractedData.other_income,
        professional_expenses: extractedData.professional_expenses,
        insurance_premiums: extractedData.insurance_premiums,
        charitable_donations: extractedData.charitable_donations,
        securities_value: extractedData.securities_value,
        taxable_income: taxableIncome,
        estimated_tax: estimatedTax,
        first_name: extractedData.first_name,
        last_name: extractedData.last_name,
      });

      navigate(`/results/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de soumission",
        description: "Impossible de sauvegarder la déclaration."
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5" />;
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Déclaration ${currentDeclaration?.year || ''} - TaxVaud`}</title>
        <meta name="description" content="Téléchargez vos documents pour la déclaration d'impôts." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold hidden sm:inline">
                  Dossier {currentDeclaration?.year}
                </span>
              </div>
            </div>
          </nav>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-3 text-primary">Déclaration Automatique</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Téléchargez vos vrais documents. Nous utilisons l'IA pour extraire les données :
                <br />
                <span className="text-xs">PDF (Texte), Excel (Valeurs), Images (OCR)</span>
              </p>
            </div>

            <AnimatePresence>
              {extractionError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur d'analyse</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p>{extractionError}</p>
                      <Button size="sm" variant="outline" onClick={() => setExtractionError(null)} className="mt-2 border-red-800 hover:bg-red-900/20 text-red-200">
                        Fermer
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`grid gap-8 ${extractedData ? 'lg:grid-cols-2' : ''}`}>
              
              <div className="space-y-6">
                {!extractedData && (
                  <Card className={`border-dashed border-2 transition-colors duration-200 ${files.length > 0 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${uploading || extracting ? 'bg-primary/20 scale-110' : 'bg-secondary'}`}>
                        {uploading ? (
                          <Upload className="h-10 w-10 text-primary animate-bounce" />
                        ) : extracting ? (
                          <Search className="h-10 w-10 text-primary animate-pulse" />
                        ) : (
                          <Upload className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>

                      <h3 className="text-xl font-semibold mb-2">
                        {uploading ? 'Téléchargement...' : extracting ? 'Analyse intelligente en cours...' : 'Glissez vos documents'}
                      </h3>
                      
                      {extracting && (
                        <p className="text-primary font-medium text-sm animate-pulse mb-4">
                          Traitement de : {currentProcessingFile}
                        </p>
                      )}
                      
                      <p className="text-muted-foreground max-w-sm mb-8 text-sm">
                        PDF (Texte), Excel (Tableaux), Images (OCR).
                      </p>

                      <div className="flex gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                          onChange={handleFileChange}
                          disabled={uploading || extracting}
                        />
                        
                        {!uploading && !extracting && (
                          <Button 
                            size="lg" 
                            onClick={() => fileInputRef.current?.click()}
                            className="shadow-lg shadow-primary/20"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Choisir fichiers
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {files.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">Fichiers ({files.length})</CardTitle>
                        {!extractedData && !uploading && !extracting && (
                          <Button size="sm" onClick={runExtraction}>Lancer l'analyse</Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`p-2 rounded-md bg-background/50 text-muted-foreground`}>
                               {getFileIcon(file.type)}
                             </div>
                             <div className="flex flex-col min-w-0">
                               <span className="text-sm font-medium truncate">{file.name}</span>
                               <span className="text-xs text-muted-foreground uppercase">{file.type.split('/')[1] || 'Fichier'}</span>
                             </div>
                          </div>
                          {!extractedData && !uploading && !extracting && (
                             <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          )}
                          {extractedData && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <Alert className="border-green-800 bg-green-900/20 text-green-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertTitle>Extraction terminée</AlertTitle>
                    <AlertDescription>
                      Vérifiez les données extraites ci-dessous avant de valider.
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenus détectés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <div className="flex flex-col">
                           <span className="text-muted-foreground">Salaire Net</span>
                           <span className="text-xs text-muted-foreground/50">Via PDF (Mots-clés: salaire, net)</span>
                        </div>
                        <span className="font-mono font-medium">{extractedData.salary.toLocaleString('fr-CH')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                         <div className="flex flex-col">
                           <span className="text-muted-foreground">Autres Revenus</span>
                           <span className="text-xs text-muted-foreground/50">Via Excel (Col: dividende, bonus)</span>
                         </div>
                         <span className="font-mono font-medium">{extractedData.other_income.toLocaleString('fr-CH')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                         <div className="flex flex-col">
                           <span className="text-muted-foreground">Fortune (Titres)</span>
                           <span className="text-xs text-muted-foreground/50">Via Excel (Col: titre, action)</span>
                         </div>
                         <span className="font-mono font-medium">{extractedData.securities_value.toLocaleString('fr-CH')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Déductions détectées</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <div className="flex flex-col">
                           <span className="text-muted-foreground">Frais Professionnels</span>
                           <span className="text-xs text-muted-foreground/50">Via PDF (Mots-clés: frais, transport)</span>
                        </div>
                        <span className="font-mono font-medium">{extractedData.professional_expenses.toLocaleString('fr-CH')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                         <div className="flex flex-col">
                           <span className="text-muted-foreground">Primes Maladie</span>
                           <span className="text-xs text-muted-foreground/50">Via Image OCR (Mots-clés: prime, lamal)</span>
                         </div>
                         <span className="font-mono font-medium">{extractedData.insurance_premiums.toLocaleString('fr-CH')}</span>
                      </div>
                       <div className="flex justify-between items-center py-2">
                         <div className="flex flex-col">
                           <span className="text-muted-foreground">Dons</span>
                           <span className="text-xs text-muted-foreground/50">Via Image OCR (Mots-clés: don)</span>
                         </div>
                         <span className="font-mono font-medium">{extractedData.charitable_donations.toLocaleString('fr-CH')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setExtractedData(null); setFiles([]); }}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button className="flex-1" onClick={handleConfirmAndSubmit}>
                      Valider tout
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Declaration;