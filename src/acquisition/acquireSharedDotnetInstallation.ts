/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { commands } from 'vscode';
import { callWithTelemetryAndErrorHandling, IActionContext } from 'vscode-azureextensionui';
import { wrapError } from '../util/wrapError';

interface IDotnetAcquireResult {
    dotnetPath: string;
}

export async function acquireSharedDotnetInstallation(version: string): Promise<string> {
    return <string>await callWithTelemetryAndErrorHandling('acquiredSharedDotnet', async (actionContext: IActionContext) => {
        actionContext.errorHandling.rethrow = true;

        try {
            //await commands.executeCommand('dotnet.showAcquisitionLog');
            const commandRes: IDotnetAcquireResult | undefined = await commands.executeCommand<IDotnetAcquireResult>('dotnet.acquire', { version });
            const dotnetPath: string | undefined = commandRes && commandRes.dotnetPath;
            if (!dotnetPath) {
                throw new Error('Couldn\'t resolve the dotnet path!');
            }
            return dotnetPath;
        } catch (err) {
            const linkMessage = `>>>> This extension requires .NET Core for full functionality, but we were unable to download and install a local copy for the extension. If this error persists, please see https://aka.ms/vscode-armtools-dotnet for troubleshooting tips.`;
            err = wrapError(linkMessage, err);
            throw err;
        }
    });
}
