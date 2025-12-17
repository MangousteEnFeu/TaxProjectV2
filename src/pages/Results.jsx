
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Download, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeclaration } from '@/contexts/DeclarationContext';
import { useToast } from '@/components/ui/use-toast';

const Results = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentDeclaration, fetchDeclaration, loading } = useDeclaration();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchDeclaration(id);
    }
  }, [id, fetchDeclaration]);

  const handleDownloadVaudtax = () => {
    toast({
      title: '🚧 Fonctionnalité à venir',
      description: 'La génération du fichier .vaudtax sera bientôt disponible!',
    });
  };

  const handleSendToAuthorities = () => {
    toast({
      title: '🚧 Fonctionnalité à venir',
      description: 'L\'envoi aux autorités fiscales sera bientôt disponible!',
    });
  };

  if (loading || !currentDeclaration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Résultats - TaxVaud`}</title>
        <meta name="description" content="Résultats de votre déclaration d'impôts." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Résultats</span>
              </div>
            </div>
          </nav>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <Card className="border-green-500/50 bg-gradient-to-r from-green-500/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div>
                    <h2 className="text-2xl font-bold">Déclaration soumise avec succès!</h2>
                    <p className="text-muted-foreground">
                      Votre déclaration pour l'année {currentDeclaration.year} a été traitée
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé fiscal</CardTitle>
                <CardDescription>Aperçu de votre situation fiscale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Revenu total</p>
                    <p className="text-2xl font-bold">
                      CHF {((parseFloat(currentDeclaration.salary || 0) + parseFloat(currentDeclaration.other_income || 0))).toLocaleString('fr-CH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Déductions totales</p>
                    <p className="text-2xl font-bold">
                      CHF {(
                        parseFloat(currentDeclaration.professional_expenses || 0) +
                        parseFloat(currentDeclaration.insurance_premiums || 0) +
                        parseFloat(currentDeclaration.interest_deductions || 0) +
                        parseFloat(currentDeclaration.charitable_donations || 0)
                      ).toLocaleString('fr-CH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Revenu imposable</p>
                    <p className="text-2xl font-bold text-primary">
                      CHF {parseFloat(currentDeclaration.taxable_income || 0).toLocaleString('fr-CH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Impôt estimé</p>
                    <p className="text-2xl font-bold text-primary">
                      CHF {parseFloat(currentDeclaration.estimated_tax || 0).toLocaleString('fr-CH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du déclarant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{currentDeclaration.first_name} {currentDeclaration.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">
                      {currentDeclaration.birth_date ? new Date(currentDeclaration.birth_date).toLocaleDateString('fr-CH') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{currentDeclaration.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ville</p>
                    <p className="font-medium">
                      {currentDeclaration.postal_code} {currentDeclaration.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
                <CardDescription>Téléchargez ou envoyez votre déclaration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDownloadVaudtax} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier .vaudtax
                </Button>
                <Button onClick={handleSendToAuthorities} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer aux autorités fiscales
                </Button>
              </CardContent>
            </Card>

            {/* Information */}
            <Card className="border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-transparent">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Information importante</h3>
                <p className="text-sm text-muted-foreground">
                  Cette déclaration est une estimation. Les montants définitifs seront calculés par 
                  l'administration fiscale du canton de Vaud. Conservez tous vos justificatifs pour 
                  une durée de 10 ans.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Results;
