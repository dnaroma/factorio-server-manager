import React from "react";
import ConfirmDialog from "../../../components/ConfirmDialog";

function FreshRestartConfirmDialog({isOpen, close, onSuccess, saveName}) {
    return (
        <ConfirmDialog
            title="Fresh Restart"
            isOpen={isOpen}
            close={close}
            content={
                <>
                    <p className="mb-4">
                        Regenerate <strong>{saveName}</strong> from the same map settings?
                    </p>
                    <p className="mb-4 text-sm text-gray-600">
                        This will create a new save with identical terrain, resources, and settings —
                        but ALL progress will be reset to zero. The server will restart automatically.
                        A backup of the current save will be created.
                    </p>
                </>
            }
            onSuccess={onSuccess}
        />
    );
}

export default FreshRestartConfirmDialog;
