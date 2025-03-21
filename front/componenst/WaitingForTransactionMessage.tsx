import React from "react";

type WaitinForTransactionMessageProps = {
    txHash: string;
}

const WaitinForTransactionMessage: React.FunctionComponent<
    WaitinForTransactionMessageProps
    > = ({txHash}) => {
        return (
            <div>
                Waiting for transaction <strong>{txHash}</strong>
            </div>
        );
    };

export default WaitinForTransactionMessage;
