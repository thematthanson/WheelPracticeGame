import Head from 'next/head';
import WheelOfFortune from '../components/WheelOfFortune';

export default function SinglePlayer() {
  return (
    <>
      <Head>
        <title>JensWheelPractice - Wheel of Fortune Training</title>
        <meta name="description" content="JensWheelPractice - Practice for Wheel of Fortune with this authentic training game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1e40af" />
      </Head>
      <WheelOfFortune />
    </>
  );
} 