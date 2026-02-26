"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const participant_1 = require("./participant");
let participant;
function activate(context) {
    participant = new participant_1.ProposalTeamParticipant(context);
    context.subscriptions.push(participant.register());
}
function deactivate() { }
//# sourceMappingURL=extension.js.map