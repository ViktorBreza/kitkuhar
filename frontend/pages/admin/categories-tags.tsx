import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CategoriesTagsManager from '@/components/admin/CategoriesTagsManager';

const CategoriesTagsAdminPage: React.FC = () => {
  return (
    <Layout 
      title="Керування категоріями та тегами - Кіт Кухар"
      description="Адмін панель для керування категоріями та тегами"
    >
      <ProtectedRoute adminRequired>
        <CategoriesTagsManager />
      </ProtectedRoute>
    </Layout>
  );
};

export default CategoriesTagsAdminPage;