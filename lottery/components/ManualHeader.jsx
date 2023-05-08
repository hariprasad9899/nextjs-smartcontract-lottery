import { useMoralis } from "react-moralis";
import { useEffect } from "react";

export default function ManualHeader() {
    const { enableWeb3, account, isWeb3Enabled, Moralis, deactivateWeb3, isWeb3EnableLoading } = useMoralis();

    useEffect(() => {
        if (isWeb3Enabled) return;
        if (typeof window !== "undefined" && window.localStorage.connected) {
            enableWeb3();
        }
        console.log("Connected Account");
    }, [isWeb3Enabled]);

    useEffect(() => {
        Moralis.onAccountChanged((account) => {
            console.log(`Account changed to ${account}`);
            if (account == null) {
                window.localStorage.removeItem("connected");
                deactivateWeb3();
                console.log(`Null account found`);
            }
        });
    }, []);

    return (
        <div className="manual-header">
            <h2>Manual Header</h2>
            <button
                onClick={async () => {
                    await enableWeb3();
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem("connected", "injected");
                    }
                }}
                disabled={isWeb3EnableLoading}
            >
                {account ? `Account Connected` : `Connect Account`}
            </button>
            {account ? (
                <div>
                    <h3>Account found {account}</h3>
                </div>
            ) : (
                <div>
                    <h3>Account not found</h3>
                </div>
            )}
        </div>
    );
}
