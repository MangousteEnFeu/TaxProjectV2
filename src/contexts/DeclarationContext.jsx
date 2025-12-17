
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const DeclarationContext = createContext(undefined);

export const DeclarationProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [declarations, setDeclarations] = useState([]);
  const [currentDeclaration, setCurrentDeclaration] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDeclarations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_declarations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeclarations(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les déclarations',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchDeclaration = useCallback(async (id) => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_declarations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentDeclaration(data);
      return data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la déclaration',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createDeclaration = useCallback(async (year) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_declarations')
        .insert({
          user_id: user.id,
          year,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: 'Nouvelle déclaration créée',
      });
      
      await fetchDeclarations();
      return data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la déclaration',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchDeclarations]);

  const updateDeclaration = useCallback(async (id, updates) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_declarations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDeclaration(data);
      await fetchDeclarations();
      
      return data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la déclaration',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchDeclarations]);

  const deleteDeclaration = useCallback(async (id) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tax_declarations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: 'Déclaration supprimée',
      });
      
      await fetchDeclarations();
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la déclaration',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchDeclarations]);

  useEffect(() => {
    if (user) {
      fetchDeclarations();
    }
  }, [user, fetchDeclarations]);

  const value = {
    declarations,
    currentDeclaration,
    loading,
    fetchDeclarations,
    fetchDeclaration,
    createDeclaration,
    updateDeclaration,
    deleteDeclaration,
    setCurrentDeclaration,
  };

  return (
    <DeclarationContext.Provider value={value}>
      {children}
    </DeclarationContext.Provider>
  );
};

export const useDeclaration = () => {
  const context = useContext(DeclarationContext);
  if (context === undefined) {
    throw new Error('useDeclaration must be used within a DeclarationProvider');
  }
  return context;
};
