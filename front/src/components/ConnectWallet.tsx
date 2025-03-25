import React from "react";
import NetworkErrorMessage from "./NetworkErrorMessage";

type ConnectWalletProps = {
    connectWallet: React.MouseEventHandler<HTMLButtonElement>;
    dismiss: React.MouseEventHandler<HTMLButtonElement>;
    networkError: string | undefined;
};

const ConnectWallet: React.FunctionComponent<ConnectWalletProps> = ({
    connectWallet,
    dismiss,
    networkError
}) => {
        return (     
            <>
            <div>
                {networkError 
                    && (<NetworkErrorMessage message = {networkError} dismiss={dismiss} />
                )}      
            </div>            
            <button className="btn-primary" onClick={connectWallet}>
                Connect Wallet
            </button>
        </>    
        );        
    };

export default ConnectWallet;