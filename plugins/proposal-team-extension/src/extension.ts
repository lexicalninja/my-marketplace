import * as vscode from 'vscode';
import { ProposalTeamParticipant } from './participant';

let participant: ProposalTeamParticipant;

export function activate(context: vscode.ExtensionContext) {
    participant = new ProposalTeamParticipant(context);
    context.subscriptions.push(participant.register());
}

export function deactivate() {}
