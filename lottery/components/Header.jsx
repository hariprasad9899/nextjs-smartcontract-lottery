import { ConnectButton } from "@web3uikit/web3";

export default function Header() {
    return (
        <div className="border-b-2 p-5 flex flex-row">
            <h2 className="py-3 px-3 font-bold text-2xl">Decentralized Lottery</h2>
            <div className="ml-auto py-2 px-4">
                <ConnectButton moralisAuth={false} />
            </div>
        </div>
    );
}
