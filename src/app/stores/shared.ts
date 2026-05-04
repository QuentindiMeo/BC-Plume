import { UnhandledActionError } from "@/shared/errors";

export const handleUnknownAction = (action: never): never => {
  throw new UnhandledActionError(action);
};
