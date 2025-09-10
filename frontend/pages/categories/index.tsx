import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import CategoryList from '@/components/CategoryList';

const CategoriesPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Категорії рецептів - Кіт Кухар | Українські рецепти за типом страви</title>
        <meta 
          name="description" 
          content="Знайдіть рецепти за категоріями: супи, основні страви, десерти, салати та інше. Великий вибір українських рецептів від Кіт Кухар." 
        />
        <meta name="keywords" content="категорії рецептів, супи, основні страви, десерти, салати, українська кухня" />
        <meta property="og:title" content="Категорії рецептів - Кіт Кухар" />
        <meta property="og:description" content="Знайдіть рецепти за категоріями: супи, основні страви, десерти, салати та інше." />
        <meta property="og:url" content="https://kitkuhar.com/categories" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://kitkuhar.com/categories" />
      </Head>
      
      <Layout 
        title="Категорії рецептів - Кіт Кухар"
        description="Знайдіть рецепти за категоріями: супи, основні страви, десерти, салати та інше"
      >
        <CategoryList />
      </Layout>
    </>
  );
};

export default CategoriesPage;