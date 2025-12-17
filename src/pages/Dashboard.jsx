
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, LogOut, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDeclaration } from '@/contexts/DeclarationContext';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { declarations, loading, createDeclaration, deleteDeclaration } = useDeclaration();
  const { toast } = useToast();
  const [creatingDeclaration, setCreatingDeclaration] = useState(false);

  const handleCreateDeclaration = async () => {
    setCreatingDeclaration(true);
    const currentYear = new Date().getFullYear();
    const declaration = await createDeclaration(currentYear);
    setCreatingDeclaration(false);
    
    if (declaration) {
      navigate(`/declaration/${declaration.id}`);
    }
  };

  const handleDeleteDeclaration = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ?')) {
      await deleteDeclaration(id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', className: 'bg-yellow-500/20 text-yellow-500' },
      submitted: { label: 'Soumise', className: 'bg-blue-500/20 text-blue-500' },
      completed: { label: 'Complétée', className: 'bg-green-500/20 text-green-500' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{`Tableau de bord - TaxVaud`}</title>
        <meta name="description" content="Gérez vos déclarations d'impôts pour le canton de Vaud." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TaxVaud</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </nav>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Tableau de bord</h1>
              <p className="text-muted-foreground">
                Gérez vos déclarations d'impôts en toute simplicité
              </p>
            </div>

            {/* Create New Declaration */}
            <Card className="mb-8 border-primary/50 bg-gradient-to-r from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle>Nouvelle déclaration</CardTitle>
                <CardDescription>
                  Commencez une nouvelle déclaration d'impôts pour l'année en cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCreateDeclaration} 
                  disabled={creatingDeclaration}
                  className="group"
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  {creatingDeclaration ? 'Création...' : 'Créer une déclaration'}
                </Button>
              </CardContent>
            </Card>

            {/* Declarations List */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Mes déclarations</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : declarations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Vous n'avez pas encore de déclarations. Créez-en une pour commencer.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {declarations.map((declaration, index) => (
                    <motion.div
                      key={declaration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card 
                        className="hover:border-primary transition-colors cursor-pointer group"
                        onClick={() => navigate(`/declaration/${declaration.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Déclaration {declaration.year}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {new Date(declaration.created_at).toLocaleDateString('fr-CH')}
                              </CardDescription>
                            </div>
                            {getStatusBadge(declaration.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/declaration/${declaration.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleDeleteDeclaration(declaration.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
