import "../styles/globals.css";
import { NotificationProvider } from "@web3uikit/core";
import { MoralisProvider } from "react-moralis";

export default function App({ Component, pageProps }) {
    return (
        <MoralisProvider initializeOnMount={false}>
            <NotificationProvider>
                <Component {...pageProps} />
            </NotificationProvider>
        </MoralisProvider>
    );
}
