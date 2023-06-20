import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';
import { observer } from 'mobx-react-lite';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value) || key === 'root' || key === 'store' || key === 'rootStore') {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <img src='/img/events.png' />
      </div>
    </header>
  );
}

const Home = observer(() => {
  return (
    <Layout
      title="Events"
      description="Events Application">
      <HomepageHeader />
      <main>
      </main>
    </Layout>
  );
})

export default Home;
