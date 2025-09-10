import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import TagList from '@/components/TagList';

const TagsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Теги рецептів - Кіт Кухар | Пошук за інгредієнтами та особливостями</title>
        <meta 
          name="description" 
          content="Знайдіть рецепти за тегами: вегетаріанські, швидкі, святкові, дієтичні страви. Пошук рецептів за інгредієнтами та способом приготування." 
        />
        <meta name="keywords" content="теги рецептів, вегетаріанські, швидкі рецепти, дієтичні страви, святкові рецепти, інгредієнти" />
        <meta property="og:title" content="Теги рецептів - Кіт Кухар" />
        <meta property="og:description" content="Знайдіть рецепти за тегами: вегетаріанські, швидкі, святкові, дієтичні страви." />
        <meta property="og:url" content="https://kitkuhar.com/tags" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://kitkuhar.com/tags" />
      </Head>
      
      <Layout 
        title="Теги рецептів - Кіт Кухар"
        description="Знайдіть рецепти за тегами: вегетаріанські, швидкі, святкові, дієтичні страви"
      >
        <TagList />
      </Layout>
    </>
  );
};

export default TagsPage;