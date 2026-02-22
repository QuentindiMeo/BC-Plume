export const handleUnknownAction = (action: never): never => {
  throw new Error(`Unhandled action type: ${JSON.stringify(action)} — implementation missing for this action.`);
};
