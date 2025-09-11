import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RecipeManager from '@/components/admin/RecipeManager';

const RecipeAdminPage: React.FC = () => {
  return (
    <Layout 
      title="Керування рецептами - Кіт Кухар"
      description="Адмін панель для керування рецептами"
    >
      <ProtectedRoute adminRequired>
        <RecipeManager />
      </ProtectedRoute>
    </Layout>
  );
};

export default RecipeAdminPage;