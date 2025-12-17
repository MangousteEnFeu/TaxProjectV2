
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'Déclaration simplifiée',
      description: 'Interface intuitive pour remplir votre déclaration d\'impôts rapidement',
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Vos données sont protégées et stockées de manière sécurisée',
    },
    {
      icon: Clock,
      title: 'Gain de temps',
      description: 'Économisez des heures avec notre processus automatisé',
    },
    {
      icon: CheckCircle,
      title: 'Conforme',
      description: 'Respecte toutes les exigences du canton de Vaud',
    },
  ];

  return (
    <>
      <Helmet>
        <title>{`TaxVaud - Déclaration d'impôts Canton de Vaud`}</title>
        <meta name="description" content="Simplifiez votre déclaration d'impôts pour le canton de Vaud avec notre application moderne et sécurisée." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TaxVaud</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Tableau de bord
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Connexion
                </Button>
              )}
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Déclaration d'impôts{' '}
              <span className="text-primary">simplifiée</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Remplissez votre déclaration d'impôts pour le canton de Vaud en quelques minutes avec notre solution moderne et sécurisée.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="group"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 bg-secondary/30">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              Pourquoi choisir TaxVaud ?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">
              Prêt à simplifier votre déclaration ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez des centaines de contribuables vaudois qui ont déjà simplifié leur déclaration d'impôts.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
            >
              Créer un compte gratuitement
            </Button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-semibold">TaxVaud</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 TaxVaud. Application de déclaration d'impôts pour le canton de Vaud.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
