import Image from "next/image";
import { Inter } from "next/font/google";
import Head from "next/head";
import ManualHeader from "../components/ManualHeader";
import Header from "../components/Header";
import LotteryEntrance from "../components/LotteryEntrance";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return (
        <div className="container">
            <Head>
                <title>Smart Contract Lottery App</title>
                <meta name="description" content="Our smart contract lottery app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {/* <ManualHeader /> */}
            <Header />
            <LotteryEntrance />
        </div>
    );
}
