import { createContext, useContext } from "react";
import type { OnDone } from "../steps/BasicSteps";

export const SubmissionContext = createContext<OnDone>(() => {});
export const useSubmission = () => useContext(SubmissionContext);
