import type { NextPage } from 'next';
import Head from 'next/head';
import RatList from '../components/RatList';

const Home: NextPage = () => {
  return (
    <div className="container">
      <Head>
        <title>Rat Trap</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <RatList />
      </main>
    </div>
  );
};

export default Home;
